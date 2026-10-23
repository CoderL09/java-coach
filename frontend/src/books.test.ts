import { describe, it, expect } from "vitest";
import { books, readyTopics } from "./books";
import { courses } from "./curriculum";
import { courseForLanguage } from "./courseLanguage";
import { articles } from "./textbook";
it("keeps Java waiting guarantees separate from JavaScript task queues", () => {
  const asyncCourse = courses.find((c) => c.id === "async");
  const java = courseForLanguage(asyncCourse, "java")!,
    js = courseForLanguage(asyncCourse, "javascript")!;
  expect(java.definition).toContain("join");
  expect(java.challenge.question).not.toContain("本课 JS");
  expect(
    java.steps.flatMap((s) => s.state.tasks || []).join(" "),
  ).not.toContain("微任务");
  expect(js.steps.flatMap((s) => s.state.tasks || []).join(" ")).not.toContain(
    "Java",
  );
  expect(
    courseForLanguage(
      courses.find((c) => c.id === "this"),
      "java",
    )!.challenge.question,
  ).toContain("static");
});
describe("Textbook knowledge graph", () => {
  it("has unique stable knowledge ids and resolvable prerequisite references", () => {
    for (const b of Object.values(books)) {
      const topics = b.chapters.flatMap((c) => c.topics),
        ids = new Set(topics.map((t) => t.id));
      expect(ids.size).toBe(topics.length);
      for (const t of topics)
        for (const p of t.prerequisites) {
          expect(ids.has(p), t.id + " prerequisite " + p).toBe(true);
          expect(topics.findIndex((x) => x.id === p)).toBeLessThan(
            topics.indexOf(t),
          );
        }
    }
  });
  it("links each available topic to a real runnable course, without duplicate completion counts", () => {
    for (const lang of ["java", "javascript"] as const) {
      const ready = readyTopics(lang);
      expect(ready.length).toBeGreaterThan(13);
      expect(new Set(ready.map((t) => t.courseId)).size).toBe(ready.length);
      for (const t of ready)
        expect(
          courses.some((c) => c.id === t.courseId) ||
            articles.some((a) => a.id === t.courseId && a.language === lang),
        ).toBe(true);
    }
  });
});
