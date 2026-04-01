import { GameplayTag } from "./GameplayTag.js";
import { GameplayTagRegistry } from "./GameplayTagRegistry.js";

export class GameplayTagContainer {
  private indices: number[] = [];

  addTag(tag: GameplayTag): void {
    if (!tag.isValid) return;
    const idx = tag.index;
    const pos = lowerBound(this.indices, idx);
    if (pos < this.indices.length && this.indices[pos] === idx) return; // dedup
    this.indices.splice(pos, 0, idx);
  }

  removeTag(tag: GameplayTag): void {
    if (!tag.isValid) return;
    const pos = lowerBound(this.indices, tag.index);
    if (pos < this.indices.length && this.indices[pos] === tag.index) {
      this.indices.splice(pos, 1);
    }
  }

  clear(): void {
    this.indices.length = 0;
  }

  /**
   * Does this container hold the given tag?
   *
   * - exact=true: only if the exact tag is present
   * - exact=false: if the tag OR any descendant of it is present
   */
  hasTag(tag: GameplayTag, exact = false): boolean {
    if (!tag.isValid) return false;
    if (exact) {
      return binarySearch(this.indices, tag.index) >= 0;
    }
    // Check if any index in [tag.index, descendantRangeEnd) exists in our sorted array
    const rangeEnd = GameplayTagRegistry.instance().getDescendantRangeEnd(tag.index);
    const pos = lowerBound(this.indices, tag.index);
    return pos < this.indices.length && this.indices[pos] < rangeEnd;
  }

  hasAny(other: GameplayTagContainer, exact = false): boolean {
    if (exact) {
      return mergeJoinHasAny(this.indices, other.indices);
    }
    for (const idx of other.indices) {
      const reg = GameplayTagRegistry.instance();
      const rangeEnd = reg.getDescendantRangeEnd(idx);
      const pos = lowerBound(this.indices, idx);
      if (pos < this.indices.length && this.indices[pos] < rangeEnd) {
        return true;
      }
    }
    return false;
  }

  hasAll(other: GameplayTagContainer, exact = false): boolean {
    if (other.indices.length === 0) return true;
    if (exact) {
      return mergeJoinHasAll(this.indices, other.indices);
    }
    const reg = GameplayTagRegistry.instance();
    for (const idx of other.indices) {
      const rangeEnd = reg.getDescendantRangeEnd(idx);
      const pos = lowerBound(this.indices, idx);
      if (pos >= this.indices.length || this.indices[pos] >= rangeEnd) {
        return false;
      }
    }
    return true;
  }

  get count(): number {
    return this.indices.length;
  }

  get isEmpty(): boolean {
    return this.indices.length === 0;
  }

  *tags(): IterableIterator<GameplayTag> {
    const reg = GameplayTagRegistry.instance();
    for (const idx of this.indices) {
      yield reg.getCachedTag(idx);
    }
  }

  static fromTags(...tags: GameplayTag[]): GameplayTagContainer {
    const c = new GameplayTagContainer();
    for (const tag of tags) {
      c.addTag(tag);
    }
    return c;
  }

  // --- Set operations ---

  static intersection(
    a: GameplayTagContainer,
    b: GameplayTagContainer,
  ): GameplayTagContainer {
    const result = new GameplayTagContainer();
    result.indices = mergeJoinIntersection(a.indices, b.indices);
    return result;
  }

  static union(
    a: GameplayTagContainer,
    b: GameplayTagContainer,
  ): GameplayTagContainer {
    const result = new GameplayTagContainer();
    result.indices = mergeUnion(a.indices, b.indices);
    return result;
  }

  static difference(
    a: GameplayTagContainer,
    b: GameplayTagContainer,
  ): GameplayTagContainer {
    const result = new GameplayTagContainer();
    result.indices = mergeDifference(a.indices, b.indices);
    return result;
  }
}

// --- Binary search helpers ---

function lowerBound(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function binarySearch(arr: number[], value: number): number {
  const pos = lowerBound(arr, value);
  return pos < arr.length && arr[pos] === value ? pos : -1;
}

// --- Merge-join helpers for exact operations on sorted arrays ---

function mergeJoinHasAny(a: number[], b: number[]): boolean {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) return true;
    if (a[i] < b[j]) i++;
    else j++;
  }
  return false;
}

function mergeJoinHasAll(a: number[], b: number[]): boolean {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      j++;
      i++;
    } else if (a[i] < b[j]) {
      i++;
    } else {
      return false;
    }
  }
  return j >= b.length;
}

function mergeJoinIntersection(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push(a[i]);
      i++;
      j++;
    } else if (a[i] < b[j]) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

function mergeUnion(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push(a[i]);
      i++;
      j++;
    } else if (a[i] < b[j]) {
      result.push(a[i]);
      i++;
    } else {
      result.push(b[j]);
      j++;
    }
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}

function mergeDifference(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (a[i] < b[j]) {
      result.push(a[i]);
      i++;
    } else {
      j++;
    }
  }
  while (i < a.length) result.push(a[i++]);
  return result;
}
