export type MonsterRank = "normal" | "elite" | "boss";

export interface MonsterTemplate {
  id: string;
  name: string;
  level: number;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  rank: MonsterRank;
  experience: number;
  bloodEssence: number;
  abilityId: string;
  icon: string;
}

export class Monster {
  template: MonsterTemplate;
  level: number;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  power: number;
  experience: number;
  bloodEssence: number;

  constructor(template: MonsterTemplate, tier = 1) {
    this.template = template;
    this.level = template.level + tier - 1;
    const rankMultiplier = template.rank === "boss" ? 2 : template.rank === "elite" ? 1.35 : 1;
    this.maxHealth = Math.round(template.health * (1 + (tier - 1) * 0.18) * rankMultiplier);
    this.health = this.maxHealth;
    this.attack = Math.round(template.attack * (1 + (tier - 1) * 0.14) * rankMultiplier);
    this.defense = Math.round(template.defense * (1 + (tier - 1) * 0.12) * rankMultiplier);
    this.speed = Math.round(template.speed * (1 + (tier - 1) * 0.08));
    this.power = Math.round(this.maxHealth * 0.025 + this.attack * 3.2 + this.defense * 2.1 + this.speed * 0.7);
    this.experience = Math.round(template.experience * (1 + (tier - 1) * 0.2) * rankMultiplier);
    this.bloodEssence = Math.round(template.bloodEssence * (1 + (tier - 1) * 0.22) * rankMultiplier);
  }
}
