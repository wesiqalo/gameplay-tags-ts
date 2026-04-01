import { describe, it, expect } from "vitest";
import { parseTagDefinitions } from "../src/codegen/parseTagDefinitions.js";
import { generateTagFile } from "../src/codegen/generateTagFile.js";

describe("parseTagDefinitions", () => {
  it("parses a valid JSON definition", () => {
    const content = JSON.stringify({
      tags: ["Ability.Skill.Fire", "Status.Burning"],
    });
    const result = parseTagDefinitions(content);
    expect(result).toEqual(["Ability.Skill.Fire", "Status.Burning"]);
  });

  it("throws on missing tags array", () => {
    expect(() => parseTagDefinitions("{}")).toThrow("tags");
  });

  it("throws on invalid tag names", () => {
    const content = JSON.stringify({ tags: ["123Invalid"] });
    expect(() => parseTagDefinitions(content)).toThrow("Invalid tag name");
  });

  it("throws on tag with empty segment", () => {
    const content = JSON.stringify({ tags: ["A..B"] });
    expect(() => parseTagDefinitions(content)).toThrow("Invalid tag name");
  });

  it("accepts single-segment tags", () => {
    const content = JSON.stringify({ tags: ["Root"] });
    expect(parseTagDefinitions(content)).toEqual(["Root"]);
  });

  it("accepts underscores and digits in segments", () => {
    const content = JSON.stringify({ tags: ["_tag1.Sub_2"] });
    expect(parseTagDefinitions(content)).toEqual(["_tag1.Sub_2"]);
  });
});

describe("generateTagFile", () => {
  it("generates correct TypeScript for a tag hierarchy", () => {
    const tags = ["Ability.Skill.Fire", "Ability.Skill.Ice", "Status.Burning"];
    const output = generateTagFile(tags, "gameplay-tags-ts");

    expect(output).toContain("// === GENERATED FILE");
    expect(output).toContain(
      'import { GameplayTagRegistry } from "gameplay-tags-ts"',
    );
    expect(output).toContain("const r = GameplayTagRegistry.instance()");
    expect(output).toContain("export const Tags = {");
    expect(output).toContain('r.registerTag("Ability")');
    expect(output).toContain('r.registerTag("Ability.Skill")');
    expect(output).toContain('r.registerTag("Ability.Skill.Fire")');
    expect(output).toContain('r.registerTag("Ability.Skill.Ice")');
    expect(output).toContain('r.registerTag("Status")');
    expect(output).toContain('r.registerTag("Status.Burning")');
    expect(output).toContain("} as const;");
  });

  it("uses the specified import path", () => {
    const output = generateTagFile(["A"], "../lib");
    expect(output).toContain('from "../lib"');
  });

  it("sorts children alphabetically", () => {
    const tags = ["Z.B", "Z.A", "A"];
    const output = generateTagFile(tags, "lib");
    const aPos = output.indexOf('r.registerTag("A")');
    const zPos = output.indexOf('r.registerTag("Z")');
    const zaPos = output.indexOf('r.registerTag("Z.A")');
    const zbPos = output.indexOf('r.registerTag("Z.B")');
    expect(aPos).toBeLessThan(zPos);
    expect(zaPos).toBeLessThan(zbPos);
  });

  it("handles leaf-only tags (no nesting)", () => {
    const output = generateTagFile(["Foo"], "lib");
    expect(output).toContain('Foo: { tag: r.registerTag("Foo") }');
  });
});
