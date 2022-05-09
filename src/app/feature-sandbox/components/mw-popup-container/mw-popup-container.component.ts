import { Component, OnInit } from '@angular/core';
import { NeutralCampStructure, NeutralRewardTypesEnum } from "src/app/core/model/structures.types";
import { BattleEventsService, BattleEventTypeEnum, BattleStateService, FightEndsPopup, LossModel, MwPlayersService, PopupModel, PopupTypesEnum, RoundEndsEvent, StructHireRewardPopup, StructRewardPopup } from '../../services';

@Component({
  selector: 'mw-popup-container',
  templateUrl: './mw-popup-container.component.html',
  styleUrls: ['./mw-popup-container.component.scss']
})
export class MwPopupContainerComponent implements OnInit {

  public popups: PopupModel[] = [];
  public popupTypes: typeof PopupTypesEnum = PopupTypesEnum;

  constructor(
    private readonly battleEvents: BattleEventsService,
    private readonly battleState: BattleStateService,
    private readonly playersService: MwPlayersService,
  ) {
    this.battleEvents.onEvents({
      [BattleEventTypeEnum.Fight_Ends]: (event: RoundEndsEvent) => {
        const fightEndsPopup: FightEndsPopup = {
          type: PopupTypesEnum.FightEnds,
          isWin: event.win,
          playerLosses: this.getPlayerLosses(this.playersService.getCurrentPlayerId()),
          enemyLosses: this.getPlayerLosses(this.playersService.getEnemyPlayer().id),
          struct: event.struct as NeutralCampStructure,
        };

        this.popups.push(
          fightEndsPopup
        );
      },
      [BattleEventTypeEnum.Display_Reward_Popup]: event => {
        const struct = event.struct;

        const structReward = struct.reward;
        if (structReward) {
          switch (structReward.type) {
            case NeutralRewardTypesEnum.Resources:
              const structRewardPopup: StructRewardPopup = {
                type: PopupTypesEnum.StructResourcesReward,
                struct: struct,
              };

              this.popups.push(structRewardPopup);
              break;

            case NeutralRewardTypesEnum.UnitsHire:
              const structHirePopup: StructHireRewardPopup = {
                type: PopupTypesEnum.HiringReward,
                struct: struct,
              }

              this.popups.push(structHirePopup);
          }
        }
      },
    }).subscribe();
  }

  public onContinue(popup: FightEndsPopup): void {
    this.removePopup(popup);

    this.battleEvents.dispatchEvent({ type: BattleEventTypeEnum.Struct_Completed, struct: popup.struct });
  }

  public removePopup(popupToRemove: PopupModel): void {
    this.popups = this.popups.filter(popup => popup !== popupToRemove);
  }

  private getPlayerLosses(playerId: string): LossModel[] {
    const playerLossesMap = this.battleState.playerLosses[playerId];

    return [...playerLossesMap].map(loss => ({ type: loss[0], count: loss[1] }));
  }

  ngOnInit(): void {
  }

}
