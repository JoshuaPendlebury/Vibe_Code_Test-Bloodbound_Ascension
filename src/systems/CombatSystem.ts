import type { Player } from "../models/Player";
import { Monster } from "../models/Monster";
import type { MonsterTemplate } from "../models/Monster";
import type { AbilityEffect } from "../models/Ability";
import { abilities } from "../data/abilities";
import { AbsorptionSystem } from "./AbsorptionSystem";
import { ProgressionSystem } from "./ProgressionSystem";

export interface CombatCallbacks {
  onUpdate: () => void;
  onLog: (message: string, type?: "normal" | "damage" | "heal" | "victory" | "ability") => void;
  onAbsorb: (monsterName: string, abilityName: string, description: string, resultType?: "acquired" | "evolved", level?: number) => void;
  onDeath: (monsterName: string) => void;
  onRecover: () => void;
  onSave: () => void;
}

export class CombatSystem {
  player: Player;
  monster: Monster;
  paused = false;
  playerHealth: number;
  intervalId: number | undefined;
  cooldowns: Record<string, number> = {};
  shieldUntil = 0;
  private callbacks: CombatCallbacks;
  private absorption = new AbsorptionSystem();
  private progression = new ProgressionSystem();
  private playerPowerAtStart: number;
  private resolved = false;
  private recovering = false;
  private bossCycle = 0;
  private graveEnrageLogged = false;
  private locationId: string;

  constructor(player: Player, template: MonsterTemplate, tier: number, callbacks: CombatCallbacks, locationId = "graveyard") {
    this.player = player;
    this.callbacks = callbacks;
    this.monster = new Monster(template, tier);
    this.playerHealth = player.health;
    this.playerPowerAtStart = player.power;
    this.locationId = locationId;
  }

  start(): void {
    if (this.intervalId) window.clearInterval(this.intervalId);
    this.runCombatCycle();
    this.intervalId = window.setInterval(() => this.runCombatCycle(), this.effectivePlayerInterval());
  }

  stop(): void {
    if (this.intervalId) window.clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  skipEnemy(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.stop();
    this.callbacks.onLog(`${this.monster.template.name} retreats. No reward gained.`, "normal");
    this.callbacks.onUpdate();
    this.callbacks.onSave();
  }

  private hasPassive(id: string): boolean {
    return this.player.acquiredAbilities.includes(id);
  }

  private abilityLevel(id: string): number {
    return this.player.getAbilityLevel(id);
  }

  private scaledPassiveEffect(id: string): AbilityEffect {
    const base = abilities.find((ability) => ability.id === id)?.effect ?? {};
    const level = this.abilityLevel(id);
    return {
      ...base,
      criticalChance: base.criticalChance ? base.criticalChance * level : undefined,
      dodgeChance: base.dodgeChance ? base.dodgeChance * level : undefined,
      defense: base.defense ? base.defense * level : undefined,
      healPercent: base.healPercent ? base.healPercent * level : undefined,
      attackSpeed: base.attackSpeed ? base.attackSpeed * level : undefined,
      attack: base.attack ? base.attack * level : undefined,
      essenceBonus: base.essenceBonus ? base.essenceBonus * level : undefined,
      maxHealth: base.maxHealth ? base.maxHealth * level : undefined,
      healthRegen: base.healthRegen ? base.healthRegen * level : undefined,
    };
  }

  private effectivePlayerInterval(): number {
    let interval = this.player.attackInterval;
    if (this.hasPassive("blood-frenzy")) {
      const bonus = this.scaledPassiveEffect("blood-frenzy").attackSpeed ?? 15;
      interval *= 1 - bonus / 100;
    }
    return interval;
  }

  private passiveEffect(id: string) {
    return abilities.find((ability) => ability.id === id)?.effect ?? {};
  }

  private runCombatCycle(): void {
    if (this.paused || this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    if (this.monster.template.rank === "boss") this.bossCycle++;
    if (this.hasPassive("wildheart-regeneration")) {
      const regenPercent = this.scaledPassiveEffect("wildheart-regeneration").healthRegen ?? 3;
      const regen = Math.max(1, Math.round(this.player.maxHealthWithUpgrades * regenPercent / 100));
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + regen);
    }
    this.playerAttack(false);
    if (this.monster.health > 0) this.monsterAttack();
  }

  private playerAttack(active = false): void {
    if (this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    let critChance = 5 + (this.hasPassive("blood-scent") ? this.scaledPassiveEffect("blood-scent").criticalChance ?? 0 : 0);
    const critical = active ? false : Math.random() * 100 < critChance;
    let damage = Math.max(1, Math.round(this.player.attack - this.monster.defense * 0.55));
    if (this.hasPassive("demonic-strength")) {
      const bonus = this.scaledPassiveEffect("demonic-strength").attack ?? 25;
      damage = Math.round(damage * (1 + bonus / 100));
    }
    if (this.hasPassive("crimson-dominion")) {
      const bonus = this.scaledPassiveEffect("crimson-dominion").attack ?? 20;
      damage = Math.round(damage * (1 + bonus / 100));
    }
    if (this.monster.template.bossMechanic === "crimson-ward" && this.bossCycle % 2 === 1) {
      damage = Math.round(damage * 0.65);
    }
    if (critical) damage = Math.round(damage * 1.65);
    if (active) damage = Math.round(damage);

    this.monster.health -= damage;
    if (this.hasPassive("life-drain")) {
      const healPercent = this.scaledPassiveEffect("life-drain").healPercent ?? 8;
      const heal = Math.max(1, Math.round(damage * healPercent / 100));
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + heal);
    }
    if (this.hasPassive("crimson-dominion")) {
      const healPercent = this.scaledPassiveEffect("crimson-dominion").healPercent ?? 10;
      const heal = Math.max(1, Math.round(damage * healPercent / 100));
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + heal);
    }
    this.callbacks.onLog(critical ? `Critical strike! You dealt ${damage} damage.` : `You strike ${this.monster.template.name} for ${damage} damage.`, critical ? "damage" : "normal");
    if (this.monster.health <= 0) this.victory();
    this.callbacks.onUpdate();
  }

