import { describe, expect, it } from "vitest";
import { factionByRace, formatMoney, formatPlayed } from "@/server/game/wow";

describe("wow helpers", () => {
  it("maps WotLK races to factions", () => {
    expect(factionByRace(1)).toBe("alliance");
    expect(factionByRace(10)).toBe("horde");
  });

  it("formats money from copper", () => {
    expect(formatMoney(123456)).toEqual({ gold: 12, silver: 34, copper: 56 });
  });

  it("formats played time", () => {
    expect(formatPlayed(90061)).toEqual({ days: 1, hours: 1, minutes: 1 });
  });
});
