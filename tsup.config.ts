import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "codegen/index": "src/codegen/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
  },
  {
    entry: {
      "bin/gameplay-tags-codegen": "bin/gameplay-tags-codegen.ts",
    },
    format: ["esm"],
    banner: { js: "#!/usr/bin/env node" },
  },
]);
