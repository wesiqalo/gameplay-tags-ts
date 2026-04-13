import { describe, it, expect, beforeEach } from "vitest";
import { GameplayTagRegistry } from "../src/GameplayTagRegistry.js";
import { GameplayTag } from "../src/GameplayTag.js";

describe("GameplayTagRegistry", () => {
  let reg: GameplayTagRegistry;

  beforeEach(() => {
    reg = GameplayTagRegistry.instance();
    reg.reset();
  });

  it("registers a leaf tag and auto-creates parents", () => {
    reg.registerTag("A.B.C");
    expect(reg.tagCount).toBe(3);
    expect(reg.isRegistered("A")).toBe(true);
    expect(reg.isRegistered("A.B")).toBe(true);
    expect(reg.isRegistered("A.B.C")).toBe(true);
  });

  it("is idempotent for duplicate registrations", () => {
    reg.registerTag("A.B");
    reg.registerTag("A.B");
    reg.registerTag("A.B.C");
    expect(reg.tagCount).toBe(3); // A, A.B, A.B.C
  });

  it("getTag returns the tag, throws for unknown", () => {
    reg.registerTag("X.Y");
    const tag = reg.getTag("X.Y");
    expect(tag.isValid).toBe(true);
    expect(tag.name).toBe("X.Y");
    expect(() => reg.getTag("Z")).toThrow('Tag "Z" is not registered');
  });

  it("findTag returns NONE for unknown tags", () => {
    const tag = reg.findTag("Unknown");
    expect(tag).toBe(GameplayTag.NONE);
    expect(tag.isValid).toBe(false);
  });

  it("returns cached tag instances (=== equality)", () => {
    const a = reg.registerTag("Foo");
    const b = reg.getTag("Foo");
    expect(a).toBe(b);
  });

  it("reset clears all state", () => {
    reg.registerTag("A.B.C");
    reg.reset();
    expect(reg.tagCount).toBe(0);
    expect(reg.isRegistered("A")).toBe(false);
  });

  it("handles multiple independent hierarchies", () => {
    reg.registerTag("Ability.Skill.Fire");
    reg.registerTag("Status.Burning");
    expect(reg.tagCount).toBe(5); // Ability, Ability.Skill, Ability.Skill.Fire, Status, Status.Burning
  });

  it("keeps cached tags valid when registration happens out of order", () => {
    const z = reg.registerTag("Z");

    expect(() => reg.registerTag("A")).not.toThrow();
    expect(z.index).toBe(1);
    expect(z.name).toBe("Z");
    expect(reg.getTag("Z")).toBe(z);
  });

  it("isAncestorOf works correctly", () => {
    reg.registerTag("A.B.C");
    reg.registerTag("A.B.D");
    const aIdx = reg.getTag("A").index;
    const abIdx = reg.getTag("A.B").index;
    const abcIdx = reg.getTag("A.B.C").index;
    const abdIdx = reg.getTag("A.B.D").index;

    expect(reg.isAncestorOf(aIdx, abcIdx)).toBe(true);
    expect(reg.isAncestorOf(aIdx, abdIdx)).toBe(true);
    expect(reg.isAncestorOf(abIdx, abcIdx)).toBe(true);
    expect(reg.isAncestorOf(abcIdx, aIdx)).toBe(false);
    expect(reg.isAncestorOf(abcIdx, abdIdx)).toBe(false);
  });
});
