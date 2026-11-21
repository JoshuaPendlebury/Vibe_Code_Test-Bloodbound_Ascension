import { Player, type SavedPlayer } from "../models/Player";

const KEY = "bloodbound-ascension-save-v1";

export class SaveSystem {
  static load(player: Player): boolean {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as Partial<SavedPlayer>;
      if (!data || typeof data !== "object") return false;
      player.restore(data);
      return true;
    } catch {
      localStorage.removeItem(KEY);
      return false;
    }
  }

  static save(player: Player, health: number): void {
    localStorage.setItem(KEY, JSON.stringify(player.serialize(health)));
  }

  static clear(): void {
    localStorage.removeItem(KEY);
  }
}
