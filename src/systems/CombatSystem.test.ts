// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { Player } from "../models/Player";
import type { MonsterTemplate } from "../models/Monster";
import { CombatSystem, type CombatCallbacks } from "./CombatSystem";

const callbacks = (): CombatCallbacks => ({
  onUpdate: vi.fn(),
  onLog: vi.fn(),
  onAbsorb: vi.fn(),
  onDeath: vi.fn(),
  onRecover: vi.fn(),
  onSave: vi.fn(),
});

const monsterTemplate: MonsterTemplate = {
  id: "test-strong-monster",
  speciesId: "test-strong-monster",
  name: "Test Strong Monster",
  level: 20,
  health: 100,
  attack: 1,
  defense: 0,
  speed: 10,
  rank: "normal",
  experience: 10,
  bloodEssence: 10,
  abilityId: "blood-scent",
  icon: "!",
};

interface CombatInternals {
  monsterAttack(): void;
}

describe("CombatSystem", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("recovers and resumes combat after the player dies", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(1);

    const player = new Player();
    player.health = 1;
    const combatCallbacks = callbacks();
    const combat = new CombatSystem(player, monsterTemplate, 1, combatCallbacks);

    (combat as unknown as CombatInternals).monsterAttack();

    expect(combatCallbacks.onDeath).toHaveBeenCalledWith("Test Strong Monster");
    expect(combat["resolved"]).toBe(true);

    vi.advanceTimersByTime(1800);

    expect(combat["resolved"]).toBe(false);
    expect(combat.playerHealth).toBeGreaterThan(0);
    expect(combatCallbacks.onRecover).toHaveBeenCalledOnce();
    expect(combat.intervalId).toBeDefined();
  });
});
