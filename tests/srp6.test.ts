import { describe, expect, it } from "vitest";
import { computeSrp6Verifier } from "@/server/auth/srp6";

describe("computeSrp6Verifier", () => {
  it("returns a stable 32 byte verifier", async () => {
    const salt = Buffer.alloc(32, 1);
    const verifier = await computeSrp6Verifier("rinrintin", "scotty", salt);

    expect(verifier).toHaveLength(32);
    expect(verifier.toString("hex")).toBe("26b85668bf595e541a57cf62cc8e7d84c566878a97404db54cf3731a7704c77c");
  });

  it("uppercases username and password like AzerothCore", async () => {
    const salt = Buffer.alloc(32, 7);

    await expect(computeSrp6Verifier("User", "Pass", salt)).resolves.toEqual(
      await computeSrp6Verifier("USER", "PASS", salt)
    );
  });
});
