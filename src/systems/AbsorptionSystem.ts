import type { Player } from "../models/Player";
import type { Monster } from "../models/Monster";
import { abilities } from "../data/abilities";

export interface AbsorptionResult {
  stronger: boolean;
  acquired: boolean;
  evolved: boolean;
  level: number;
  defeatCount: number;
  speciesId: string;
  nextRequirement?: number;
  abilityName?: string;
  abilityDescription?: string;
}

export class AbsorptionSystem {
  absorb(player: Player, monster: Monster, playerPowerAtStart: number): AbsorptionResult {
    const stronger = monster.power > playerPowerAtStart;
    const chance = player.getAbilityGainChance(monster.template.rank);
    const chanceSucceeded = !stronger && chance > 0 && Math.random() * 100 < chance;
    if (!stronger && !chanceSucceeded) return {
      stronger: false,
      acquired: false,
      evolved: false,
      level: 0,
      defeatCount: 0,
      speciesId: monster.template.speciesId ?? monster.template.id,
    };

    const abilityId = monster.template.abilityId;
    const ability = abilities.find((item) => item.id === abilityId);
    const speciesId = monster.template.speciesId ?? monster.template.id;
    const acquired = !player.acquiredAbilities.includes(abilityId);

    if (acquired) {
      player.acquiredAbilities.push(abilityId);
      player.abilityLevels[abilityId] = 1;
    }

    player.speciesDefeats[speciesId] = (player.speciesDefeats[speciesId] ?? 0) + 1;
    player.abilityProgress[abilityId] = (player.abilityProgress[abilityId] ?? 0) + 1;
    player.abilityProgress[speciesId] = (player.abilityProgress[speciesId] ?? 0) + 1;

    const defeatCount = player.speciesDefeats[speciesId];
    const previousLevel = player.abilityLevels[abilityId] ?? 1;
    const requirements = ability?.evolutionRequirements ?? [1, 3, 6];
    let level = 1;
    for (let index = 0; index < requirements.length; index++) {
      if (defeatCount >= requirements[index]) level = index + 1;
    }
    level = Math.min(level, ability?.maxLevel ?? 3);
    player.abilityLevels[abilityId] = level;

    const evolved = !acquired && level > previousLevel;
    const nextRequirement = requirements.find((requirement) => requirement > defeatCount);

    return {
      stronger: true,
      acquired,
      evolved,
      level,
      defeatCount,
      speciesId,
      nextRequirement,
      abilityName: ability?.name,
      abilityDescription: ability?.description,
    };
  }
}
