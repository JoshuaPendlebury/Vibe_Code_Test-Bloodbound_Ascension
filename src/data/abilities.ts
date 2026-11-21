import type { Ability } from "../models/Ability";

export const evolutionRequirements = [1, 3, 6];

export const abilities: Ability[] = [
  { id: "blood-scent", name: "Blood Scent", description: "+10% critical hit chance.", type: "passive", effect: { criticalChance: 10 }, cooldown: 0, absorbable: true, icon: "◉", maxLevel: 3, evolutionRequirements },
  { id: "shadow-step", name: "Shadow Step", description: "+15% dodge chance.", type: "passive", effect: { dodgeChance: 15 }, cooldown: 0, absorbable: true, icon: "◈", maxLevel: 3, evolutionRequirements },
  { id: "bone-armor", name: "Bone Armor", description: "+20 defense.", type: "passive", effect: { defense: 20 }, cooldown: 0, absorbable: true, icon: "◆", maxLevel: 3, evolutionRequirements },
  { id: "life-drain", name: "Life Drain", description: "Recover 8% of damage dealt.", type: "passive", effect: { healPercent: 8 }, cooldown: 0, absorbable: true, icon: "♥", maxLevel: 3, evolutionRequirements },
  { id: "blood-frenzy", name: "Blood Frenzy", description: "Permanent 15% faster attacks.", type: "passive", effect: { attackSpeed: 15 }, cooldown: 0, absorbable: true, icon: "♛", maxLevel: 3, evolutionRequirements },
  { id: "demonic-strength", name: "Demonic Strength", description: "+25% attack damage.", type: "passive", effect: { attack: 25 }, cooldown: 0, absorbable: true, icon: "♠", maxLevel: 3, evolutionRequirements },
  { id: "essence-conduit", name: "Essence Conduit", description: "+20% Blood Essence rewards.", type: "passive", effect: { essenceBonus: 20 }, cooldown: 0, absorbable: true, icon: "☽", maxLevel: 3, evolutionRequirements },
  { id: "blood-burst", name: "Blood Burst", description: "Deals 180% attack damage.", type: "active", effect: { damageMultiplier: 1.8 }, cooldown: 12, absorbable: false, icon: "✦" },
  { id: "vampiric-drain", name: "Vampiric Drain", description: "Deals 120% damage and heals 35% damage dealt.", type: "active", effect: { damageMultiplier: 1.2, healPercent: 35 }, cooldown: 18, absorbable: false, icon: "✚" },
  { id: "shadow-strike", name: "Shadow Strike", description: "Guaranteed critical strike for 220% damage.", type: "active", effect: { damageMultiplier: 2.2, criticalChance: 100 }, cooldown: 20, absorbable: false, icon: "✧" },
  { id: "blood-shield", name: "Blood Shield", description: "Reduces incoming damage by 60% for 8 seconds.", type: "active", effect: { shieldPercent: 60 }, cooldown: 25, absorbable: false, icon: "⬡" },
];
