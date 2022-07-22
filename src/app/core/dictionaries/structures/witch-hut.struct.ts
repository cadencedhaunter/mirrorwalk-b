import { StructureGeneratorModel, StuctureControl } from "../../model/structures.types";
import { ENCHANT_SPELL } from "../spells";

export const WitchHutStructure: StructureGeneratorModel = {
    control: StuctureControl.Neutral,
    name: 'Witch Hut',
    description: 'Walking trough the woods, you find an abandoned Witch Hut.\n\nLearn "Enchant" level 2',

    onVisited: ({ playersApi, spellsApi, visitingPlayer }) => {
        const enchantSpell = spellsApi.createSpellInstance(ENCHANT_SPELL, { initialLevel: 2 });
        playersApi.addSpellToPlayerHero(visitingPlayer, enchantSpell);
    },
};