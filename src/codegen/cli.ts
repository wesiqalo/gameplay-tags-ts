import { readFileSync, writeFileSync } from "node:fs";
import { parseTagDefinitions } from "./parseTagDefinitions.js";
import { generateTagFile } from "./generateTagFile.js";

export function main(argv: string[] = process.argv.slice(2)): void {
  let input: string | undefined;
  let output: string | undefined;
  let importPath = "gameplay-tags-ts";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      input = argv[++i];
    } else if (arg === "--output" || arg === "-o") {
      output = argv[++i];
    } else if (arg === "--import-path") {
      importPath = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      return;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exitCode = 1;
      return;
    }
  }

  if (!input || !output) {
    console.error("Error: --input and --output are required");
    printHelp();
    process.exitCode = 1;
    return;
  }

  const content = readFileSync(input, "utf-8");
  const tags = parseTagDefinitions(content);
  const result = generateTagFile(tags, importPath);
  writeFileSync(output, result, "utf-8");
  console.log(`Generated ${output} with ${tags.length} tag(s)`);
}

function printHelp(): void {
  console.log(`
Usage: gameplay-tags-codegen [options]

Options:
  -i, --input <file>       Path to JSON tag definitions file (required)
  -o, --output <file>      Output TypeScript file path (required)
  --import-path <path>     Import specifier for the library (default: "gameplay-tags-ts")
  -h, --help               Show this help
`);
}
