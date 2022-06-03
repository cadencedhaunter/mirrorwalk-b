import { Injectable } from '@angular/core';
import { BaseAbilitiesTable } from 'src/app/core/dictionaries/abilities.const';
import { AbilityTypesEnum } from 'src/app/core/model/abilities.types';
import { UnitGroupModel } from 'src/app/core/model/main.model';
import { CommonUtils } from 'src/app/core/utils/common.utils';

export interface DamageInfo {
  attacker: UnitGroupModel;

  attackingUnitsCount: number;

  minDamage: number;
  maxDamage: number;

  attackSuperiority: number;
  damageMultiplier: number;

  multipliedMinDamage: number;
  multipliedMaxDamage: number;
}

export interface DetailedDamageInfo extends DamageInfo {
  attacked: UnitGroupModel;

  enemyCanCounterattack: boolean;
  minUnitCountLoss: number;
  maxUnitCountLoss: number;

}

export interface FinalDamageInfo {
  finalDamage: number;
  /* unit loss adjusted so it can't be higher than count of attacked units */
  finalUnitLoss: number;
  /* not adjusted value */
  finalTotalUnitLoss: number;
  tailHpLeft: number;
  isDamageFatal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MwUnitGroupStateService {

  constructor() { }

  public getUnitGroupTotalHp(unitGroup: UnitGroupModel): number {
    return (unitGroup.count - 1) * unitGroup.type.baseStats.health + (unitGroup.tailUnitHp ?? 0);
  }

  public getUnitGroupDamage(unitGroup: UnitGroupModel, attackSuperiority: number = 0): DamageInfo {
    const groupBaseStats = unitGroup.type.baseStats;
    const groupDamageInfo = groupBaseStats.damageInfo;
    const unitsCount = unitGroup.count;

    const minDamage = groupDamageInfo.minDamage * unitGroup.count;
    const maxDamage = groupDamageInfo.maxDamage * unitGroup.count;

    /* influence of attack/defence difference on damage */
    const damageMultiplier = attackSuperiority * (attackSuperiority >= 0 ? 0.05 : 0.035);

    const multipliedMinDamage = minDamage + (minDamage * damageMultiplier);
    const multipliedMaxDamage = maxDamage + (maxDamage * damageMultiplier);

    return {
      attacker: unitGroup,
      attackingUnitsCount: unitsCount,

      minDamage: minDamage,
      maxDamage: maxDamage,

      attackSuperiority: attackSuperiority,
      damageMultiplier: damageMultiplier,

      multipliedMinDamage: Math.round(multipliedMinDamage),
      multipliedMaxDamage: Math.round(multipliedMaxDamage),
    };
  }

  public getDetailedAttackInfo(attackingGroup: UnitGroupModel, attackedGroup: UnitGroupModel): DetailedDamageInfo {
    const attackerUnitType = attackingGroup.type;
    const attackedUnitType = attackedGroup.type;

    const attackerBaseStats = attackerUnitType.baseStats;
    const attackedBaseStats = attackedUnitType.baseStats;

    const attackSupperiority = attackerBaseStats.attackRating - attackedBaseStats.defence;

    const damageInfo = this.getUnitGroupDamage(attackingGroup, attackSupperiority);

    const minUnitCountLoss = this.calcUnitCountLoss(damageInfo.multipliedMinDamage, attackedBaseStats.health, attackedGroup.count);
    const maxUnitCountLoss = this.calcUnitCountLoss(damageInfo.multipliedMaxDamage, attackedBaseStats.health, attackedGroup.count);

    const canAttackedCounterAttack = this.canGroupCounterattack(attackedGroup);

    const damageInfoDetails: DetailedDamageInfo = {
      ...damageInfo,
      attacked: attackedGroup,

      enemyCanCounterattack: canAttackedCounterAttack,

      minUnitCountLoss: minUnitCountLoss,
      maxUnitCountLoss: maxUnitCountLoss,
    };

    return damageInfoDetails;
  }

  public getFinalDamageInfoFromDamageDetailedInfo(damageInfo: DetailedDamageInfo): FinalDamageInfo {
    const rolledMultipliedDamage = CommonUtils.randIntInRange(damageInfo.multipliedMinDamage, damageInfo.multipliedMaxDamage);

    return this.getFinalDamageInfo(damageInfo.attacked, rolledMultipliedDamage);
  }

  public getFinalDamageInfo(target: UnitGroupModel, damage: number): FinalDamageInfo {
    const attackedGroup = target;
    const targetGroupTotalHealth = this.getUnitGroupTotalHp(attackedGroup);

    const targetGroupHealthAfterDamage = targetGroupTotalHealth - damage;
    const newTailHp = targetGroupHealthAfterDamage % attackedGroup.type.baseStats.health;
    const unitLoss = Math.floor(damage / attackedGroup.type.baseStats.health);

    console.log(`final damage to ${attackedGroup.type.name}, 
          current tail: ${attackedGroup.tailUnitHp}
          total target hp: ${targetGroupTotalHealth}
          count ${attackedGroup.count}

          final damage ${damage}
          final target group health ${targetGroupHealthAfterDamage}
          new hp tail ${newTailHp}
          unit loss ${unitLoss}
          `
    );

    return {
      finalDamage: damage,
      finalUnitLoss: unitLoss > target.count ? target.count : unitLoss,
      finalTotalUnitLoss: unitLoss,
      tailHpLeft: newTailHp,
      isDamageFatal: target.count <= unitLoss,
    };
  }

  public dealPureDamageToUnitGroup(target: UnitGroupModel, damage: number): FinalDamageInfo {
    const finalDamageInfo = this.getFinalDamageInfo(target, damage);
    target.count -= finalDamageInfo.finalUnitLoss;
    target.tailUnitHp = finalDamageInfo.tailHpLeft;

    return finalDamageInfo;
  }

  public calcUnitCountLoss(totalDamage: number, groupTypeHealth: number, groupCount: number): number {
    const unitCountLoss = Math.floor(totalDamage / groupTypeHealth);
    return unitCountLoss > groupCount ? groupCount : unitCountLoss;
  }

  public canGroupCounterattack(group: UnitGroupModel): boolean {
    return !!BaseAbilitiesTable.get(group.type)?.some(ability => ability.type === AbilityTypesEnum.BaseCounterAttack);
  }

  public rollDamage(damageDetailsInfo: DamageInfo): number {
    return CommonUtils.randIntInRange(damageDetailsInfo.multipliedMinDamage, damageDetailsInfo.multipliedMaxDamage);
  }
}