import { describe, it, expect } from "vitest";
import { sourceFor, mappedLine } from "./lessons";
describe("教学代码与模型的一致性", () => {
  it("正确版本先保存后继再修改连接", () => {
    const c = sourceFor("reverse", "javascript", [1, 2, 3], "correct");
    expect(c.indexOf("const next = current.next")).toBeLessThan(
      c.indexOf("current.next = prev"),
    );
  });
  it("错误版本真实交换顺序", () => {
    const c = sourceFor("reverse", "javascript", [1, 2, 3], "broken");
    expect(c.indexOf("current.next = prev")).toBeLessThan(
      c.indexOf("const next = current.next"),
    );
  });
  it("Java 示例包含可运行入口与输入", () => {
    const c = sourceFor("reverse", "java", [5, 8], "correct");
    expect(c).toContain("public static void main");
    expect(c).toContain("int[] values = {5, 8}");
  });
  it("二分示例排序输入并保留目标", () => {
    const c = sourceFor("binary", "javascript", [9, 1, 4], "correct", 4);
    expect(c).toContain("search([1, 4, 9], 4)");
  });
  it("语言映射指向同一操作", () => {
    const c = sourceFor("reverse", "java", [1, 2], "correct").split("\n");
    expect(c[mappedLine("reverse", "java", 4) - 1]).toContain(
      "Node next = current.next",
    );
  });
});
