export interface FranchiseMetadata {
  id: number;
  name: string;
  color: string;
  borderColor: string;
}

export const FRANCHISE_MAP: Record<number, FranchiseMetadata> = {
  // MCU
  800158: { id: 800158, name: "MCU", color: "bg-red-600", borderColor: "border-red-800" }, // Captain America: Brave New World
  1023922: { id: 1023922, name: "MCU", color: "bg-red-600", borderColor: "border-red-800" }, // Thunderbolts*
  429473: { id: 429473, name: "MCU", color: "bg-red-600", borderColor: "border-red-800" }, // The Fantastic Four: First Steps
  
  // DCU
  591731: { id: 591731, name: "DCU", color: "bg-blue-600", borderColor: "border-blue-800" }, // Superman
  
  // AVATAR
  83533: { id: 83533, name: "AVATAR", color: "bg-cyan-500", borderColor: "border-cyan-700" }, // Avatar: Fire and Ash
  
  // SPY UNIVERSE (India)
  1139429: { id: 1139429, name: "SPYVERSE", color: "bg-orange-600", borderColor: "border-orange-800" }, // War 2
  1276274: { id: 1276274, name: "BOLLY", color: "bg-brutal-yellow", borderColor: "border-yellow-700" }, // Sikandar
  
  // MISSION IMPOSSIBLE
  575265: { id: 575265, name: "M:I", color: "bg-slate-700", borderColor: "border-slate-900" }, // Dead Reckoning Part 2
  
  // SPIDER-VERSE
  569094: { id: 569094, name: "SPIDEY", color: "bg-pink-600", borderColor: "border-pink-800" }, // Beyond the Spider-Verse
};
