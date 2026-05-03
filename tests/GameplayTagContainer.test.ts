import { describe, it, expect, beforeEach } from "vitest";
import { GameplayTag } from "../src/GameplayTag.js";
import { GameplayTagContainer } from "../src/GameplayTagContainer.js";
import { GameplayTagRegistry } from "../src/GameplayTagRegistry.js";

describe("GameplayTagContainer", () => {
  let reg: GameplayTagRegistry;

  beforeEach(() => {
    reg = GameplayTagRegistry.instance();
    reg.reset();
  });

  it("addTag and count", () => {
    const a = reg.registerTag("A");
    const b = reg.registerTag("B");
    const c = new GameplayTagContainer();
    c.addTag(a);
    c.addTag(b);
    expect(c.count).toBe(2);
  });

  it("addTag deduplicates", () => {
    const a = reg.registerTag("A");
    const c = new GameplayTagContainer();
    c.addTag(a);
    c.addTag(a);
    expect(c.count).toBe(1);
  });

  it("addTag ignores NONE", () => {
    const c = new GameplayTagContainer();
    c.addTag(GameplayTag.NONE);
    expect(c.count).toBe(0);
  });

  it("removeTag", () => {
    const a = reg.registerTag("A");
    const c = GameplayTagContainer.fromTags(a);
    c.removeTag(a);
    expect(c.isEmpty).toBe(true);
  });

  it("removeTag is no-op for missing tag", () => {
    const a = reg.registerTag("A");
    const b = reg.registerTag("B");
    const c = GameplayTagContainer.fromTags(a);
    c.removeTag(b);
    expect(c.count).toBe(1);
  });

  it("clear removes all tags", () => {
    const c = GameplayTagContainer.fromTags(
      reg.registerTag("A"),
      reg.registerTag("B"),
    );
    c.clear();
    expect(c.isEmpty).toBe(true);
  });

  describe("hasTag", () => {
    it("exact: only matches the exact tag", () => {
      reg.registerTag("A.B.C");
      const c = GameplayTagContainer.fromTags(reg.getTag("A.B.C"));
      expect(c.hasTag(reg.getTag("A.B.C"), true)).toBe(true);
      expect(c.hasTag(reg.getTag("A.B"), true)).toBe(false);
      expect(c.hasTag(reg.getTag("A"), true)).toBe(false);
    });

    it("non-exact: matches tag and its descendants", () => {
      reg.registerTag("Damage.Fire");
      reg.registerTag("Damage.Ice");
      const c = GameplayTagContainer.fromTags(reg.getTag("Damage.Fire"));
      expect(c.hasTag(reg.getTag("Damage"))).toBe(true); // has a descendant of Damage
      expect(c.hasTag(reg.getTag("Damage.Fire"))).toBe(true);
      expect(c.hasTag(reg.getTag("Damage.Ice"))).toBe(false);
    });

    it("non-exact: tag satisfies itself", () => {
      const a = reg.registerTag("A");
      const c = GameplayTagContainer.fromTags(a);
      expect(c.hasTag(a)).toBe(true);
    });
  });

  describe("hasAny", () => {
    it("returns true when at least one tag overlaps (exact)", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
      expect(c1.hasAny(c2, true)).toBe(true);
    });

    it("returns false with no overlap (exact)", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("A"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("B"));
      expect(c1.hasAny(c2, true)).toBe(false);
    });

    it("non-exact matches through hierarchy", () => {
      reg.registerTag("Damage.Fire");
      reg.registerTag("Damage.Ice");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("Damage.Fire"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("Damage")); // query for any Damage
      expect(c1.hasAny(c2)).toBe(true);
    });
  });

  describe("hasAll", () => {
    it("returns true when all tags are present (exact)", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      const c = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      const query = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      expect(c.hasAll(query, true)).toBe(true);
    });

    it("returns false when one tag is missing (exact)", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c = GameplayTagContainer.fromTags(reg.getTag("A"));
      const query = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("C"));
      expect(c.hasAll(query, true)).toBe(false);
    });

    it("empty query is vacuously true", () => {
      const c = GameplayTagContainer.fromTags(reg.registerTag("A"));
      const empty = new GameplayTagContainer();
      expect(c.hasAll(empty)).toBe(true);
    });

    it("non-exact matches through hierarchy", () => {
      reg.registerTag("Damage.Fire");
      reg.registerTag("Status.Burning");
      const c = GameplayTagContainer.fromTags(
        reg.getTag("Damage.Fire"),
        reg.getTag("Status.Burning"),
      );
      const query = GameplayTagContainer.fromTags(
        reg.getTag("Damage"),
        reg.getTag("Status"),
      );
      expect(c.hasAll(query)).toBe(true);
    });
  });

  describe("iteration", () => {
    it("tags() yields all contained tags", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c = GameplayTagContainer.fromTags(
        reg.getTag("C"),
        reg.getTag("A"),
      );
      const names = [...c.tags()].map((t) => t.name);
      expect(names).toEqual(["A", "C"]); // sorted
    });
  });

  describe("set operations", () => {
    it("intersection returns common tags", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
      const result = GameplayTagContainer.intersection(c1, c2);
      expect([...result.tags()].map((t) => t.name)).toEqual(["B"]);
    });

    it("union returns all tags", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
      const result = GameplayTagContainer.union(c1, c2);
      expect([...result.tags()].map((t) => t.name)).toEqual(["A", "B", "C"]);
    });

    it("difference returns tags in a but not b", () => {
      reg.registerTag("A");
      reg.registerTag("B");
      reg.registerTag("C");
      const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
      const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
      const result = GameplayTagContainer.difference(c1, c2);
      expect([...result.tags()].map((t) => t.name)).toEqual(["A"]);
    });

    describe("unionAll", () => {
      it("returns an empty container for zero arguments", () => {
        const result = GameplayTagContainer.unionAll();
        expect(result.isEmpty).toBe(true);
        expect(result.count).toBe(0);
      });

      it("returns a copy of a single container", () => {
        reg.registerTag("A");
        reg.registerTag("B");
        const c = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
        const result = GameplayTagContainer.unionAll(c);
        expect([...result.tags()].map((t) => t.name)).toEqual(["A", "B"]);
      });

      it("merges two containers with deduplication", () => {
        reg.registerTag("A");
        reg.registerTag("B");
        reg.registerTag("C");
        const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
        const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
        const result = GameplayTagContainer.unionAll(c1, c2);
        expect([...result.tags()].map((t) => t.name)).toEqual(["A", "B", "C"]);
      });

      it("merges three containers with deduplication", () => {
        reg.registerTag("A");
        reg.registerTag("B");
        reg.registerTag("C");
        reg.registerTag("D");
        const c1 = GameplayTagContainer.fromTags(reg.getTag("A"));
        const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
        const c3 = GameplayTagContainer.fromTags(reg.getTag("C"), reg.getTag("D"));
        const result = GameplayTagContainer.unionAll(c1, c2, c3);
        expect([...result.tags()].map((t) => t.name)).toEqual(["A", "B", "C", "D"]);
      });

      it("handles empty containers in the mix", () => {
        reg.registerTag("A");
        const c = GameplayTagContainer.fromTags(reg.getTag("A"));
        const empty = new GameplayTagContainer();
        const result = GameplayTagContainer.unionAll(empty, c, empty);
        expect([...result.tags()].map((t) => t.name)).toEqual(["A"]);
      });

      it("is equivalent to pairwise union", () => {
        reg.registerTag("A");
        reg.registerTag("B");
        reg.registerTag("C");
        const c1 = GameplayTagContainer.fromTags(reg.getTag("A"), reg.getTag("B"));
        const c2 = GameplayTagContainer.fromTags(reg.getTag("B"), reg.getTag("C"));
        const pairwise = GameplayTagContainer.union(
          GameplayTagContainer.union(c1, c2),
          GameplayTagContainer.fromTags(reg.getTag("A")),
        );
        const multi = GameplayTagContainer.unionAll(c1, c2, GameplayTagContainer.fromTags(reg.getTag("A")));
        expect([...multi.tags()].map((t) => t.name)).toEqual(
          [...pairwise.tags()].map((t) => t.name),
        );
      });
    });

    it("operations on empty containers", () => {
      const empty1 = new GameplayTagContainer();
      const empty2 = new GameplayTagContainer();
      expect(GameplayTagContainer.intersection(empty1, empty2).isEmpty).toBe(true);
      expect(GameplayTagContainer.union(empty1, empty2).isEmpty).toBe(true);
      expect(GameplayTagContainer.difference(empty1, empty2).isEmpty).toBe(true);
    });
  });

  describe("EMPTY", () => {
    it("is a shared singleton", () => {
      expect(GameplayTagContainer.EMPTY).toBe(GameplayTagContainer.EMPTY);
    });

    it("isEmpty is true", () => {
      expect(GameplayTagContainer.EMPTY.isEmpty).toBe(true);
    });

    it("count is 0", () => {
      expect(GameplayTagContainer.EMPTY.count).toBe(0);
    });

    it("tags() yields nothing", () => {
      expect([...GameplayTagContainer.EMPTY.tags()]).toEqual([]);
    });

    it("hasTag returns false for any tag", () => {
      const tag = reg.registerTag("A");
      expect(GameplayTagContainer.EMPTY.hasTag(tag)).toBe(false);
    });

    it("hasAll against EMPTY is vacuously true", () => {
      const c = GameplayTagContainer.fromTags(reg.registerTag("A"));
      expect(c.hasAll(GameplayTagContainer.EMPTY)).toBe(true);
    });

    it("EMPTY.hasAny against non-empty container is false", () => {
      reg.registerTag("A");
      const c = GameplayTagContainer.fromTags(reg.getTag("A"));
      expect(GameplayTagContainer.EMPTY.hasAny(c)).toBe(false);
    });

    it("set operations with EMPTY", () => {
      reg.registerTag("A");
      const c = GameplayTagContainer.fromTags(reg.getTag("A"));

      expect(
        GameplayTagContainer.intersection(c, GameplayTagContainer.EMPTY).isEmpty,
      ).toBe(true);
      expect(
        GameplayTagContainer.intersection(GameplayTagContainer.EMPTY, c).isEmpty,
      ).toBe(true);

      expect(
        [...GameplayTagContainer.union(c, GameplayTagContainer.EMPTY).tags()].map(
          (t) => t.name,
        ),
      ).toEqual(["A"]);

      expect(
        [
          ...GameplayTagContainer.difference(c, GameplayTagContainer.EMPTY).tags(),
        ].map((t) => t.name),
      ).toEqual(["A"]);

      expect(
        GameplayTagContainer.difference(GameplayTagContainer.EMPTY, c).isEmpty,
      ).toBe(true);
    });
  });

  describe("fromTags", () => {
    it("creates a container from variadic tags", () => {
      const a = reg.registerTag("A");
      const b = reg.registerTag("B");
      const c = GameplayTagContainer.fromTags(a, b);
      expect(c.count).toBe(2);
      expect(c.hasTag(a, true)).toBe(true);
      expect(c.hasTag(b, true)).toBe(true);
    });
  });
});
