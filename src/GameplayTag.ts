import { GameplayTagRegistry } from "./GameplayTagRegistry.js";

export class GameplayTag {
  static readonly NONE = new GameplayTag(-1);

  private _index: number;

  constructor(index: number) {
    this._index = index;
  }

  get index(): number {
    return this._index;
  }

  /** @internal — used by registry when indices shift during registration */
  _updateIndex(newIndex: number): void {
    this._index = newIndex;
  }

  get isValid(): boolean {
    return this._index >= 0;
  }

  get name(): string {
    if (!this.isValid) return "";
    return GameplayTagRegistry.instance().getTagName(this._index);
  }

  get parent(): GameplayTag {
    if (!this.isValid) return GameplayTag.NONE;
    const parentIdx = GameplayTagRegistry.instance().getParentIndex(this._index);
    if (parentIdx < 0) return GameplayTag.NONE;
    return GameplayTagRegistry.instance().getCachedTag(parentIdx);
  }

  get depth(): number {
    if (!this.isValid) return 0;
    return GameplayTagRegistry.instance().getDepth(this._index);
  }

  /**
   * Does this tag satisfy the query `other`?
   *
   * - exact=true: only if this tag IS `other`
   * - exact=false: if `other` is this tag or an ancestor of this tag
   *
   * Example: `"Damage.Fire".matchesTag("Damage")` → true (non-exact)
   */
  matchesTag(other: GameplayTag, exact = false): boolean {
    if (!this.isValid || !other.isValid) return false;
    if (this._index === other._index) return true;
    if (exact) return false;
    return GameplayTagRegistry.instance().isAncestorOf(other._index, this._index);
  }

  equals(other: GameplayTag): boolean {
    return this._index === other._index;
  }

  toString(): string {
    return this.name;
  }
}