  private monsterAttack(): void {
    if (this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    if (this.monster.template.bossMechanic === "thorn-regrowth") {
      const healed = Math.max(1, Math.round(this.monster.maxHealth * 0.04));
      const previousHealth = this.monster.health;
      this.monster.health = Math.min(this.monster.maxHealth, this.monster.health + healed);
      if (this.monster.health > previousHealth) {
        this.callbacks.onLog(`${this.monster.template.name} uses Thorn Regrowth and restores ${this.monster.health - previousHealth} health.`, "heal");
      }
    }
    const dodgeChance = this.hasPassive("shadow-step") ? this.scaledPassiveEffect("shadow-step").dodgeChance ?? 0 : 0;
    if (Math.random() * 100 < dodgeChance) {
      this.callbacks.onLog(`Shadow Step causes you to evade ${this.monster.template.name}'s attack.`, "heal");
      return;
    }
    const boneArmor = this.hasPassive("bone-armor") ? this.scaledPassiveEffect("bone-armor").defense ?? 20 : 0;
    const ossuaryDefense = this.hasPassive("ossuary-vigor") ? this.scaledPassiveEffect("ossuary-vigor").defense ?? 12 : 0;
    let damage = Math.max(1, Math.round(this.monster.attack - (this.player.defense + boneArmor + ossuaryDefense) * 0.58));
    if (this.monster.template.bossMechanic === "grave-enrage" && this.monster.health / this.monster.maxHealth <= 0.5) {
      damage = Math.round(damage * 1.5);
      if (!this.graveEnrageLogged) {
        this.callbacks.onLog(`${this.monster.template.name} enters Death Surge: attacks deal 50% more damage!`, "ability");
        this.graveEnrageLogged = true;
      }
    }
    if (this.monster.template.bossMechanic === "crimson-ward" && this.bossCycle % 2 === 0) {
      damage = Math.round(damage * 1.35);
    }
    if (Date.now() < this.shieldUntil) damage = Math.round(damage * 0.4);
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.callbacks.onLog(`${this.monster.template.name} retaliates for ${damage} damage.`, "damage");
    if (this.playerHealth <= 0) this.death();
  }

  private victory(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.stop();
    const stronger = this.monster.power > this.playerPowerAtStart;
    let essenceMultiplier = 1 + (this.player.upgrades.absorption * 0.05);
    if (this.player.acquiredAbilities.includes("essence-conduit")) {
      essenceMultiplier += (this.scaledPassiveEffect("essence-conduit").essenceBonus ?? 20) / 100;
    }
    const essence = Math.max(1, Math.round(this.monster.bloodEssence * (stronger ? 1.25 : 1) * essenceMultiplier));
    let experience = Math.round(this.monster.experience * (stronger ? 1.25 : 1));
    const levelDifference = Math.max(0, this.player.level - this.monster.level);
    const lowLevelXpMultiplier = levelDifference > 0 ? Math.max(0.1, 1 - levelDifference * 0.15) : 1;
    experience = Math.max(1, Math.round(experience * lowLevelXpMultiplier));
    const hadLowLevelPenalty = levelDifference > 0;
    const hadDeathPenalty = this.player.deathXpPenaltyKills > 0;
    if (hadDeathPenalty) {
      experience = Math.max(1, Math.round(experience * 0.5));
      this.player.deathXpPenaltyKills--;
    }
    this.player.bloodEssence += essence;
    if (this.monster.template.rank !== "boss") {
      this.player.areaEnemyDefeats[this.locationId] = (this.player.areaEnemyDefeats[this.locationId] ?? 0) + 1;
    }
    const levels = this.player.gainExperience(experience);
    if (this.monster.template.rank === "boss") {
      this.player.bossDefeated = true;
      if (!this.player.defeatedBosses.includes(this.monster.template.id)) {
        this.player.defeatedBosses.push(this.monster.template.id);
      }
    }
    this.progression.unlockLocations(this.player);
    const xpPenalties: string[] = [];
    if (hadLowLevelPenalty) xpPenalties.push(`Low-level XP reduction: ${Math.round(lowLevelXpMultiplier * 100)}%`);
    if (hadDeathPenalty) xpPenalties.push("Death XP penalty: 50%");
    const penaltyText = xpPenalties.length ? ` ${xpPenalties.join("; ")}.` : "";
    this.callbacks.onLog(`Victory! +${experience} XP and +${essence} Blood Essence.${penaltyText}`, "victory");
    for (const level of levels) this.callbacks.onLog(`Ascension: Level ${level} reached!`, "ability");

    const result = this.absorption.absorb(this.player, this.monster, this.playerPowerAtStart);
    if (result.acquired && result.abilityName && result.abilityDescription) {
      this.callbacks.onLog(`BLOOD ABSORPTION: ${result.abilityName} acquired!`, "ability");
      this.callbacks.onAbsorb(this.monster.template.name, result.abilityName, result.abilityDescription, "acquired", result.level);
    } else if (result.evolved && result.abilityName && result.abilityDescription) {
      this.callbacks.onLog(`ABILITY EVOLVED: ${result.abilityName} reached Level ${result.level}!`, "ability");
      this.callbacks.onAbsorb(this.monster.template.name, result.abilityName, result.abilityDescription, "evolved", result.level);
    }
    this.callbacks.onSave();
  }

  private death(): void {
    if (this.recovering || this.resolved) return;
    this.recovering = true;
    this.player.deathXpPenaltyKills = 1;
    this.callbacks.onLog("Your vampire falls. The current enemy retreats.", "damage");
    this.callbacks.onDeath(this.monster.template.name);
    this.skipEnemy();
    this.callbacks.onUpdate();
    window.setTimeout(() => {
      this.playerHealth = this.player.maxHealthWithUpgrades;
      this.player.health = this.playerHealth;
      this.recovering = false;
      this.callbacks.onLog("Your body reforms. Combat resumes.", "heal");
      this.callbacks.onRecover();
      this.callbacks.onUpdate();
      this.callbacks.onSave();
    }, 1800);
  }

  useAbility(id: string): boolean {
    const ability = abilities.find((item) => item.id === id);
    if (!ability || !this.player.acquiredAbilities.includes(id)) return false;
    if ((this.cooldowns[id] ?? 0) > Date.now()) return false;
    if (this.monster.health <= 0) return false;
    if (this.resolved || this.recovering || this.playerHealth <= 0) return false;

    const activeLevel = this.abilityLevel(id);
    const activeMultiplier = 1 + Math.max(0, activeLevel - 1) * 0.25;
    if (id === "blood-burst") {
      const damage = Math.max(1, Math.round(this.player.attack * (ability.effect.damageMultiplier ?? 1) * activeMultiplier - this.monster.defense * 0.4));
      this.monster.health -= damage;
      this.callbacks.onLog(`Blood Burst erupts for ${damage} damage!`, "ability");
    } else if (id === "vampiric-drain") {
      const damage = Math.max(1, Math.round(this.player.attack * (ability.effect.damageMultiplier ?? 1) * activeMultiplier - this.monster.defense * 0.4));
      const heal = Math.round(damage * (0.35 + Math.max(0, activeLevel - 1) * 0.08));
      this.monster.health -= damage;
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + heal);
      this.callbacks.onLog(`Vampiric Drain deals ${damage} damage and restores ${heal} health.`, "heal");
    } else if (id === "shadow-strike") {
      const damage = Math.max(1, Math.round(this.player.attack * 2.2 * activeMultiplier - this.monster.defense * 0.3));
      this.monster.health -= damage;
      this.callbacks.onLog(`Shadow Strike lands for ${damage} critical damage!`, "ability");
    } else if (id === "blood-shield") {
      this.shieldUntil = Date.now() + 8000;
      this.callbacks.onLog("Blood Shield envelops you for 8 seconds.", "ability");
    }

    this.cooldowns[id] = Date.now() + ability.cooldown * 1000;
    if (this.monster.health <= 0) this.victory();
    this.player.health = this.playerHealth;
    this.callbacks.onUpdate();
    return true;
  }
}
