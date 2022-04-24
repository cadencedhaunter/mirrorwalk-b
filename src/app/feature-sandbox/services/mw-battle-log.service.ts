import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PlayerModel, UnitTypeModel } from 'src/app/core/model/main.model';
import { BattleEventsService, BattleEventTypeEnum } from './mw-battle-events.service';

export enum HistoryLogTypesEnum {
  SimpleMsg = 'simple-msg',
  RoundInfoMsg = 'round-info-msg',
  DealtDamageMsg = 'dealt-damage-msg',
}

export interface HistoryMessageModel {
  type: HistoryLogTypesEnum;
}

export interface SimpleMessage extends HistoryMessageModel {
  type: HistoryLogTypesEnum.SimpleMsg;
  message: string;
}

export interface RoundInfoMessage extends HistoryMessageModel {
  type: HistoryLogTypesEnum.RoundInfoMsg;
  message: string;
}

export interface DealtDamageMessage extends HistoryMessageModel {
  type: HistoryLogTypesEnum.DealtDamageMsg;
  attackingPlayer: PlayerModel;
  attackedPlayer: PlayerModel;
  attacker: UnitTypeModel;
  attacked: UnitTypeModel;
  losses: number;
  damage: number;
}


@Injectable({
  providedIn: 'root'
})
export class MwBattleLogService {

  public history: HistoryMessageModel[] = [];
  public historyEvent$: Subject<void> = new Subject();

  constructor(
    private readonly battleEvents: BattleEventsService,
  ) {
    this.battleEvents.listenEventsOfTypes([
      BattleEventTypeEnum.On_Group_Damaged,
      BattleEventTypeEnum.On_Group_Dies,
      BattleEventTypeEnum.On_Fight_Ends,
      BattleEventTypeEnum.Round_Player_Turn_Starts,
      BattleEventTypeEnum.Fight_Next_Round_Starts,
    ]).subscribe((event) => {
      switch (event.type) {
        case BattleEventTypeEnum.On_Group_Damaged:
          this.logDealtDamageMessage({
            attacked: event.attackedGroup.type,
            attackedPlayer: event.attackedGroup.ownerPlayerRef as PlayerModel,
            attacker: event.attackerGroup.type,
            attackingPlayer: event.attackerGroup.ownerPlayerRef as PlayerModel,
            damage: event.damage,
            losses: event.loss,
          });
          break;
        case BattleEventTypeEnum.On_Group_Dies:
          this.logSimpleMessage(`Group of ${event.target.type.name} dies, losing ${event.loss} units`);
          break;
        case BattleEventTypeEnum.On_Fight_Ends:
          this.logRoundInfoMessage(event.win ? 'Win!' : 'Defeat');
          break;
        case BattleEventTypeEnum.Round_Player_Turn_Starts:
          this.logRoundInfoMessage(`Player ${event.currentPlayer.type} starts his turn`);
          break;
        case BattleEventTypeEnum.Fight_Next_Round_Starts:
          this.logRoundInfoMessage(`Round ${event.round} starts`);
          break;
      }
    });
  }

  public logSimpleMessage(log: string): void {
    const simpleMessage: SimpleMessage = { type: HistoryLogTypesEnum.SimpleMsg, message: log };
    this.pushMessage(simpleMessage);
  }

  public logRoundInfoMessage(msg: string): void {
    const roundInfoMessage: RoundInfoMessage = { type: HistoryLogTypesEnum.RoundInfoMsg, message: msg };
    this.pushMessage(roundInfoMessage);
  }

  public logDealtDamageMessage(info: Omit<DealtDamageMessage, 'type'>): void {
    const dealtDamageLog: DealtDamageMessage = {
      type: HistoryLogTypesEnum.DealtDamageMsg,
      ...info,
    };

    this.pushMessage(dealtDamageLog);
  }

  public pushMessage(message: HistoryMessageModel): void {
    this.history.push(message);
    this.historyEvent$.next();
  }
}