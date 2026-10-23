import { describe, it, expect } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import TextExplanation from "./components/TextExplanation.vue";
describe("Untrusted teaching text", () => {
  it("escapes HTML, scripts and event handlers instead of rendering them", async () => {
    const html = await renderToString(
      createSSRApp(TextExplanation, {
        text: '<img src=x onerror="alert(1)">\n\n**<script>alert(1)</script>**',
      }),
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
    expect(html).toContain("<strong>");
  });
  it("keeps code intact and escaped, including Markdown-looking characters", async () => {
    const html = await renderToString(
      createSSRApp(TextExplanation, {
        text: '```js\nconst x = "<b>**text**</b>";\n```',
      }),
    );
    expect(html).toContain("**text**");
    expect(html).not.toContain("<b>");
    expect(html).toContain("<pre>");
  });
  it("renders state comparison tables and readable headings without raw markers", async () => {
    const html = await renderToString(
      createSSRApp(TextExplanation, {
        text: "## 当前状态\n\n| 变量 | 值 |\n| --- | --- |\n| `a` | **1** |",
      }),
    );
    expect(html).toContain("<table>");
    expect(html).toContain("<code>a</code>");
    expect(html).toContain("<strong>1</strong>");
    expect(html).not.toContain("##");
  });
});
