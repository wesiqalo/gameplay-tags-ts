import { GameplayTag } from "./GameplayTag.js";

export class GameplayTagRegistry {
  private static _instance: GameplayTagRegistry | undefined;

  private tagNames: string[] = [];
  private tagToIndex = new Map<string, number>();
  private tagCache: GameplayTag[] = [];

  private parentIndexArr: number[] = [];
  private depthArr: number[] = [];
  private descendantRangeEndArr: number[] = [];

  private dirty = false;

  private constructor() {}

  static instance(): GameplayTagRegistry {
    return (GameplayTagRegistry._instance ??= new GameplayTagRegistry());
  }

  registerTag(name: string): GameplayTag {
    const segments = name.split(".");
    for (let i = 1; i <= segments.length; i++) {
      const prefix = segments.slice(0, i).join(".");
      if (!this.tagToIndex.has(prefix)) {
        const idx = this.insertSorted(prefix);
        this.tagCache.splice(idx, 0, new GameplayTag(idx));
        this.updateCachedTagIndices(idx + 1);
        this.dirty = true;
      }
    }
    // After insertions, indices may have shifted — return from map
    return this.tagCache[this.tagToIndex.get(name)!];
  }

  getTag(name: string): GameplayTag {
    this.ensureFinalized();
    const idx = this.tagToIndex.get(name);
    if (idx === undefined) {
      throw new Error(`Tag "${name}" is not registered`);
    }
    return this.tagCache[idx];
  }

  findTag(name: string): GameplayTag {
    this.ensureFinalized();
    const idx = this.tagToIndex.get(name);
    return idx !== undefined ? this.tagCache[idx] : GameplayTag.NONE;
  }

  isRegistered(name: string): boolean {
    return this.tagToIndex.has(name);
  }

  get tagCount(): number {
    return this.tagNames.length;
  }

  reset(): void {
    this.tagNames = [];
    this.tagToIndex.clear();
    this.tagCache = [];
    this.parentIndexArr = [];
    this.depthArr = [];
    this.descendantRangeEndArr = [];
    this.dirty = false;
  }

  // --- Internal API (used by GameplayTag / GameplayTagContainer) ---

  /** @internal */
  getTagName(index: number): string {
    return this.tagNames[index];
  }

  /** @internal */
  getParentIndex(index: number): number {
    this.ensureFinalized();
    return this.parentIndexArr[index];
  }

  /** @internal */
  getDepth(index: number): number {
    this.ensureFinalized();
    return this.depthArr[index];
  }

  /** @internal */
  getDescendantRangeEnd(index: number): number {
    this.ensureFinalized();
    return this.descendantRangeEndArr[index];
  }

  /** @internal */
  getCachedTag(index: number): GameplayTag {
    return this.tagCache[index];
  }

  /** @internal */
  isAncestorOf(ancestorIndex: number, descendantIndex: number): boolean {
    this.ensureFinalized();
    return (
      descendantIndex > ancestorIndex &&
      descendantIndex < this.descendantRangeEndArr[ancestorIndex]
    );
  }

  // --- Private helpers ---

  private ensureFinalized(): void {
    if (this.dirty) {
      this.finalize();
    }
  }

  /**
   * Insert a tag name into the sorted tagNames array.
   * Returns the insertion index. Updates tagToIndex for all shifted entries.
   */
  private insertSorted(name: string): number {
    let lo = 0;
    let hi = this.tagNames.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.tagNames[mid] < name) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this.tagNames.splice(lo, 0, name);

    // Update lookup indices for all entries shifted by the insertion.
    for (let i = lo + 1; i < this.tagNames.length; i++) {
      this.tagToIndex.set(this.tagNames[i], i);
    }
    this.tagToIndex.set(name, lo);
    return lo;
  }

  private updateCachedTagIndices(startIndex: number): void {
    for (let i = startIndex; i < this.tagCache.length; i++) {
      this.tagCache[i]._updateIndex(i);
    }
  }

  /**
   * Rebuild all parallel metadata arrays from the sorted tagNames.
   */
  private finalize(): void {
    const n = this.tagNames.length;
    this.parentIndexArr = new Array(n);
    this.depthArr = new Array(n);
    this.descendantRangeEndArr = new Array(n);

    for (let i = 0; i < n; i++) {
      const name = this.tagNames[i];
      const dotCount = countDots(name);
      this.depthArr[i] = dotCount + 1;

      // Find parent
      if (dotCount === 0) {
        this.parentIndexArr[i] = -1;
      } else {
        const parentName = name.slice(0, name.lastIndexOf("."));
        this.parentIndexArr[i] = this.tagToIndex.get(parentName)!;
      }

      // Descendant range end: first index after i whose name does NOT start with `name.`
      // Since the array is sorted, all descendants of "A.B" are contiguous entries
      // starting with "A.B." that immediately follow "A.B".
      const prefix = name + ".";
      let end = i + 1;
      while (end < n && this.tagNames[end].startsWith(prefix)) {
        end++;
      }
      this.descendantRangeEndArr[i] = end;
    }

    this.dirty = false;
  }
}

function countDots(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) === 46) count++;
  }
  return count;
}
