import { describe, it, expect } from "vitest";
import {
  outputAt,
  frameLabel,
  isExecutionEnd,
  type RuntimeFrame,
} from "./runtime";
const frame = (extra: Partial<RuntimeFrame> = {}): RuntimeFrame => ({
  index: 0,
  line: 3,
  method: "Main.main",
  thread: "main",
  event: "step",
  message: "",
  stack: [],
  heap: [],
  statics: [],
  stackTruncated: false,
  ...extra,
});
describe("真实输出的历史回放", () => {
  it("JS 显示实际暂停列，不将整行误标为尚未执行", () => {
    expect(frameLabel(frame({ semantics: "at-location", column: 25 }))).toBe(
      "第 3 行 · 第 25 列暂停",
    );
  });
  it("执行前无输出，每步只累加已经产生的输出，回退不会泄露后续输出", () => {
    const frames = [
      frame({ stdoutDelta: "", stderrDelta: "" }),
      frame({ stdoutDelta: "你好，Java\n" }),
      frame({ stdoutDelta: "24\n", stderrDelta: "警告\n" }),
      frame({ event: "program-exit", stdoutDelta: "结束\n" }),
    ];
    expect(outputAt(frames, 0)).toEqual({ stdout: "", stderr: "" });
    expect(outputAt(frames, 1)).toEqual({ stdout: "你好，Java\n", stderr: "" });
    expect(outputAt(frames, 3)).toEqual({
      stdout: "你好，Java\n24\n结束\n",
      stderr: "警告\n",
    });
    expect(outputAt(frames, 1)?.stdout).toBe("你好，Java\n");
  });
  it("旧轨迹与新轨迹的空输出不同", () => {
    expect(outputAt([frame()], 0)).toBeUndefined();
    expect(outputAt([frame({ stdoutDelta: "" })], 0)?.stdout).toBe("");
  });
  it("结束和异常终止不显示为第0行执行前", () => {
    const end = frame({
      event: "program-exit",
      line: 0,
      message: "程序执行结束",
    });
    expect(isExecutionEnd(end)).toBe(true);
    expect(frameLabel(end)).toBe("程序执行结束");
    expect(
      frameLabel(
        frame({
          event: "execution-stopped",
          message: "达到追踪上限，执行已终止",
        }),
      ),
    ).toContain("上限");
    expect(frameLabel(frame())).toBe("第 3 行 · 执行前");
  });
});
