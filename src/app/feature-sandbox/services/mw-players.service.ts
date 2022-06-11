import { Injectable } from '@angular/core';
import { PLAYER_COLORS } from 'src/app/core/dictionaries/colors.const';
import { LEVELS_BREAKPOINTS } from 'src/app/core/dictionaries/levels.const';
import { NEUTRAL_FRACTION_UNIT_TYPES, NEUTRAL_TYPES_ENUM } from 'src/app/core/dictionaries/unit-types/neutral-unit-types.dictionary';
import { BLINDNESS_SPELL, ENCHANT_SPELL, METEOR_SPELL, POISON_CLOUD_SPELL, RAIN_OF_FIRE_SPELL } from 'src/app/core/dictionaries/spells.const';
import { HF_TYPES_ENUM, HUMANS_FRACTION_UNIT_TYPES } from 'src/app/core/dictionaries/unit-types/unit-types.dictionary';
import { PlayerInstanceModel, PlayerModel, PlayerTypeEnum, UnitGroupInstModel, UnitGroupModel } from 'src/app/core/model/main.model';
import { ResourcesModel } from 'src/app/core/model/resources.types';
import { RandomUtils } from 'src/app/core/utils/common.utils';
import { BattleEventsService } from './mw-battle-events.service';
import { BattleEventTypeEnum } from './types';
import { MwSpellsService } from './mw-spells.service';


const mainPlayerGroups = RandomUtils.createRandomArmy({
  fraction: HUMANS_FRACTION_UNIT_TYPES,
  maxUnitGroups: 5,
  minUnitGroups: 3,
  units: [
    [HF_TYPES_ENUM.Pikemans, 10, 60, 3],
    [HF_TYPES_ENUM.Archers, 14, 36, 2],
    [HF_TYPES_ENUM.Knights, 8, 17, 2],
    [HF_TYPES_ENUM.Cavalry, 3, 7, 2],
  ],
});

const neutralGroups = RandomUtils.createRandomArmy({
  fraction: NEUTRAL_FRACTION_UNIT_TYPES,
  maxUnitGroups: 5,
  minUnitGroups: 2,
  units: [
    [NEUTRAL_TYPES_ENUM.Gnolls, 10, 40, 3],
    // [NEUTRAL_TYPES_ENUM.Gnolls, 10, 15, 3],
    [NEUTRAL_TYPES_ENUM.ForestTrolls, 10, 25, 2],
    [NEUTRAL_TYPES_ENUM.Thiefs, 12, 37, 2],
    [NEUTRAL_TYPES_ENUM.Ghosts, 24, 42, 3],
  ],
});

export enum PLAYER_IDS {
  Main = 'main',
  Neutral = 'neutral',
}

const defaultResources: ResourcesModel = {
  gems: 0,
  gold: 0,
  redCrystals: 0,
  wood: 0,
}



@Injectable({
  providedIn: 'root'
})
export class MwPlayersService {
  public players: Map<string, PlayerInstanceModel> = new Map([
    this.createPlayerEntry(PLAYER_IDS.Main, {
      color: PLAYER_COLORS.BLUE,
      resources: {
        ...defaultResources,
        gold: 3000,
        wood: 5,
        redCrystals: 2,
      },
      type: PlayerTypeEnum.Player,
      hero: {
        name: 'Taltir',
        experience: 0,
        level: 1,
        stats: {
          maxMana: 25,
          currentMana: 15,
        },
        freeSkillpoints: 0,
        spells: [
          this.spellsService.createSpellInstance(RAIN_OF_FIRE_SPELL),
          this.spellsService.createSpellInstance(POISON_CLOUD_SPELL),
          this.spellsService.createSpellInstance(METEOR_SPELL),
          this.spellsService.createSpellInstance(BLINDNESS_SPELL),
          this.spellsService.createSpellInstance(ENCHANT_SPELL),
        ],
      },
      unitGroups: mainPlayerGroups,
    }),
    this.createPlayerEntry(PLAYER_IDS.Neutral, {
      color: PLAYER_COLORS.GRAY,
      type: PlayerTypeEnum.AI,
      hero: {
        name: null,
        experience: 0,
        level: 0,
        stats: {
          maxMana: 5,
          currentMana: 1,
        },
        freeSkillpoints: 0,
        spells: [],
      },
      unitGroups: neutralGroups,
      resources: {
        ...defaultResources,
      },
    }),
  ]);

  private currentPlayerId: string = PLAYER_IDS.Main;

  constructor(
    private readonly events: BattleEventsService,
    private readonly spellsService: MwSpellsService,
  ) { }

  public getCurrentPlayer(): PlayerInstanceModel {
    return this.players.get(this.currentPlayerId) as PlayerInstanceModel;
  }

  public getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }

  public addExperienceToPlayer(playerId: string, experience: number): void {
    const player = this.getPlayerById(playerId);
    const playerHero = player.hero;
    playerHero.experience += experience;

    const currentXpToNextLevel = LEVELS_BREAKPOINTS[playerHero.level + 1];

    if (currentXpToNextLevel <= playerHero.experience) {
      playerHero.level++;
      playerHero.freeSkillpoints++;
      playerHero.experience = playerHero.experience - currentXpToNextLevel;
      this.events.dispatchEvent({ type: BattleEventTypeEnum.Player_Gains_Level });
    }
  }

  public getPlayerById(playerId: string): PlayerInstanceModel {
    return this.players.get(playerId) as PlayerInstanceModel;
  }

  public getEnemyPlayer(): PlayerInstanceModel {
    return this.players.get(PLAYER_IDS.Neutral) as PlayerInstanceModel;
  }

  public getUnitGroupsOfPlayer(playerId: string): UnitGroupInstModel[] {
    const player = this.players.get(playerId) as PlayerInstanceModel;
    return player.unitGroups.map((unitGroup: UnitGroupModel) => {
      unitGroup.ownerPlayerRef = player;

      const unitGroupInstance = unitGroup as UnitGroupInstModel;

      unitGroupInstance.spells = unitGroupInstance.spells ?? [];

      return unitGroupInstance;
    })
  }

  public addUnitGroupToTypeStack(player: PlayerModel, unitGroup: UnitGroupModel): void {
    const sameTypeStack = player.unitGroups.find(group => group.type === unitGroup.type);
    if (sameTypeStack) {
      sameTypeStack.count += unitGroup.count;
    } else {
      player.unitGroups.push(unitGroup);
    }
  }

  public addManaToPlayer(player: PlayerInstanceModel, mana: number): void {
    player.hero.stats.currentMana += mana;
  }

  private createPlayer(id: string, playerInfo: PlayerModel): PlayerInstanceModel {
    const player: PlayerInstanceModel = {
      id,
      ...playerInfo,
    }

    return player;
  }

  private createPlayerEntry(id: string, playerInfo: PlayerModel): [string, PlayerInstanceModel] {
    return [id, this.createPlayer(id, playerInfo)];
  }
}
