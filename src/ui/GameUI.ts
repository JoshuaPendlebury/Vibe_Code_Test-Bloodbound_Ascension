import { Player } from "../models/Player";
import { Monster, type MonsterTemplate } from "../models/Monster";
import { CombatSystem } from "../systems/CombatSystem";
import { ProgressionSystem, upgradeData } from "../systems/ProgressionSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { abilities } from "../data/abilities";
import { monsters } from "../data/monsters";
import { locations, type Location } from "../data/locations";

export class GameUI {
  private player = new Player();
  private combat: CombatSystem;
  private progression = new ProgressionSystem();
  private tab = "abilities";
  private location: Location;
  private logs: Array<{ message: string; type: string }> = [];
  private respawning = false;
  private respawnTimer: number | undefined;
  private cooldownTimer: number | undefined;
  private previousPlayerHealth = -1;
  private previousMonsterHealth = -1;

  constructor(private root: HTMLElement) {
    SaveSystem.load(this.player);
    this.location = locations.find((item) => item.id === this.player.selectedLocation) ?? locations[0];
    const template = this.chooseMonster();
    this.combat = new CombatSystem(this.player, template, this.location.tier, this.combatCallbacks(), this.location.id);
  }

  start(): void {
    this.root.innerHTML = this.template();
    this.bind();
    this.addLog("The night awakens. Hunt, feed, ascend.", "ability");
    this.combat.start();
    this.cooldownTimer = window.setInterval(() => this.updateCooldowns(), 250);
  }

  private chooseMonster(): MonsterTemplate {
    const pool = monsters.filter((monster) => this.location.monsterIds.includes(monster.id));
    const candidates = pool.filter((monster) => monster.level <= this.player.level + 3);
    const list = candidates.length ? candidates : pool;
    const regular = list.filter((monster) => monster.rank !== "boss");
    return regular[Math.floor(Math.random() * regular.length)] ?? monsters[0];
  }

  private combatCallbacks() {
    return {
      onUpdate: () => this.render(),
      onLog: (message: string, type: "normal" | "damage" | "heal" | "victory" | "ability" = "normal") => this.addLog(message, type),
      onAbsorb: (monsterName: string, abilityName: string, description: string, resultType: "acquired" | "evolved" = "acquired", level = 1) => this.showAbsorption(monsterName, abilityName, description, resultType, level),
      onDeath: (monsterName: string) => this.showDeath(monsterName),
      onRecover: () => {
        this.hideDeath();
        this.spawnMonster();
      },
      onSave: () => this.save(),
    };
  }

  private spawnMonster(): void {
    if (this.respawning) return;
    this.respawning = true;
    this.addLog("Blood stirs... a new enemy emerges.", "normal");
    this.respawnTimer = window.setTimeout(() => {
      const paused = this.combat.paused;
      const template = this.chooseMonster();
      this.combat = new CombatSystem(this.player, template, this.location.tier, this.combatCallbacks(), this.location.id);
      this.combat.setPaused(paused);
      this.combat.start();
      this.respawnTimer = undefined;
      this.respawning = false;
      this.render();
    }, 900);
  }

  private cancelPendingRespawn(): void {
    if (this.respawnTimer !== undefined) {
      window.clearTimeout(this.respawnTimer);
      this.respawnTimer = undefined;
    }
    this.respawning = false;
  }

