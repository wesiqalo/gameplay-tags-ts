import { GameplayTag } from "./GameplayTag.js"
import { GameplayTagRegistry } from "./GameplayTagRegistry.js"
import { GameplayTagContainer } from "./GameplayTagContainer.js"

export class GameplayTagContainerCount {
  static readonly EMPTY = new GameplayTagContainerCount()

  private _indices: number[] = []
  private _counts: number[] = []

  addTag(tag: GameplayTag, count = 1): void {
    if (!tag.isValid) return
    const pos = lowerBound(this._indices, tag.index)
    if (pos < this._indices.length && this._indices[pos] === tag.index) {
      this._counts[pos] += count
    } else if (count > 0) {
      this._indices.splice(pos, 0, tag.index)
      this._counts.splice(pos, 0, count)
    }
  }

  removeTag(tag: GameplayTag): void {
    if (!tag.isValid) return
    const pos = lowerBound(this._indices, tag.index)
    if (pos < this._indices.length && this._indices[pos] === tag.index) {
      this._indices.splice(pos, 1)
      this._counts.splice(pos, 1)
    }
  }

  getCount(tag: GameplayTag): number {
    if (!tag.isValid) return 0
    const pos = lowerBound(this._indices, tag.index)
    return pos < this._indices.length && this._indices[pos] === tag.index
      ? this._counts[pos]
      : 0
  }

  hasTag(tag: GameplayTag): boolean {
    return this.getCount(tag) > 0
  }

  clear(): void {
    this._indices.length = 0
    this._counts.length = 0
  }

  increment(tag: GameplayTag, amount = 1): void {
    if (!tag.isValid) return
    const pos = lowerBound(this._indices, tag.index)
    if (pos < this._indices.length && this._indices[pos] === tag.index) {
      this._counts[pos] += amount
    } else if (amount > 0) {
      this._indices.splice(pos, 0, tag.index)
      this._counts.splice(pos, 0, amount)
    }
  }

  decrement(tag: GameplayTag, amount = 1): void {
    if (!tag.isValid) return
    const pos = lowerBound(this._indices, tag.index)
    if (pos < this._indices.length && this._indices[pos] === tag.index) {
      this._counts[pos] -= amount
      if (this._counts[pos] <= 0) {
        this._indices.splice(pos, 1)
        this._counts.splice(pos, 1)
      }
    }
  }

  get count(): number {
    return this._indices.length
  }

  get isEmpty(): boolean {
    return this._indices.length === 0
  }

  *tags(): IterableIterator<{ tag: GameplayTag; count: number }> {
    const reg = GameplayTagRegistry.instance()
    for (let i = 0; i < this._indices.length; i++) {
      yield { tag: reg.getCachedTag(this._indices[i]), count: this._counts[i] }
    }
  }

  static fromContainers(
    ...containers: GameplayTagContainer[]
  ): GameplayTagContainerCount {
    const result = new GameplayTagContainerCount()
    if (containers.length === 0) return result

    const arrays = containers.map((c) => c._getIndices())
    const ptrs = new Array(arrays.length).fill(0)
    const indices = result._indices
    const counts = result._counts

    for (;;) {
      let minVal = Number.MAX_SAFE_INTEGER
      let occurrenceCount = 0

      for (let i = 0; i < arrays.length; i++) {
        const arr = arrays[i]
        const ptr = ptrs[i]
        if (ptr < arr.length) {
          const val = arr[ptr]
          if (val < minVal) {
            minVal = val
            occurrenceCount = 1
          } else if (val === minVal) {
            occurrenceCount++
          }
        }
      }

      if (minVal === Number.MAX_SAFE_INTEGER) break

      indices.push(minVal)
      counts.push(occurrenceCount)

      for (let i = 0; i < arrays.length; i++) {
        if (ptrs[i] < arrays[i].length && arrays[i][ptrs[i]] === minVal) {
          ptrs[i]++
        }
      }
    }

    return result
  }
}

function lowerBound(arr: number[], value: number): number {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < value) lo = mid + 1
    else hi = mid
  }
  return lo
}
