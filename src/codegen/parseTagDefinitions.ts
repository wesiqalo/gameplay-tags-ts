const TAG_NAME_RE = /^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*$/;

export function parseTagDefinitions(content: string): string[] {
  const data = JSON.parse(content);
  if (!data || !Array.isArray(data.tags)) {
    throw new Error(
      'Invalid tag definitions: expected an object with a "tags" array',
    );
  }
  const tags: string[] = data.tags;
  for (const tag of tags) {
    if (typeof tag !== "string" || !TAG_NAME_RE.test(tag)) {
      throw new Error(`Invalid tag name: "${tag}"`);
    }
  }
  return tags;
}