  private template(): string {
    return `
      <a class="skip-link" href="#combat-area">Skip to combat</a>
      <header class="topbar">
        <div class="brand"><span class="brand-mark">V</span><div><small>BLOODBOUND</small><strong>ASCENSION</strong></div></div>
        <div class="top-stats" aria-label="Vampire overview">
          <div><span>LEVEL</span><strong id="top-level"></strong></div>
          <div><span>BLOOD ESSENCE</span><strong class="essence" id="top-essence"></strong></div>
          <div><span>LOCATION</span><strong id="top-location"></strong></div>
          <div class="save-status"><i></i><span id="save-status">Saved</span></div>
        </div>
      </header>
      <main class="game-shell">
        <aside class="panel player-panel" aria-label="Vampire status">
          <div class="panel-heading"><span>THE VAMPIRE</span></div>
          <div class="portrait"><div class="portrait-rune">♛</div><div class="portrait-name">NOCTURNE</div></div>
          <div id="player-bars"></div>
          <div id="player-stats"></div>
        </aside>
        <section class="combat-panel" id="combat-area" aria-label="Combat arena">
          <div id="combat-location" class="location-banner"></div>
          <div id="monster-area"></div>
          <div class="combat-controls">
            <button id="pause-button" class="primary-button" aria-pressed="false"><span aria-hidden="true">Ⅱ</span> Pause Combat</button>
            <button id="skip-button" class="icon-button">Skip Enemy</button>
            <button id="boss-button" class="icon-button boss-button" disabled>Fight Area Boss · 0/20</button>
            <button id="save-button" class="icon-button">Save</button>
            <button id="reset-button" class="icon-button danger">Reset</button>
          </div>
          <div class="abilities-active" id="active-abilities"></div>
          <div class="battle-log" aria-label="Combat log">
            <div class="log-heading"><span>Night Chronicle</span><button id="clear-log">Clear</button></div>
            <div id="combat-log" class="log-content" role="log" aria-live="polite" aria-relevant="additions"></div>
          </div>
        </section>
        <aside class="panel progression-panel">
          <div class="tabs" role="tablist" aria-label="Progression">
            <button data-tab="abilities" role="tab" aria-selected="true">Abilities</button>
            <button data-tab="upgrades" role="tab" aria-selected="false">Upgrades</button>
            <button data-tab="locations" role="tab" aria-selected="false">Locations</button>
            <button data-tab="statistics" role="tab" aria-selected="false">Statistics</button>
          </div>
          <div id="tab-content"></div>
        </aside>
      </main>
      <div id="absorption-modal" class="modal hidden" role="dialog" aria-modal="true">
        <div class="modal-card"><div class="modal-rune">♛</div><h2>Blood Absorption Successful</h2><p id="absorb-monster"></p><h3 id="absorb-name"></h3><p id="absorb-effect"></p><button id="close-modal">Seal Blood</button></div>
      </div>
      <div id="death-modal" class="modal death-modal hidden" role="dialog" aria-modal="true">
        <div class="modal-card death-card"><div class="death-rune">†</div><h2>You Have Fallen</h2><p id="death-monster"></p><p class="death-penalty">The next kill grants 50% XP.</p><p class="death-recovery">The enemy retreats. Your body reforms in 1.8 seconds...</p></div>
      </div>
      <div id="ability-toast" class="ability-toast" aria-live="assertive" aria-atomic="true"></div>
      <div id="combat-feedback" class="combat-feedback" aria-hidden="true"></div>`;
  }

