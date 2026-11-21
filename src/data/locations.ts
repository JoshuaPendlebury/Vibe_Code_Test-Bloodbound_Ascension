export interface Location {
  id: string;
  name: string;
  description: string;
  tier: number;
  unlockLevel: number;
  unlockBoss: boolean;
  bossId: string;
  monsterIds: string[];
  icon: string;
  color: string;
}

export const locations: Location[] = [
  { id: "graveyard", name: "The Forgotten Graveyard", description: "Weak undead and corrupted animals.", tier: 1, unlockLevel: 1, unlockBoss: false, bossId: "ossuary-king", monsterIds: ["feral-rat", "grave-ghoul", "shadow-wolf", "ossuary-king"], icon: "†", color: "#4e5968" },
  { id: "forest", name: "The Cursed Forest", description: "Predators and spirits lurk between black boughs.", tier: 2, unlockLevel: 5, unlockBoss: false, bossId: "thornheart-matriarch", monsterIds: ["shadow-wolf", "grave-ghoul", "blood-wraith", "thornheart-matriarch"], icon: "♣", color: "#355342" },
  { id: "castle", name: "The Crimson Castle", description: "Ancient warriors and vampires guard forbidden power.", tier: 3, unlockLevel: 10, unlockBoss: false, bossId: "crimson-sovereign", monsterIds: ["undead-knight", "blood-wraith", "ancient-vampire", "abyssal-demon", "crimson-sovereign"], icon: "♜", color: "#63263a" },
];
