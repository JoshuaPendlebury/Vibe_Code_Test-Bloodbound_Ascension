export type AbilityType = "passive" | "active";

export interface AbilityEffect {
  attack?: number;
  defense?: number;
  maxHealth?: number;
  attackSpeed?: number;
  criticalChance?: number;
  dodgeChance?: number;
  essenceBonus?: number;
  healthRegen?: number;
  damageMultiplier?: number;
  healPercent?: number;
  shieldPercent?: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  effect: AbilityEffect;
  cooldown: number;
  absorbable: boolean;
  icon: string;
}
