# CLAUDE.md

## Commands

```bash
npm run build           # Build dual ESM/CJS output (tsup → dist/)
npm run lint            # Type-check (tsc --noEmit)
npm test                # Run all tests (vitest run)
npm run test:watch      # Run tests in watch mode
```

## Architecture

`gameplay-tags-ts` is a TypeScript port of Unreal Engine's GameplayTags — hierarchical, dot-separated tags for categorizing and querying game objects.

**Core classes** (`src/`):

- `GameplayTag` — a single tag handle backed by an integer index. Supports hierarchical matching (`"Damage.Fire".matchesTag("Damage")` → true).
- `GameplayTagRegistry` — singleton that owns all registered tags. Stores them sorted with parallel metadata arrays for O(1) parent/depth/descendant-range lookups.
- `GameplayTagContainer` — sorted collection of tags with set operations (union, intersection, difference) and hierarchical queries (`hasTag`, `hasAny`, `hasAll`).

**Codegen** (`src/codegen/`, `bin/`):

- CLI tool (`gameplay-tags-codegen`) that reads tag definitions and generates typed constants.
- Exported as a separate `./codegen` entry point.

**Dual ESM/CJS package:** Built with `tsup` into `dist/`. Two build configs in `tsup.config.ts` — one for the library (ESM+CJS+DTS), one for the CLI bin (ESM only with shebang).

## Testing

All tests in `tests/` using vitest. One file per core class plus `codegen.test.ts`.

## Code Style

- TypeScript strict mode, target ES2022
- Double quotes, no trailing semicolons in config files
- Private class fields use leading underscore (`_index`)
- `@internal` JSDoc on methods exposed only for cross-class use within the package
- Zero runtime dependencies
