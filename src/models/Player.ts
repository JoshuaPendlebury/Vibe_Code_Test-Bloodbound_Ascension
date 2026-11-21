export interface SavedPlayer {
  level: number;
  experience: number;
  deathXpPenaltyKills: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  bloodEssence: number;
  acquiredAbilities: string[];
  upgrades: Record<string, number>;
  unlockedLocations: string[];
  selectedLocation: string;
  bossDefeated: boolean;
}

export class Player {
  level = 1;
  experience = 0;
  maxHealth = 100;
  health = 100;
  baseAttack = 12;
  baseDefense = 7;
  baseSpeed = 10;
  bloodEssence = 0;
  acquiredAbilities: string[] = ["blood-burst", "vampiric-drain", "shadow-strike", "blood-shield"];
  upgrades: Record<string, number> = {
    attack: 0,
    health: 0,
    defense: 0,
    attackSpeed: 0,
    absorption: 0,
  };
  unlockedLocations = ["graveyard"];
  selectedLocation = "graveyard";
  bossDefeated = false;
  deathXpPenaltyKills = 0;

  get attack() {
    return this.baseAttack + this.upgrades.attack * 4 + this.level * 2;
  }
  get maxHealthWithUpgrades() {
    return this.maxHealth + this.upgrades.health * 20 + (this.level - 1) * 8;
  }
  get defense() {
    return this.baseDefense + this.upgrades.defense * 3 + this.level;
  }
  get speed() {
    return this.baseSpeed + this.level;
  }
  get attackInterval() {
    const upgradeBonus = this.upgrades.attackSpeed * 0.06;
    return Math.max(550, 1800 * (1 - upgradeBonus));
  }
  get power() {
    return Math.round(this.maxHealthWithUpgrades * 0.025 + this.attack * 3.2 + this.defense * 2.1 + this.speed * 0.7);
  }
  get expNeeded() {
    return Math.floor(30 * Math.pow(1.38, this.level - 1));
  }

  gainExperience(amount: number): number[] {
    this.experience += amount;
    const levels: number[] = [];
    while (this.experience >= this.expNeeded) {
      this.experience -= this.expNeeded;
      this.level++;
      levels.push(this.level);
      this.maxHealth = 100 + (this.level - 1) * 10;
      this.baseAttack += 2;
      this.baseDefense += 1;
      this.baseSpeed += 1;
      this.health = this.maxHealthWithUpgrades;
    }
    return levels;
  }

  serialize(health: number): SavedPlayer {
    return {
      level: this.level,
      experience: this.experience,
      deathXpPenaltyKills: this.deathXpPenaltyKills,
      health,
      maxHealth: this.maxHealth,
      attack: this.baseAttack,
      defense: this.baseDefense,
      speed: this.baseSpeed,
      bloodEssence: this.bloodEssence,
      acquiredAbilities: [...this.acquiredAbilities],
      upgrades: { ...this.upgrades },
      unlockedLocations: [...this.unlockedLocations],
      selectedLocation: this.selectedLocation,
      bossDefeated: this.bossDefeated,
    };
  }

  restore(data: Partial<SavedPlayer>): void {
    this.level = data.level ?? 1;
    this.experience = data.experience ?? 0;
    this.deathXpPenaltyKills = data.deathXpPenaltyKills ?? 0;
    this.maxHealth = data.maxHealth ?? 100;
    this.baseAttack = data.attack ?? 12;
    this.baseDefense = data.defense ?? 7;
    this.baseSpeed = data.speed ?? 10;
    this.bloodEssence = data.bloodEssence ?? 0;
    this.acquiredAbilities = Array.isArray(data.acquiredAbilities) ? data.acquiredAbilities : [];
    this.upgrades = { attack: 0, health: 0, defense: 0, attackSpeed: 0, absorption: 0, ...data.upgrades };
    this.unlockedLocations = Array.isArray(data.unlockedLocations) ? data.unlockedLocations : ["graveyard"];
    this.selectedLocation = this.unlockedLocations.includes(data.selectedLocation ?? "")
      ? data.selectedLocation!
      : "graveyard";
    this.bossDefeated = data.bossDefeated ?? false;
    this.health = Math.min(data.health ?? this.maxHealthWithUpgrades, this.maxHealthWithUpgrades);
  }
}
