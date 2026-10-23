export type Block = {
  kind: "paragraph" | "heading" | "quote" | "code" | "list" | "table";
  text?: string;
  level?: number;
  items?: string[];
  rows?: string[][];
};
export function explanationBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n"),
    out: Block[] = [];
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]))
        code.push(lines[i++]);
      if (i < lines.length) i++;
      out.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      out.push({ kind: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    if (
      i + 1 < lines.length &&
      line.includes("|") &&
      /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])
    ) {
      const rows = [cells(line)];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim())
        rows.push(cells(lines[i++]));
      out.push({ kind: "table", rows });
      continue;
    }
    if (/^\s*[-*]\s+|^\s*\d+[.)、]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+|^\s*\d+[.)、]\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*(?:[-*]|\d+[.)、])\s+/, ""));
      out.push({ kind: "list", items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      out.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
      i++;
      continue;
    }
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      i++;
      continue;
    }
    const paragraph = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(?:#{1,6}\s|\s*```|>\s?|\s*[-*]\s|\s*\d+[.)、]\s)/.test(lines[i]) &&
      !(
        i + 1 < lines.length &&
        lines[i].includes("|") &&
        /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])
      )
    )
      paragraph.push(lines[i++]);
    out.push({ kind: "paragraph", text: paragraph.join("\n") });
  }
  return out;
}
