import type { Player } from "../models/Player";
import type { Monster } from "../models/Monster";
import { abilities } from "../data/abilities";

export interface AbsorptionResult {
  stronger: boolean;
  acquired: boolean;
  abilityName?: string;
  abilityDescription?: string;
}

export class AbsorptionSystem {
  absorb(player: Player, monster: Monster, playerPowerAtStart: number): AbsorptionResult {
    const stronger = monster.power > playerPowerAtStart;
    if (!stronger) return { stronger: false, acquired: false };

    const abilityId = monster.template.abilityId;
    if (player.acquiredAbilities.includes(abilityId)) {
      return { stronger: true, acquired: false };
    }

    player.acquiredAbilities.push(abilityId);
    const ability = abilities.find((item) => item.id === abilityId);
    return {
      stronger: true,
      acquired: true,
      abilityName: ability?.name,
      abilityDescription: ability?.description,
    };
  }
}
