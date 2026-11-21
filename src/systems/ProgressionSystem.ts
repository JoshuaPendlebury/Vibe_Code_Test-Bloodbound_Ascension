import type { Player } from "../models/Player";
import { locations } from "../data/locations";

export const upgradeData = [
  { id: "attack", name: "Attack Strength", description: "+4 attack per rank", icon: "⚔" },
  { id: "health", name: "Maximum Health", description: "+20 max health per rank", icon: "♥" },
  { id: "defense", name: "Defense", description: "+3 defense per rank", icon: "◆" },
  { id: "attackSpeed", name: "Attack Speed", description: "+6% attack speed per rank", icon: "⌁" },
  { id: "absorption", name: "Blood Absorption Efficiency", description: "+5% Blood Essence per rank", icon: "◉" },
] as const;

export class ProgressionSystem {
  cost(player: Player, upgradeId: string): number {
    const base: Record<string, number> = { attack: 30, health: 35, defense: 28, attackSpeed: 45, absorption: 40 };
    return Math.round(base[upgradeId] * Math.pow(1.55, player.upgrades[upgradeId] ?? 0));
  }

  purchase(player: Player, upgradeId: string): boolean {
    const cost = this.cost(player, upgradeId);
    if (!player.upgrades[upgradeId] && player.upgrades[upgradeId] !== 0) return false;
    if (player.bloodEssence < cost) return false;
    player.bloodEssence -= cost;
    player.upgrades[upgradeId]++;
    if (upgradeId === "health") {
      player.health = player.maxHealthWithUpgrades;
    }
    return true;
  }

  unlockLocations(player: Player): void {
    for (const location of locations) {
      const levelMet = player.level >= location.unlockLevel;
      const bossMet = !location.unlockBoss || player.bossDefeated;
      if (levelMet && bossMet && !player.unlockedLocations.includes(location.id)) {
        player.unlockedLocations.push(location.id);
      }
    }
  }
}
