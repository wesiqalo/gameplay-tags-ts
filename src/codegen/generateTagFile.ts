interface TagNode {
  fullName: string;
  children: Map<string, TagNode>;
}

export function generateTagFile(tags: string[], importPath: string): string {
  const root = buildTree(tags);
  const lines: string[] = [];

  lines.push("// === GENERATED FILE — DO NOT EDIT ===");
  lines.push(`import { GameplayTagRegistry } from "${importPath}";`);
  lines.push("");
  lines.push("const r = GameplayTagRegistry.instance();");
  lines.push("");
  lines.push("export const Tags = {");
  emitChildren(root.children, lines, "  ");
  lines.push("} as const;");
  lines.push("");

  return lines.join("\n");
}

function buildTree(tags: string[]): TagNode {
  const root: TagNode = { fullName: "", children: new Map() };
  for (const tag of tags) {
    const segments = tag.split(".");
    let current = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      let child = current.children.get(seg);
      if (!child) {
        child = {
          fullName: segments.slice(0, i + 1).join("."),
          children: new Map(),
        };
        current.children.set(seg, child);
      }
      current = child;
    }
  }
  return root;
}

function emitChildren(
  children: Map<string, TagNode>,
  lines: string[],
  indent: string,
): void {
  const sorted = [...children.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (let i = 0; i < sorted.length; i++) {
    const [name, node] = sorted[i];
    const comma = i < sorted.length - 1 ? "," : ",";
    if (node.children.size === 0) {
      lines.push(
        `${indent}${name}: { tag: r.registerTag("${node.fullName}") }${comma}`,
      );
    } else {
      lines.push(`${indent}${name}: {`);
      lines.push(
        `${indent}  tag: r.registerTag("${node.fullName}"),`,
      );
      emitChildren(node.children, lines, indent + "  ");
      lines.push(`${indent}}${comma}`);
    }
  }
}
