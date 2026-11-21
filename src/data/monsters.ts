import type { MonsterTemplate } from "../models/Monster";

export const monsters: MonsterTemplate[] = [
  { id: "feral-rat", name: "Feral Rat", level: 1, health: 42, attack: 7, defense: 2, speed: 12, rank: "normal", experience: 18, bloodEssence: 8, abilityId: "blood-scent", icon: "🐀" },
  { id: "grave-ghoul", name: "Grave Ghoul", level: 2, health: 58, attack: 10, defense: 4, speed: 8, rank: "normal", experience: 24, bloodEssence: 12, abilityId: "essence-conduit", icon: "☠" },
  { id: "shadow-wolf", name: "Shadow Wolf", level: 3, health: 82, attack: 14, defense: 6, speed: 16, rank: "elite", experience: 36, bloodEssence: 22, abilityId: "shadow-step", icon: "🐺" },
  { id: "undead-knight", name: "Undead Knight", level: 5, health: 150, attack: 20, defense: 18, speed: 9, rank: "elite", experience: 58, bloodEssence: 38, abilityId: "bone-armor", icon: "⚔" },
  { id: "blood-wraith", name: "Blood Wraith", level: 7, health: 180, attack: 26, defense: 12, speed: 19, rank: "elite", experience: 72, bloodEssence: 48, abilityId: "life-drain", icon: "♆" },
  { id: "ancient-vampire", name: "Ancient Vampire", level: 10, health: 300, attack: 38, defense: 24, speed: 22, rank: "boss", experience: 120, bloodEssence: 90, abilityId: "blood-frenzy", icon: "🦇" },
  { id: "abyssal-demon", name: "Abyssal Demon", level: 13, health: 430, attack: 52, defense: 32, speed: 18, rank: "boss", experience: 170, bloodEssence: 130, abilityId: "demonic-strength", icon: "👹" },
];
