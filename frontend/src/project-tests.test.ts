import { it, expect } from "vitest";
import vm from "node:vm";
import { projects } from "./projects";
import { projectDocument } from "./projectDocument";
import { articles } from "./textbook";
it("every JavaScript and Vue example parses before it is offered to learners", () => {
  for (const a of articles.filter((a) => a.language === "javascript"))
    expect(() => new vm.Script(a.code), a.id).not.toThrow();
});
it("each independent project passes its actual core cases without mutating inputs", () => {
  for (const p of projects) {
    for (const t of p.tests) {
      const sandbox = { args: structuredClone(t.args), result: undefined };
      vm.runInNewContext(p.core + "\nresult=transform(...args);", sandbox, {
        timeout: 200,
      });
      expect(JSON.parse(JSON.stringify(sandbox.result)), p.id).toEqual(
        t.expected,
      );
      expect(sandbox.args, p.id + " preserves input").toEqual(t.args);
    }
  }
});
it("all project sources and user edits are isolated from network and host document", () => {
  for (const p of projects) {
    const doc = projectDocument(
      p,
      'function transform(){return "</script><script>bad</script>"}',
    );
    expect(doc).toContain("connect-src 'none'");
    expect(doc.match(/<\/script\s*>/gi)).toHaveLength(2);
    expect(p.stages.length).toBeGreaterThanOrEqual(3);
    for (const id of p.prerequisites)
      expect(
        articles.some((a) => a.id === id) ||
          ["arrays", "functions", "loops", "hash", "recursion"].includes(id),
      ).toBe(true);
  }
});
it("new textbook chapters contain a complete example and causal explanations", () => {
  const ids = new Set(articles.map((a) => a.id));
  expect(ids.size).toBe(articles.length);
  for (const a of articles) {
    expect(a.code.length).toBeGreaterThan(50);
    expect(a.reasoning.length).toBeGreaterThan(1);
    expect(a.change.length).toBeGreaterThan(30);
    for (const id of a.prerequisite) expect(ids.has(id)).toBe(true);
  }
});
