import "server-only";
import { charactersDb } from "@/server/db/connections";
import { classNames, factionByRace, raceNames } from "./wow";

const classes = classNames();
const races = raceNames();

export async function charactersForAccount(accountId: number) {
  const rows = await charactersDb
    .selectFrom("characters")
    .select(["guid", "name", "race", "class", "level", "online", "totaltime"])
    .where("account", "=", accountId)
    .orderBy("level", "desc")
    .orderBy("name")
    .execute();

  return rows.map((character) => ({
    ...character,
    className: classes[character.class] ?? "Unknown",
    raceName: races[character.race] ?? "Unknown",
    faction: factionByRace(character.race)
  }));
}
