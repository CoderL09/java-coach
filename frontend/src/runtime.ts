export interface RuntimeValue {
  ref: string;
}
export interface RuntimeLocal {
  name: string;
  type: string;
  value: unknown;
}
export interface RuntimeStack {
  column?: number;
  method: string;
  line: number;
  depth: number;
  locals: RuntimeLocal[];
  localsUnavailable?: boolean;
}
export interface RuntimeObject {
  id: string;
  type: string;
  fields: Record<string, unknown>;
  limited: boolean;
  length?: number;
  unavailable?: boolean;
  fieldTypes?: Record<string, string>;
}
export interface RuntimeFrame {
  column?: number;
  semantics?: string;
  stdoutDelta?: string;
  stderrDelta?: string;
  index: number;
  line: number;
  method: string;
  thread: string;
  event: string;
  message: string;
  stack: RuntimeStack[];
  heap: RuntimeObject[];
  statics: RuntimeLocal[];
  stackTruncated: boolean;
  classes?: {
    name: string;
    superclass?: string;
    abstract?: boolean;
    fields: { name: string; type: string; static: boolean }[];
    methods: {
      name: string;
      returnType: string;
      static: boolean;
      abstract?: boolean;
      parameters: string[];
    }[];
    limited: boolean;
  }[];
}
export interface RuntimeResult {
  frames: RuntimeFrame[];
  meta: {
    stdout?: string;
    stderr?: string;
    limited?: boolean;
    exception?: string;
    targetExitCode?: number;
    outputTruncated?: boolean;
  };
  timedOut: boolean;
  truncated: boolean;
  diagnostics: string;
  elapsedMs: number;
  scope: string;
  processExitCode: number;
}
export function isExecutionEnd(frame?: RuntimeFrame) {
  return (
    frame?.event === "program-exit" || frame?.event === "execution-stopped"
  );
}
export function frameLabel(frame?: RuntimeFrame) {
  if (frame?.semantics === "at-location")
    return "第 " + frame.line + " 行 · 第 " + (frame.column || 1) + " 列暂停";
  return !frame
    ? "尚未运行"
    : isExecutionEnd(frame)
      ? frame.message || "执行已结束"
      : "第 " +
        frame.line +
        " 行 · " +
        (frame.event.includes("exception") ? "异常现场" : "执行前");
}
export function outputAt(frames: RuntimeFrame[], index: number) {
  if (!frames.some((f) => typeof f.stdoutDelta === "string")) return undefined;
  const visible = frames.slice(0, Math.max(0, index + 1));
  return {
    stdout: visible.map((f) => f.stdoutDelta || "").join(""),
    stderr: visible.map((f) => f.stderrDelta || "").join(""),
  };
}
export function displayValue(value: unknown, type = ""): string {
  if (value === null) return "null";
  if (typeof value === "object" && value && "ref" in value)
    return "→ " + (value as RuntimeValue).ref;
  return type === "java.lang.String" || type === "string"
    ? JSON.stringify(value)
    : String(value);
}
export const runtimeExamples = {
  recursion: `public class Main {\n  static int factorial(int n) {\n    if (n <= 1) return 1;\n    int rest = factorial(n - 1);\n    int result = n * rest;\n    return result;\n  }\n  public static void main(String[] args) {\n    int input = 4;\n    int answer = factorial(input);\n    System.out.println(answer);\n  }\n}`,
  references: `public class Main {\n  static class Box {\n    int value;\n    Box next;\n    Box(int value) { this.value = value; }\n  }\n  public static void main(String[] args) {\n    Box a = new Box(10);\n    Box b = a;\n    Box c = new Box(20);\n    a.next = c;\n    b.value = 99;\n    int result = a.value;\n    System.out.println(result);\n  }\n}`,
  arrays: `public class Main {\n  public static void main(String[] args) {\n    int[] values = {3, 1, 4};\n    int total = 0;\n    for (int i = 0; i < values.length; i++) {\n      total += values[i];\n    }\n    System.out.println(total);\n  }\n}`,
  exception: `public class Main {\n  public static void main(String[] args) {\n    int numerator = 10;\n    int denominator = 0;\n    int result = numerator / denominator;\n    System.out.println(result);\n  }\n}`,
};
