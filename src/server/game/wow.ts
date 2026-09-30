export type Faction = "alliance" | "horde";

export function factionByRace(race: number): Faction {
  return [1, 3, 4, 7, 11].includes(race) ? "alliance" : "horde";
}

export function classNames(): Record<number, string> {
  return {
    1: "Warrior",
    2: "Paladin",
    3: "Hunter",
    4: "Rogue",
    5: "Priest",
    6: "Death Knight",
    7: "Shaman",
    8: "Mage",
    9: "Warlock",
    11: "Druid"
  };
}

export function raceNames(): Record<number, string> {
  return {
    1: "Human",
    2: "Orc",
    3: "Dwarf",
    4: "Night Elf",
    5: "Undead",
    6: "Tauren",
    7: "Gnome",
    8: "Troll",
    10: "Blood Elf",
    11: "Draenei"
  };
}

export function classColors(): Record<number, string> {
  return {
    1: "#C79C6E",
    2: "#F58CBA",
    3: "#ABD473",
    4: "#FFF569",
    5: "#FFFFFF",
    6: "#C41F3B",
    7: "#0070DE",
    8: "#69CCF0",
    9: "#9482C9",
    11: "#FF7D0A"
  };
}

export function formatMoney(copper: number): { gold: number; silver: number; copper: number } {
  return {
    gold: Math.floor(copper / 10000),
    silver: Math.floor((copper % 10000) / 100),
    copper: copper % 100
  };
}

export function formatPlayed(seconds: number): { days: number; hours: number; minutes: number } {
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60)
  };
}
