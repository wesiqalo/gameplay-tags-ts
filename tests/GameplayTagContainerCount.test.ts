import { describe, it, expect, beforeEach } from "vitest"
import { GameplayTag } from "../src/GameplayTag.js"
import { GameplayTagContainer } from "../src/GameplayTagContainer.js"
import { GameplayTagContainerCount } from "../src/GameplayTagContainerCount.js"
import { GameplayTagRegistry } from "../src/GameplayTagRegistry.js"

describe("GameplayTagContainerCount", () => {
  let reg: GameplayTagRegistry

  beforeEach(() => {
    reg = GameplayTagRegistry.instance()
    reg.reset()
  })

  // --- EMPTY ---

  describe("EMPTY", () => {
    it("is a shared singleton", () => {
      expect(GameplayTagContainerCount.EMPTY).toBe(
        GameplayTagContainerCount.EMPTY,
      )
    })

    it("isEmpty is true", () => {
      expect(GameplayTagContainerCount.EMPTY.isEmpty).toBe(true)
    })

    it("count is 0", () => {
      expect(GameplayTagContainerCount.EMPTY.count).toBe(0)
    })

    it("tags() yields nothing", () => {
      expect([...GameplayTagContainerCount.EMPTY.tags()]).toEqual([])
    })

    it("hasTag returns false for valid tag", () => {
      const tag = reg.registerTag("A")
      expect(GameplayTagContainerCount.EMPTY.hasTag(tag)).toBe(false)
    })

    it("getCount returns 0 for valid tag", () => {
      const tag = reg.registerTag("A")
      expect(GameplayTagContainerCount.EMPTY.getCount(tag)).toBe(0)
    })

    it("hasTag returns false for NONE", () => {
      expect(GameplayTagContainerCount.EMPTY.hasTag(GameplayTag.NONE)).toBe(
        false,
      )
    })

    it("getCount returns 0 for NONE", () => {
      expect(GameplayTagContainerCount.EMPTY.getCount(GameplayTag.NONE)).toBe(0)
    })
  })

  // --- addTag ---

  describe("addTag", () => {
    it("adds tag with default count of 1", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag)
      expect(c.getCount(tag)).toBe(1)
    })

    it("adds tag with explicit count", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      expect(c.getCount(tag)).toBe(5)
    })

    it("accumulates count when adding same tag twice", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.addTag(tag, 2)
      expect(c.getCount(tag)).toBe(5)
    })

    it("does not affect other tags", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 5)
      expect(c.getCount(b)).toBe(0)
    })

    it("ignores GameplayTag.NONE", () => {
      const c = new GameplayTagContainerCount()
      c.addTag(GameplayTag.NONE, 5)
      expect(c.isEmpty).toBe(true)
      expect(c.count).toBe(0)
    })

    it("ignores count <= 0 for a new tag", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 0)
      expect(c.getCount(tag)).toBe(0)
      expect(c.hasTag(tag)).toBe(false)
      c.addTag(tag, -1)
      expect(c.getCount(tag)).toBe(0)
      expect(c.hasTag(tag)).toBe(false)
    })

    it("preserves sorted order", () => {
      const c = new GameplayTagContainerCount()
      const b = reg.registerTag("B")
      const a = reg.registerTag("A")
      const d = reg.registerTag("D")
      const f = reg.registerTag("F")
      c.addTag(f, 1)
      c.addTag(a, 1)
      c.addTag(d, 1)
      c.addTag(b, 1)
      const names = [...c.tags()].map((t) => t.tag.name)
      expect(names).toEqual(["A", "B", "D", "F"])
    })
  })

  // --- removeTag ---

  describe("removeTag", () => {
    it("removes an existing tag", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.removeTag(tag)
      expect(c.hasTag(tag)).toBe(false)
      expect(c.getCount(tag)).toBe(0)
    })

    it("does nothing for a non-existent tag", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 5)
      c.removeTag(b)
      expect(c.getCount(a)).toBe(5)
      expect(c.count).toBe(1)
    })

    it("ignores GameplayTag.NONE", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.removeTag(GameplayTag.NONE)
      expect(c.count).toBe(1)
    })

    it("makes container empty after removing last tag", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.removeTag(tag)
      expect(c.isEmpty).toBe(true)
      expect(c.count).toBe(0)
    })

    it("does not affect other tags", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 3)
      c.addTag(b, 7)
      c.removeTag(a)
      expect(c.getCount(b)).toBe(7)
      expect(c.count).toBe(1)
    })
  })

  // --- getCount ---

  describe("getCount", () => {
    it("returns correct count for each tag", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 3)
      c.addTag(b, 7)
      expect(c.getCount(a)).toBe(3)
      expect(c.getCount(b)).toBe(7)
    })

    it("returns 0 for tag not in container", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 3)
      expect(c.getCount(b)).toBe(0)
    })

    it("returns 0 for GameplayTag.NONE", () => {
      expect(new GameplayTagContainerCount().getCount(GameplayTag.NONE)).toBe(0)
    })
  })

  // --- hasTag ---

  describe("hasTag", () => {
    it("returns true for tag present", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag)
      expect(c.hasTag(tag)).toBe(true)
    })

    it("returns false for tag not present", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a)
      expect(c.hasTag(b)).toBe(false)
    })

    it("returns false for GameplayTag.NONE", () => {
      expect(new GameplayTagContainerCount().hasTag(GameplayTag.NONE)).toBe(
        false,
      )
    })
  })

  // --- clear ---

  describe("clear", () => {
    it("leaves empty container empty", () => {
      const c = new GameplayTagContainerCount()
      c.clear()
      expect(c.isEmpty).toBe(true)
      expect(c.count).toBe(0)
    })

    it("empties non-empty container", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 3)
      c.addTag(b, 7)
      c.clear()
      expect(c.isEmpty).toBe(true)
      expect(c.count).toBe(0)
      expect([...c.tags()]).toEqual([])
    })

    it("allows re-adding after clear", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.clear()
      c.addTag(tag, 2)
      expect(c.getCount(tag)).toBe(2)
      expect(c.count).toBe(1)
    })
  })

  // --- increment ---

  describe("increment", () => {
    it("increments existing tag by 1 (default)", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.increment(tag)
      expect(c.getCount(tag)).toBe(4)
    })

    it("increments existing tag by custom amount", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.increment(tag, 10)
      expect(c.getCount(tag)).toBe(13)
    })

    it("adds tag with amount if not present", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.increment(tag, 5)
      expect(c.getCount(tag)).toBe(5)
    })

    it("does nothing for amount=0 on non-existent tag", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.increment(tag, 0)
      expect(c.hasTag(tag)).toBe(false)
      expect(c.count).toBe(0)
    })

    it("negative amount on existing tag reduces count", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.increment(tag, -2)
      expect(c.getCount(tag)).toBe(3)
    })

    it("ignores GameplayTag.NONE", () => {
      const c = new GameplayTagContainerCount()
      c.increment(GameplayTag.NONE, 5)
      expect(c.isEmpty).toBe(true)
    })
  })

  // --- decrement ---

  describe("decrement", () => {
    it("decrements existing tag by 1 (default)", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.decrement(tag)
      expect(c.getCount(tag)).toBe(4)
    })

    it("decrements existing tag by custom amount", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 10)
      c.decrement(tag, 3)
      expect(c.getCount(tag)).toBe(7)
    })

    it("removes tag when count reaches exactly 0", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.decrement(tag, 3)
      expect(c.hasTag(tag)).toBe(false)
      expect(c.isEmpty).toBe(true)
    })

    it("removes tag when count goes below 0", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 3)
      c.decrement(tag, 10)
      expect(c.hasTag(tag)).toBe(false)
      expect(c.isEmpty).toBe(true)
    })

    it("does nothing for non-existent tag", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.decrement(tag, 5)
      expect(c.count).toBe(0)
    })

    it("ignores GameplayTag.NONE", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.decrement(GameplayTag.NONE, 5)
      expect(c.getCount(tag)).toBe(5)
    })
  })

  // --- count and isEmpty ---

  describe("count and isEmpty", () => {
    it("empty: count=0, isEmpty=true", () => {
      const c = new GameplayTagContainerCount()
      expect(c.count).toBe(0)
      expect(c.isEmpty).toBe(true)
    })

    it("after adding one tag: count=1, isEmpty=false", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag)
      expect(c.count).toBe(1)
      expect(c.isEmpty).toBe(false)
    })

    it("after removing last tag: count=0, isEmpty=true", () => {
      const tag = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(tag, 5)
      c.removeTag(tag)
      expect(c.count).toBe(0)
      expect(c.isEmpty).toBe(true)
    })

    it("count reflects distinct tag count, not sum of counts", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 5)
      c.addTag(b, 10)
      expect(c.count).toBe(2)
    })
  })

  // --- tags() ---

  describe("tags()", () => {
    it("yields in sorted order", () => {
      const c = new GameplayTagContainerCount()
      const d = reg.registerTag("D")
      const a = reg.registerTag("A")
      const z = reg.registerTag("Z")
      c.addTag(z, 1)
      c.addTag(a, 1)
      c.addTag(d, 1)
      const names = [...c.tags()].map((t) => t.tag.name)
      expect(names).toEqual(["A", "D", "Z"])
    })

    it("yields correct counts", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 3)
      c.addTag(b, 7)
      const items = [...c.tags()]
      expect(items).toEqual([
        { tag: a, count: 3 },
        { tag: b, count: 7 },
      ])
    })

    it("yields nothing for empty container", () => {
      expect([...new GameplayTagContainerCount().tags()]).toEqual([])
    })

    it("works with spread", () => {
      const a = reg.registerTag("A")
      const c = new GameplayTagContainerCount()
      c.addTag(a, 5)
      const arr = [...c.tags()]
      expect(arr).toHaveLength(1)
      expect(arr[0].tag).toBe(a)
      expect(arr[0].count).toBe(5)
    })
  })

  // --- fromContainers ---

  describe("fromContainers", () => {
    it("empty input returns empty container", () => {
      const result = GameplayTagContainerCount.fromContainers()
      expect(result.isEmpty).toBe(true)
      expect(result.count).toBe(0)
    })

    it("single container: each tag has count 1", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c1 = GameplayTagContainer.fromTags(a, b)
      const result = GameplayTagContainerCount.fromContainers(c1)
      expect(result.getCount(a)).toBe(1)
      expect(result.getCount(b)).toBe(1)
    })

    it("two containers with no overlap: all tags have count 1", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = reg.registerTag("C")
      const c1 = GameplayTagContainer.fromTags(a)
      const c2 = GameplayTagContainer.fromTags(b, c)
      const result = GameplayTagContainerCount.fromContainers(c1, c2)
      expect(result.getCount(a)).toBe(1)
      expect(result.getCount(b)).toBe(1)
      expect(result.getCount(c)).toBe(1)
    })

    it("two containers with full overlap: all tags have count 2", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c1 = GameplayTagContainer.fromTags(a, b)
      const c2 = GameplayTagContainer.fromTags(a, b)
      const result = GameplayTagContainerCount.fromContainers(c1, c2)
      expect(result.getCount(a)).toBe(2)
      expect(result.getCount(b)).toBe(2)
    })

    it("two containers with partial overlap", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = reg.registerTag("C")
      const c1 = GameplayTagContainer.fromTags(a, b)
      const c2 = GameplayTagContainer.fromTags(b, c)
      const result = GameplayTagContainerCount.fromContainers(c1, c2)
      expect(result.getCount(a)).toBe(1)
      expect(result.getCount(b)).toBe(2)
      expect(result.getCount(c)).toBe(1)
    })

    it("canonical example from issue #3", () => {
      const a = reg.registerTag("A")
      const aX = reg.registerTag("A.x")
      const aY = reg.registerTag("A.y")
      const aZ = reg.registerTag("A.z")

      const c1 = GameplayTagContainer.fromTags(a, aX, aY)
      const c2 = GameplayTagContainer.fromTags(a, aX, aZ)

      const result = GameplayTagContainerCount.fromContainers(c1, c2)
      expect(result.getCount(a)).toBe(2)
      expect(result.getCount(aX)).toBe(2)
      expect(result.getCount(aY)).toBe(1)
      expect(result.getCount(aZ)).toBe(1)
    })

    it("mixed empty and non-empty containers", () => {
      const a = reg.registerTag("A")
      const c1 = GameplayTagContainer.fromTags(a)
      const c2 = GameplayTagContainer.EMPTY
      const result = GameplayTagContainerCount.fromContainers(c1, c2)
      expect(result.getCount(a)).toBe(1)
    })

    it("all empty containers returns empty", () => {
      const result = GameplayTagContainerCount.fromContainers(
        GameplayTagContainer.EMPTY,
        GameplayTagContainer.EMPTY,
      )
      expect(result.isEmpty).toBe(true)
    })

    it("same container passed twice: each tag has count 2", () => {
      const a = reg.registerTag("A")
      const b = reg.registerTag("B")
      const c = GameplayTagContainer.fromTags(a, b)
      const result = GameplayTagContainerCount.fromContainers(c, c)
      expect(result.getCount(a)).toBe(2)
      expect(result.getCount(b)).toBe(2)
    })

    it("result can be further mutated", () => {
      const a = reg.registerTag("A")
      const c1 = GameplayTagContainer.fromTags(a)
      const result = GameplayTagContainerCount.fromContainers(c1)
      expect(result.getCount(a)).toBe(1)
      result.increment(a)
      expect(result.getCount(a)).toBe(2)
      result.addTag(reg.registerTag("B"), 3)
      expect(result.getCount(reg.getTag("B"))).toBe(3)
    })
  })

  // --- Integration with hierarchical tags ---

  describe("integration", () => {
    it("works with hierarchical tag sets", () => {
      const dmg = reg.registerTag("Damage")
      const fire = reg.registerTag("Damage.Fire")
      const ice = reg.registerTag("Damage.Ice")
      const status = reg.registerTag("Status")
      const burn = reg.registerTag("Status.Burning")

      const c1 = GameplayTagContainer.fromTags(dmg, fire)
      const c2 = GameplayTagContainer.fromTags(dmg, ice, status)
      const c3 = GameplayTagContainer.fromTags(fire, burn, status)

      const result = GameplayTagContainerCount.fromContainers(c1, c2, c3)
      expect(result.getCount(dmg)).toBe(2)
      expect(result.getCount(fire)).toBe(2)
      expect(result.getCount(ice)).toBe(1)
      expect(result.getCount(status)).toBe(2)
      expect(result.getCount(burn)).toBe(1)
    })

    it("sorting is stable with hierarchical tags", () => {
      const dmg = reg.registerTag("Damage")
      const fire = reg.registerTag("Damage.Fire")
      const ice = reg.registerTag("Damage.Ice")
      const c1 = GameplayTagContainer.fromTags(ice, fire, dmg)
      const result = GameplayTagContainerCount.fromContainers(c1)
      const names = [...result.tags()].map((t) => t.tag.name)
      expect(names).toEqual(["Damage", "Damage.Fire", "Damage.Ice"])
    })
  })
})
