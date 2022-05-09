import { AbilityModel } from "./abilities.types";
import { ResourcesModel, ResourceType } from "./resources.types";

interface RequirementModel extends Partial<ResourcesModel> {
    /* heroLevel?: number;
    gold?: number;
    redCrystals?: number;
    glory?: number;
    gems?: number; */
}

enum UnitDamageTypesEnum {
    Physical,
}

interface UnitDamageModel {
    minDamage: number;
    maxDamage: number;
    type?: UnitDamageTypesEnum;
}

export interface UnitTypeBaseStatsModel {
    /* base health of single unit of this type */
    health: number;
    /* base speed of this unit type. speed defines how early in the battle order can be placed */
    speed: number;
    /* base defence of this unit type, each 15 poins of defense increase EHP by 100% */
    /* maybe defence types can be different, although I don't really think I want to have
        paper-rock-scissors here  */
    defence: number;

    /* Similar to Homm3 system, where each point of difference between attack/defence increases damage by 5 percent */
    attackRating: number;

    damageInfo: UnitDamageModel;
}

export interface UnitTypeModel {
    /* displayed name */
    name: string;
    /* main portrait for this unit (used during combat, hiring and so on) */
    mainPortraitUrl?: string;

    level: number;

    baseStats: UnitTypeBaseStatsModel;

    /* what does this unit type requires */
    baseRequirements: RequirementModel;

    /* create a separate mapping, table UnitGroup->Abilities */
    /*  Associative tables.. can be useful. Don't need to overgrow the model */
    baseAbilities?: AbilityModel[];

    /* minimal amount of units that can stack can be hired, sold or split by */
    minQuantityPerStack: number;

    /* How many attacks unit can make by default */
    defaultTurnsPerRound: number;
}

interface ItemTypeModel {
    name: string;
    mainIconUrl: string;

    /* what does this item type requires */
    requirements: RequirementModel;
}



export interface UnitGroupModel {
    count: number;
    type: UnitTypeModel;
    ownerPlayerRef?: PlayerInstanceModel;

    /* how much turns left during round, not sure if it's best to have it there */
    turnsLeft: number;
}

export interface UnitGroupInstModel extends UnitGroupModel {
    ownerPlayerRef: PlayerInstanceModel;
}




export enum PlayerTypeEnum {
    Player = 'Player',
    AI = 'AI',
}

/* todo: seems reasonable to have heroes and players models as well */
export interface PlayerModel {
    color: string;

    /* resources can be stored separately in theory. */
    resources: ResourcesModel;

    type: PlayerTypeEnum;

    hero: HeroModel;

    unitGroups: UnitGroupModel[];
}

export interface PlayerInstanceModel extends PlayerModel {
    id: string;
}

export interface HeroModel {

}

