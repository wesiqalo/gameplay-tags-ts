import { describe, it, expect, beforeEach } from "vitest";
import { GameplayTag } from "../src/GameplayTag.js";
import { GameplayTagRegistry } from "../src/GameplayTagRegistry.js";

describe("GameplayTag", () => {
  let reg: GameplayTagRegistry;

  beforeEach(() => {
    reg = GameplayTagRegistry.instance();
    reg.reset();
  });

  it("NONE is invalid", () => {
    expect(GameplayTag.NONE.isValid).toBe(false);
    expect(GameplayTag.NONE.name).toBe("");
    expect(GameplayTag.NONE.depth).toBe(0);
    expect(GameplayTag.NONE.parent).toBe(GameplayTag.NONE);
  });

  it("name returns the dot-separated name", () => {
    const tag = reg.registerTag("Ability.Skill.Fire");
    expect(tag.name).toBe("Ability.Skill.Fire");
  });

  it("depth reflects hierarchy level", () => {
    reg.registerTag("A.B.C");
    expect(reg.getTag("A").depth).toBe(1);
    expect(reg.getTag("A.B").depth).toBe(2);
    expect(reg.getTag("A.B.C").depth).toBe(3);
  });

  it("parent navigates up the hierarchy", () => {
    reg.registerTag("A.B.C");
    const c = reg.getTag("A.B.C");
    const b = reg.getTag("A.B");
    const a = reg.getTag("A");
    expect(c.parent).toBe(b);
    expect(b.parent).toBe(a);
    expect(a.parent).toBe(GameplayTag.NONE);
  });

  describe("matchesTag", () => {
    it("exact match requires same tag", () => {
      reg.registerTag("A.B.C");
      const abc = reg.getTag("A.B.C");
      const a = reg.getTag("A");
      expect(abc.matchesTag(abc, true)).toBe(true);
      expect(abc.matchesTag(a, true)).toBe(false);
    });

    it("non-exact match: specific tag satisfies ancestor query", () => {
      reg.registerTag("Damage.Fire");
      const fire = reg.getTag("Damage.Fire");
      const damage = reg.getTag("Damage");
      expect(fire.matchesTag(damage)).toBe(true); // fire satisfies "Damage" query
      expect(damage.matchesTag(fire)).toBe(false); // damage does NOT satisfy "Damage.Fire" query
    });

    it("tag matches itself (non-exact)", () => {
      const tag = reg.registerTag("X");
      expect(tag.matchesTag(tag)).toBe(true);
    });

    it("NONE never matches", () => {
      const tag = reg.registerTag("A");
      expect(GameplayTag.NONE.matchesTag(tag)).toBe(false);
      expect(tag.matchesTag(GameplayTag.NONE)).toBe(false);
    });
  });

  it("equals compares by index", () => {
    const a = reg.registerTag("A");
    const also_a = reg.getTag("A");
    expect(a.equals(also_a)).toBe(true);
    expect(a.equals(GameplayTag.NONE)).toBe(false);
  });

  it("toString returns the name", () => {
    const tag = reg.registerTag("Status.Burning");
    expect(tag.toString()).toBe("Status.Burning");
  });
});
