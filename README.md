# gameplay-tags-ts

A pure TypeScript implementation of Unreal Engine's [GameplayTags](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-gameplay-tags-in-unreal-engine) system — hierarchical tags with fast runtime queries. Zero dependencies.

Inspired by [BandoWare/GameplayTags](https://github.com/BandoWare/GameplayTags) for Unity.

## Features

- **Hierarchical tags** — dot-separated names (`Damage.Fire`) with automatic parent creation
- **Fast queries** — integer indices, sorted arrays, and contiguous descendant ranges. No string comparisons at query time
- **Tag containers** — collections with `hasTag`, `hasAny`, `hasAll` (exact and hierarchical modes)
- **Set operations** — `intersection`, `union`, `difference` on containers
- **Code generation** — CLI tool that produces typed TypeScript constants from a JSON definition file

## Installation

```bash
npm install gameplay-tags-ts
```

## Quick Start

### 1. Define your tags

Create a `gameplay-tags.json` file:

```json
{
  "tags": [
    "Ability.Skill.Fire",
    "Ability.Skill.Ice",
    "Ability.Passive.Regeneration",
    "Status.Burning",
    "Status.Frozen",
    "Damage.Physical",
    "Damage.Magical"
  ]
}
```

### 2. Generate typed constants

```bash
npx gameplay-tags-codegen -i gameplay-tags.json -o src/generated/Tags.ts
```

This produces a file with a nested `Tags` object:

```typescript
export const Tags = {
  Ability: {
    tag: r.registerTag("Ability"),
    Skill: {
      tag: r.registerTag("Ability.Skill"),
      Fire: { tag: r.registerTag("Ability.Skill.Fire") },
      Ice: { tag: r.registerTag("Ability.Skill.Ice") },
    },
    // ...
  },
  // ...
} as const;
```

### 3. Use in your code

```typescript
import { GameplayTagContainer } from "gameplay-tags-ts";
import { Tags } from "./generated/Tags";

// Create a container and add tags
const entity = new GameplayTagContainer();
entity.addTag(Tags.Ability.Skill.Fire.tag);
entity.addTag(Tags.Status.Burning.tag);

// Exact match — only true if the specific tag is present
entity.hasTag(Tags.Ability.Skill.Fire.tag, true); // true
entity.hasTag(Tags.Ability.tag, true);             // false

// Hierarchical match — true if the tag or any descendant is present
entity.hasTag(Tags.Ability.tag);                   // true (has Ability.Skill.Fire)
entity.hasTag(Tags.Damage.tag);                    // false

// Query against another container
const query = GameplayTagContainer.fromTags(
  Tags.Ability.tag,
  Tags.Status.tag,
);
entity.hasAll(query);  // true — has descendants of both
entity.hasAny(query);  // true

// Set operations
const a = GameplayTagContainer.fromTags(Tags.Ability.Skill.Fire.tag, Tags.Status.Burning.tag);
const b = GameplayTagContainer.fromTags(Tags.Status.Burning.tag, Tags.Damage.Physical.tag);

const common = GameplayTagContainer.intersection(a, b); // [Status.Burning]
const all    = GameplayTagContainer.union(a, b);         // [Ability.Skill.Fire, Damage.Physical, Status.Burning]
const diff   = GameplayTagContainer.difference(a, b);    // [Ability.Skill.Fire]
```

### Manual registration (without codegen)

```typescript
import { GameplayTagRegistry, GameplayTagContainer } from "gameplay-tags-ts";

const reg = GameplayTagRegistry.instance();
const fireTag = reg.registerTag("Damage.Fire");   // also registers "Damage"
const iceTag  = reg.registerTag("Damage.Ice");

const container = GameplayTagContainer.fromTags(fireTag);
container.hasTag(reg.getTag("Damage")); // true
```

## API

### `GameplayTag`

| Member | Description |
|---|---|
| `index` | Internal integer index |
| `isValid` | `true` if this is not `GameplayTag.NONE` |
| `name` | Dot-separated tag name |
| `parent` | Parent tag or `GameplayTag.NONE` |
| `depth` | Hierarchy depth (root = 1) |
| `matchesTag(other, exact?)` | Does this tag satisfy the query `other`? |
| `equals(other)` | Index equality |

### `GameplayTagContainer`

| Member | Description |
|---|---|
| `addTag(tag)` | Add a tag (deduplicates) |
| `removeTag(tag)` | Remove a tag |
| `clear()` | Remove all tags |
| `hasTag(tag, exact?)` | Contains tag (or descendant, if not exact) |
| `hasAny(other, exact?)` | At least one overlap |
| `hasAll(other, exact?)` | Contains all from `other` |
| `count` / `isEmpty` | Size queries |
| `tags()` | Iterate contained tags |
| `fromTags(...tags)` | Static factory |
| `intersection(a, b)` | Tags in both |
| `union(a, b)` | Tags in either |
| `difference(a, b)` | Tags in `a` but not `b` |

### `GameplayTagRegistry`

| Member | Description |
|---|---|
| `instance()` | Singleton accessor |
| `registerTag(name)` | Register tag + parents, returns `GameplayTag` |
| `getTag(name)` | Lookup (throws if missing) |
| `findTag(name)` | Lookup (returns `NONE` if missing) |
| `isRegistered(name)` | Check existence |
| `tagCount` | Total registered tags |
| `reset()` | Clear all (for testing) |

## Performance

Tags are stored in a sorted array where all descendants of a tag form a contiguous range. This enables:

- **`isAncestorOf`** — two integer comparisons
- **`hasTag` (hierarchical)** — one binary search, O(log n)
- **`hasAny` / `hasAll` (exact)** — merge-join on sorted arrays, O(n + m)
- **Set operations** — merge on sorted arrays, O(n + m)

No string comparisons happen during queries — only integer arithmetic.

## License

MIT