  private bind(): void {
    document.querySelector("#pause-button")?.addEventListener("click", () => {
      this.combat.setPaused(!this.combat.paused);
      this.render();
    });
    document.querySelector("#skip-button")?.addEventListener("click", () => {
      if (this.respawning) return;
      this.combat.skipEnemy();
      this.spawnMonster();
    });
    document.querySelector("#boss-button")?.addEventListener("click", () => {
      const defeated = this.player.areaEnemyDefeats[this.location.id] ?? 0;
      if (defeated < 20 || this.combat.monster.template.rank === "boss") return;
      const boss = monsters.find((monster) => monster.id === this.location.bossId);
      if (!boss) return;
      const paused = this.combat.paused;
      this.cancelPendingRespawn();
      this.combat.stop();
      this.combat = new CombatSystem(this.player, boss, this.location.tier, this.combatCallbacks(), this.location.id);
      this.combat.setPaused(paused);
      this.combat.start();
      this.addLog(`You summon ${boss.name}.`, "ability");
      this.render();
    });
    document.querySelector("#active-abilities")?.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-ability]");
      if (!button || button.hasAttribute("disabled")) return;
      const abilityId = button.dataset.ability;
      if (abilityId) this.combat.useAbility(abilityId);
    });
    document.querySelector("#save-button")?.addEventListener("click", () => this.save(true));
    document.querySelector("#reset-button")?.addEventListener("click", () => {
      if (confirm("Reset all Bloodbound: Ascension progress? This cannot be undone.")) {
        SaveSystem.clear();
        location.reload();
      }
    });
    document.querySelector("#clear-log")?.addEventListener("click", () => {
      this.logs = [];
      this.render();
    });
    document.querySelector("#close-modal")?.addEventListener("click", () => {
      document.querySelector("#absorption-modal")?.classList.add("hidden");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      document.querySelector("#absorption-modal")?.classList.add("hidden");
      document.querySelector("#death-modal")?.classList.add("hidden");
    });
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        this.tab = (button as HTMLElement).dataset.tab ?? "abilities";
        this.render();
      });
    });
  }

  private render(): void {
    const setText = (id: string, text: string) => {
      const element = document.querySelector(`#${id}`);
      if (element) element.textContent = text;
    };
    setText("top-level", `${this.player.level}`);
    setText("top-essence", `${this.player.bloodEssence}`);
    setText("top-location", this.location.name);
    const pauseButton = document.querySelector<HTMLButtonElement>("#pause-button");
    if (pauseButton) {
      pauseButton.innerHTML = this.combat.paused
        ? '<span aria-hidden="true">▶</span> Resume Combat'
        : '<span aria-hidden="true">Ⅱ</span> Pause Combat';
      pauseButton.setAttribute("aria-pressed", String(this.combat.paused));
      pauseButton.classList.toggle("paused", this.combat.paused);
    }
    const bossButton = document.querySelector<HTMLButtonElement>("#boss-button");
    if (bossButton) {
      const defeated = this.player.areaEnemyDefeats[this.location.id] ?? 0;
      const bossActive = this.combat.monster.template.rank === "boss";
      bossButton.disabled = defeated < 20 || bossActive;
      bossButton.textContent = bossActive
        ? "Boss Fight Active"
        : defeated >= 20
          ? `Fight ${monsters.find((monster) => monster.id === this.location.bossId)?.name ?? "Area Boss"}`
          : `Fight Area Boss · ${Math.min(defeated, 20)}/20`;
    }

    const playerPercent = Math.max(0, this.combat.playerHealth / this.player.maxHealthWithUpgrades * 100);
    const expPercent = Math.min(100, this.player.experience / this.player.expNeeded * 100);
    setText("player-bars", "");
    const playerBars = document.querySelector("#player-bars");
    if (playerBars) playerBars.innerHTML = `
      <div class="bar-label"><span>Vitality</span><strong>${this.combat.playerHealth}/${this.player.maxHealthWithUpgrades}</strong></div>
      <div class="bar health" role="progressbar" aria-label="Vitality" aria-valuemin="0" aria-valuemax="${this.player.maxHealthWithUpgrades}" aria-valuenow="${this.combat.playerHealth}"><div style="width:${playerPercent}%"></div></div>
      <div class="bar-label"><span>Experience</span><strong>${this.player.experience}/${this.player.expNeeded}</strong></div>
      <div class="bar experience" role="progressbar" aria-label="Experience" aria-valuemin="0" aria-valuemax="${this.player.expNeeded}" aria-valuenow="${this.player.experience}"><div style="width:${expPercent}%"></div></div>`;

    setText("player-stats", "");
    const playerStats = document.querySelector("#player-stats");
    if (playerStats) playerStats.innerHTML = `
      <div class="power-rating"><span>Power Rating</span><strong>${this.player.power}</strong></div>
      ${this.player.deathXpPenaltyKills > 0 ? '<div class="death-penalty-status">Death Penalty: 50% XP on next kill</div>' : ""}
      <div class="stat-grid">
        <div><span>Attack</span><strong>${this.player.attack}</strong></div><div><span>Defense</span><strong>${this.player.defense}</strong></div>
        <div><span>Speed</span><strong>${this.player.speed}</strong></div><div><span>Level</span><strong>${this.player.level}</strong></div>
      </div>`;

    const monsterPercent = Math.max(0, this.combat.monster.health / this.combat.monster.maxHealth * 100);
    setText("combat-location", "");
    const locationBanner = document.querySelector("#combat-location");
    if (locationBanner) locationBanner.innerHTML = `<span style="color:${this.location.color}">${this.location.icon}</span><div><small>Now Hunting</small><strong>${this.location.name}</strong></div>`;
    const monsterArea = document.querySelector("#monster-area");
    const bossMechanics: Record<string, string> = {
      "grave-enrage": "Death Surge · gains 50% attack at 50% health",
      "thorn-regrowth": "Thorn Regrowth · restores 4% health each turn",
      "crimson-ward": "Crimson Alternance · alternates 35% damage reduction and empowered attacks",
    };
    const mechanic = this.combat.monster.template.bossMechanic ? bossMechanics[this.combat.monster.template.bossMechanic] : "";
    if (monsterArea) monsterArea.innerHTML = `
      <div class="monster-card rank-${this.combat.monster.template.rank}">
        <div class="rank-label">${this.combat.monster.template.rank.toUpperCase()}</div>
        <div class="monster-art ${this.combat.monster.template.rank === "boss" ? "boss-art" : ""}">${this.combat.monster.template.icon}</div>
        <h2>${this.combat.monster.template.name}</h2>
        <p>Level ${this.combat.monster.level} · Power ${this.combat.monster.power}</p>
        ${mechanic ? `<div class="boss-mechanic">${mechanic}</div>` : ""}
        <div class="monster-health"><div class="bar-label"><span>Health</span><strong>${Math.max(0, this.combat.monster.health)} / ${this.combat.monster.maxHealth}</strong></div><div class="bar monster" role="progressbar" aria-label="${this.combat.monster.template.name} health" aria-valuemin="0" aria-valuemax="${this.combat.monster.maxHealth}" aria-valuenow="${Math.max(0, this.combat.monster.health)}"><div style="width:${monsterPercent}%"></div></div></div>
      </div>`;

    this.updateCombatFeedback();
    this.renderActiveAbilities();
    this.renderTab();
    this.renderLogs();

    if (this.combat.monster.health <= 0) this.spawnMonster();
  }

  private renderActiveAbilities(): void {
    const container = document.querySelector("#active-abilities");
    if (!container) return;
    const active = abilities.filter((ability) => ability.type === "active" && this.player.acquiredAbilities.includes(ability.id));
    const renderedIds = Array.from(container.querySelectorAll<HTMLElement>("[data-ability]"))
      .map((button) => button.dataset.ability);
    const activeIds = active.map((ability) => ability.id);
    if (renderedIds.length !== activeIds.length || renderedIds.some((id, index) => id !== activeIds[index])) {
      container.innerHTML = active.map((ability) =>
        `<button class="active-ability" data-ability="${ability.id}" aria-label="Use ${ability.name}: ${ability.description}"><span aria-hidden="true">${ability.icon}</span><div><strong>${ability.name}</strong><small>${ability.description}</small></div></button>`
      ).join("");
    }
    for (const ability of active) {
      const button = container.querySelector<HTMLButtonElement>(`[data-ability="${ability.id}"]`);
      if (!button) continue;
      const remaining = Math.max(0, Math.ceil(((this.combat.cooldowns[ability.id] ?? 0) - Date.now()) / 1000));
      button.disabled = remaining > 0;
      const detail = button.querySelector("small");
      if (detail) detail.textContent = remaining ? `${remaining}s cooldown` : ability.description;
      button.setAttribute("aria-label", remaining
        ? `${ability.name}, ${remaining} seconds cooldown`
        : `Use ${ability.name}: ${ability.description}`);
    }
  }

  private updateCooldowns(): void {
    this.renderActiveAbilities();
  }

  private updateCombatFeedback(): void {
    if (this.previousPlayerHealth < 0) {
      this.previousPlayerHealth = this.combat.playerHealth;
      this.previousMonsterHealth = this.combat.monster.health;
      return;
    }

    const playerDelta = this.combat.playerHealth - this.previousPlayerHealth;
    const monsterDelta = this.combat.monster.health - this.previousMonsterHealth;

    if (monsterDelta < 0) this.animateCombatNumber(monsterDelta, "monster", "damage");
    if (monsterDelta > 0) this.animateCombatNumber(monsterDelta, "monster", "heal");
    if (playerDelta < 0) this.animateCombatNumber(playerDelta, "player", "damage");
    if (playerDelta > 0) this.animateCombatNumber(playerDelta, "player", "heal");

    this.previousPlayerHealth = this.combat.playerHealth;
    this.previousMonsterHealth = this.combat.monster.health;
  }

  private animateCombatNumber(delta: number, target: "player" | "monster", kind: "damage" | "heal"): void {
    const feedback = document.querySelector("#combat-feedback");
    if (!feedback) return;

    const number = document.createElement("span");
    number.className = `combat-number ${target} ${kind}`;
    number.textContent = `${delta > 0 ? "+" : ""}${delta}`;
    feedback.appendChild(number);

    const card = target === "monster"
      ? document.querySelector(".monster-card")
      : document.querySelector(".player-panel");
    card?.classList.remove(target === "monster" ? "enemy-hit" : "player-hit");
    void card?.getBoundingClientRect();
    card?.classList.add(target === "monster" ? "enemy-hit" : "player-hit");
    window.setTimeout(() => {
      card?.classList.remove(target === "monster" ? "enemy-hit" : "player-hit");
      number.remove();
    }, 650);
  }

  private renderTab(): void {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      const tabButton = button as HTMLElement;
      const isActive = tabButton.dataset.tab === this.tab;
      tabButton.classList.toggle("active", isActive);
      tabButton.setAttribute("aria-selected", String(isActive));
      tabButton.tabIndex = isActive ? 0 : -1;
    });
    const content = document.querySelector("#tab-content");
    if (!content) return;
    if (this.tab === "abilities") {
      const collection = abilities.filter((ability) => this.player.acquiredAbilities.includes(ability.id));
      content.innerHTML = `<div class="tab-title"><span>Ability Collection</span><strong>${collection.length}/${abilities.length}</strong></div>
        <div class="ability-list">${collection.map((ability) => `
          ${this.renderAbilityCard(ability)}`).join("")}</div>`;
    } else if (this.tab === "upgrades") {
      content.innerHTML = `<div class="tab-title"><span>Permanent Upgrades</span></div><div class="upgrade-list">${upgradeData.map((upgrade) => {
        const rank = this.player.upgrades[upgrade.id];
        const cost = this.progression.cost(this.player, upgrade.id);
        return `<article class="upgrade-card"><div class="upgrade-icon">${upgrade.icon}</div><div class="upgrade-info"><strong>${upgrade.name}</strong><small>${upgrade.description}</small><span>Rank ${rank}</span></div><button data-upgrade="${upgrade.id}" ${this.player.bloodEssence < cost ? "disabled" : ""}>${cost} ◉</button></article>`;
      }).join("")}</div>`;
      content.querySelectorAll("[data-upgrade]").forEach((button) => {
        button.addEventListener("click", () => {
          if (this.progression.purchase(this.player, (button as HTMLElement).dataset.upgrade ?? "")) {
            this.combat.stop();
            this.combat.start();
            this.save();
            this.render();
          }
        });
      });
    } else if (this.tab === "locations") {
      content.innerHTML = `<div class="tab-title"><span>Locations</span></div><div class="location-list">${locations.map((location) => {
        const unlocked = this.player.unlockedLocations.includes(location.id);
        const active = location.id === this.player.selectedLocation;
        const bossDefeated = this.player.defeatedBosses.includes(location.bossId);
        const areaDefeats = this.player.areaEnemyDefeats[location.id] ?? 0;
        const bossProgress = `Area defeats: ${Math.min(areaDefeats, 20)}/20`;
        const previousBoss = location.previousBossId
          ? monsters.find((monster) => monster.id === location.previousBossId)
          : undefined;
        const previousBossDefeated = previousBoss
          ? this.player.defeatedBosses.includes(previousBoss.id)
          : true;
        const requirement = !unlocked
          ? `Defeat ${previousBoss?.name ?? "the previous area boss"}`
          : bossDefeated
            ? "Boss defeated"
            : previousBossDefeated
              ? "Unlocked"
              : `Requires ${previousBoss?.name ?? "the previous area boss"}`;
        return `<article class="location-card ${active ? "active" : ""} ${unlocked ? "" : "locked"}" data-location="${location.id}" style="--location-color:${location.color}"><div class="location-icon">${location.icon}</div><div><strong>${location.name}</strong><p>${location.description}</p><small>${requirement}</small><small>${bossProgress}</small></div>${unlocked ? `<button>${active ? "Current" : "Enter"}</button>` : `<span class="lock">Locked</span>`}</article>`;
      }).join("")}</div>`;
      content.querySelectorAll("[data-location]").forEach((card) => {
        card.addEventListener("click", () => {
          const id = (card as HTMLElement).dataset.location;
          if (!this.player.unlockedLocations.includes(id ?? "")) return;
          const paused = this.combat.paused;
          this.cancelPendingRespawn();
          this.location = locations.find((item) => item.id === id) ?? this.location;
          this.player.selectedLocation = this.location.id;
          this.combat.stop();
          const template = this.chooseMonster();
          this.combat = new CombatSystem(this.player, template, this.location.tier, this.combatCallbacks(), this.location.id);
          this.combat.setPaused(paused);
          this.combat.start();
          this.save();
          this.render();
        });
      });
    } else {
      content.innerHTML = `<div class="tab-title"><span>Vampire Statistics</span></div>
        <div class="statistics"><div><span>Blood Essence Earned</span><strong>${this.player.bloodEssence}</strong></div><div><span>Abilities Absorbed</span><strong>${this.player.acquiredAbilities.filter((id) => abilities.find((a) => a.id === id)?.absorbable).length}</strong></div><div><span>Bosses Defeated</span><strong>${this.player.defeatedBosses.length}/${locations.length}</strong></div><div><span>Unlocked Areas</span><strong>${this.player.unlockedLocations.length}/${locations.length}</strong></div><div><span>Upgrade Ranks</span><strong>${Object.values(this.player.upgrades).reduce((sum, value) => sum + value, 0)}</strong></div></div>`;
    }
  }

  private renderAbilityCard(ability: (typeof abilities)[number]): string {
    const level = this.player.getAbilityLevel(ability.id);
    const monster = monsters.find((item) => item.abilityId === ability.id);
    const speciesId = monster?.speciesId ?? monster?.id;
    const maxLevel = ability.maxLevel ?? 1;

    if (!ability.absorbable) {
      return `<article class="ability-card ${ability.type}">
        <div class="ability-icon">${ability.icon}</div>
        <div><div class="ability-name">${ability.name}<span>${ability.type}</span></div>
        <p>${ability.description}</p><small>${ability.cooldown}s cooldown</small></div>
      </article>`;
    }

    const count = speciesId ? this.player.getSpeciesDefeats(speciesId) : 0;
    const requirements = ability.evolutionRequirements ?? [1, 3, 6];
    const next = requirements.find((requirement) => requirement > count);
    const progressTarget = level >= maxLevel ? count : (next ?? requirements[requirements.length - 1]);
    const progressStart = level <= 1 ? 0 : (requirements[level - 2] ?? 0);
    const progressPercent = level >= maxLevel ? 100 : Math.max(0, Math.min(100, (count - progressStart) / Math.max(1, progressTarget - progressStart) * 100));
    const progressText = level >= maxLevel
      ? "Maximum evolution reached"
      : `${count}/${progressTarget} powerful ${monster?.name ?? "species"} defeats`;

    return `<article class="ability-card ${ability.type} evolved">
      <div class="ability-icon">${ability.icon}<b>Lv.${level}</b></div>
      <div><div class="ability-name">${ability.name}<span>${ability.type} · Level ${level}</span></div>
      <p>${ability.description}</p>
      <div class="evolution-progress"><div><span>${level >= maxLevel ? "Evolution complete" : `Next evolution: Level ${level + 1}`}</span><strong>${progressText}</strong></div><div class="bar evolution"><div style="width:${progressPercent}%"></div></div></div></div>
    </article>`;
  }

  private renderLogs(): void {
    const log = document.querySelector("#combat-log");
    if (!log) return;
    log.innerHTML = this.logs.slice(-50).map((entry) => `<div class="log-entry ${entry.type}"><span>•</span>${entry.message}</div>`).join("");
    log.scrollTop = log.scrollHeight;
  }

  private addLog(message: string, type: "normal" | "damage" | "heal" | "victory" | "ability" = "normal"): void {
    this.logs.push({ message, type });
    this.renderLogs();
    if (type === "victory" || type === "ability") this.showCombatToast(message, type);
  }

  private showCombatToast(message: string, type: "victory" | "ability"): void {
    const toast = document.querySelector("#ability-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `ability-toast ${type} visible`;
    window.setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  private showAbsorption(monsterName: string, abilityName: string, description: string, resultType: "acquired" | "evolved" = "acquired", level = 1): void {
    const modal = document.querySelector("#absorption-modal");
    if (!modal) return;
    const heading = modal.querySelector("h2");
    if (heading) heading.textContent = resultType === "evolved" ? "Ability Evolution Complete" : "Blood Absorption Successful";
    document.querySelector("#absorb-monster")!.textContent = `Monster Defeated: ${monsterName}`;
    document.querySelector("#absorb-name")!.textContent = resultType === "evolved" ? `${abilityName} evolved to Level ${level}` : `New Ability Acquired: ${abilityName}`;
    document.querySelector("#absorb-effect")!.textContent = `Effect: ${description}${level > 1 ? ` · Evolution bonuses active at Level ${level}` : ""}`;
    modal.querySelector(".modal-card")?.classList.toggle("evolution-card", resultType === "evolved");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-label", resultType === "evolved" ? "Ability evolved" : "Blood absorption successful");
  }

  private showDeath(monsterName: string): void {
    const modal = document.querySelector("#death-modal");
    if (!modal) return;
    document.querySelector("#death-monster")!.textContent = `Slain by ${monsterName}`;
    modal.classList.remove("hidden");
  }

  private hideDeath(): void {
    document.querySelector("#death-modal")?.classList.add("hidden");
  }

  private save(manual = false): void {
    this.player.health = this.combat.playerHealth;
    SaveSystem.save(this.player, this.combat.playerHealth);
    const status = document.querySelector("#save-status");
    if (status) {
      status.textContent = manual ? "Saved just now" : "Saved";
      window.setTimeout(() => { if (status) status.textContent = "Saved"; }, 1600);
    }
  }
}
