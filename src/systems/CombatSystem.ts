import type { Player } from "../models/Player";
import { Monster } from "../models/Monster";
import type { MonsterTemplate } from "../models/Monster";
import { abilities } from "../data/abilities";
import { AbsorptionSystem } from "./AbsorptionSystem";
import { ProgressionSystem } from "./ProgressionSystem";

export interface CombatCallbacks {
  onUpdate: () => void;
  onLog: (message: string, type?: "normal" | "damage" | "heal" | "victory" | "ability") => void;
  onAbsorb: (monsterName: string, abilityName: string, description: string) => void;
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

  constructor(player: Player, template: MonsterTemplate, tier: number, callbacks: CombatCallbacks) {
    this.player = player;
    this.callbacks = callbacks;
    this.monster = new Monster(template, tier);
    this.playerHealth = player.health;
    this.playerPowerAtStart = player.power;
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

  private hasPassive(id: string): boolean {
    return this.player.acquiredAbilities.includes(id);
  }

  private effectivePlayerInterval(): number {
    let interval = this.player.attackInterval;
    if (this.hasPassive("blood-frenzy")) interval *= 0.85;
    return interval;
  }

  private passiveEffect(id: string) {
    return abilities.find((ability) => ability.id === id)?.effect ?? {};
  }

  private runCombatCycle(): void {
    if (this.paused || this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    this.playerAttack(false);
    if (this.monster.health > 0) this.monsterAttack();
  }

  private playerAttack(active = false): void {
    if (this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    let critChance = 5 + (this.hasPassive("blood-scent") ? this.passiveEffect("blood-scent").criticalChance ?? 0 : 0);
    const critical = active ? false : Math.random() * 100 < critChance;
    let damage = Math.max(1, Math.round(this.player.attack - this.monster.defense * 0.55));
    if (this.hasPassive("demonic-strength")) damage = Math.round(damage * 1.25);
    if (critical) damage = Math.round(damage * 1.65);
    if (active) damage = Math.round(damage);

    this.monster.health -= damage;
    if (this.hasPassive("life-drain")) {
      const heal = Math.max(1, Math.round(damage * 0.08));
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + heal);
    }
    this.callbacks.onLog(critical ? `Critical strike! You dealt ${damage} damage.` : `You strike ${this.monster.template.name} for ${damage} damage.`, critical ? "damage" : "normal");
    if (this.monster.health <= 0) this.victory();
    this.callbacks.onUpdate();
  }

  private monsterAttack(): void {
    if (this.resolved || this.recovering || this.monster.health <= 0 || this.playerHealth <= 0) return;
    const dodgeChance = this.hasPassive("shadow-step") ? this.passiveEffect("shadow-step").dodgeChance ?? 0 : 0;
    if (Math.random() * 100 < dodgeChance) {
      this.callbacks.onLog(`Shadow Step causes you to evade ${this.monster.template.name}'s attack.`, "heal");
      return;
    }
    let damage = Math.max(1, Math.round(this.monster.attack - (this.player.defense + (this.hasPassive("bone-armor") ? 20 : 0)) * 0.58));
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
    if (this.player.acquiredAbilities.includes("essence-conduit")) essenceMultiplier += 0.2;
    const essence = Math.max(1, Math.round(this.monster.bloodEssence * (stronger ? 1.25 : 1) * essenceMultiplier));
    let experience = Math.round(this.monster.experience * (stronger ? 1.25 : 1));
    const hadDeathPenalty = this.player.deathXpPenaltyKills > 0;
    if (hadDeathPenalty) {
      experience = Math.max(1, Math.round(experience * 0.5));
      this.player.deathXpPenaltyKills--;
    }
    this.player.bloodEssence += essence;
    const levels = this.player.gainExperience(experience);
    if (this.monster.template.rank === "boss") this.player.bossDefeated = true;
    this.progression.unlockLocations(this.player);
    this.callbacks.onLog(`Victory! +${experience} XP and +${essence} Blood Essence.${hadDeathPenalty ? " Death XP penalty: 50%." : ""}`, "victory");
    for (const level of levels) this.callbacks.onLog(`Ascension: Level ${level} reached!`, "ability");

    const result = this.absorption.absorb(this.player, this.monster, this.playerPowerAtStart);
    if (result.acquired && result.abilityName && result.abilityDescription) {
      this.callbacks.onLog(`BLOOD ABSORPTION: ${result.abilityName} acquired!`, "ability");
      this.callbacks.onAbsorb(this.monster.template.name, result.abilityName, result.abilityDescription);
    }
    this.callbacks.onSave();
  }

  private death(): void {
    if (this.recovering || this.resolved) return;
    this.recovering = true;
    this.monster.health = this.monster.maxHealth;
    this.player.deathXpPenaltyKills = 1;
    this.callbacks.onLog("Your vampire falls. Blood restores within seconds.", "damage");
    this.callbacks.onDeath(this.monster.template.name);
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

    if (id === "blood-burst") {
      const damage = Math.max(1, Math.round(this.player.attack * (ability.effect.damageMultiplier ?? 1) - this.monster.defense * 0.4));
      this.monster.health -= damage;
      this.callbacks.onLog(`Blood Burst erupts for ${damage} damage!`, "ability");
    } else if (id === "vampiric-drain") {
      const damage = Math.max(1, Math.round(this.player.attack * (ability.effect.damageMultiplier ?? 1) - this.monster.defense * 0.4));
      const heal = Math.round(damage * 0.35);
      this.monster.health -= damage;
      this.playerHealth = Math.min(this.player.maxHealthWithUpgrades, this.playerHealth + heal);
      this.callbacks.onLog(`Vampiric Drain deals ${damage} damage and restores ${heal} health.`, "heal");
    } else if (id === "shadow-strike") {
      const damage = Math.max(1, Math.round(this.player.attack * 2.2 - this.monster.defense * 0.3));
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
