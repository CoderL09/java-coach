// Trusted inspector client. Runs only inside the same networkless container as user code.
const { spawn } = require("node:child_process");
const child = spawn(
  process.execPath,
  ["--max-old-space-size=40", "--inspect-brk=127.0.0.1:0", "/work/main.js"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let stdout = "",
  stdoutCursor = 0,
  stderrCursor = 0,
  stderr = "",
  count = 0,
  limited = false,
  exception = "",
  driverTimedOut = false,
  outputTruncated = false,
  endpoint = "",
  socket,
  sequence = 0,
  chain = Promise.resolve(),
  scriptId = "",
  finished = false;
const pending = new Map(),
  identities = [],
  sourceFunctions = new Set();
const ignored = new Set([
  "exports",
  "require",
  "module",
  "__filename",
  "__dirname",
]);
const limit = 160;
function takeOutput() {
  const delta = {
    stdoutDelta: stdout.slice(stdoutCursor),
    stderrDelta: stderr.slice(stderrCursor),
  };
  stdoutCursor = stdout.length;
  stderrCursor = stderr.length;
  return delta;
}
function append(current, data) {
  const text = current + data.toString();
  if (text.length > 32768) outputTruncated = true;
  return text.slice(0, 32768);
}
child.stdout.on("data", (d) => {
  stdout = append(stdout, d);
});
const deadline = setTimeout(() => {
  driverTimedOut = true;
  child.kill("SIGKILL");
  socket?.close();
}, 15000);
child.stderr.on("data", (d) => {
  const text = d.toString();
  const match = text.match(/ws:\/\/127\.0\.0\.1:\d+\/[\w-]+/);
  if (match && !endpoint) {
    endpoint = match[0];
    connect().catch(fail);
  }
  if (text.includes("Waiting for the debugger to disconnect")) socket?.close();
  const clean = text
    .split("\n")
    .filter(
      (l) =>
        !l.startsWith("Debugger listening") &&
        !l.startsWith("For help, see:") &&
        !l.startsWith("Debugger attached") &&
        !l.startsWith("Waiting for the debugger"),
    )
    .join("\n");
  if (clean.trim()) stderr = append(stderr, clean + "\n");
});
child.on("error", () => {
  exception = "无法启动受限 Node 调试进程";
});
child.on("close", (code) => {
  finished = true;
  clearTimeout(deadline);
  socket?.close();
  if (count > 0) {
    const normal = code === 0 && !limited && !driverTimedOut && !exception;
    console.log(
      JSON.stringify({
        type: "frame",
        index: count,
        line: 0,
        method: "",
        thread: "main",
        event: normal ? "program-exit" : "execution-stopped",
        message: normal
          ? "程序执行结束"
          : limited
            ? "达到追踪上限，执行已终止"
            : driverTimedOut
              ? "执行超时，已终止"
              : "程序异常结束",
        semantics: "after-exit",
        stack: [],
        heap: [],
        statics: [],
        classes: [],
        stackTruncated: false,
        ...takeOutput(),
      }),
    );
  }
  console.log(
    JSON.stringify({
      type: "meta",
      stdout,
      stderr,
      exception,
      limited,
      driverTimedOut,
      outputTruncated,
      stepLimit: limit,
      targetExitCode: code ?? -1,
    }),
  );
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN)
      return reject(Error("Inspector unavailable"));
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
function fail(error) {
  if (finished) return;
  exception = "调试采集失败：" + String(error.message || error).slice(0, 180);
  child.kill("SIGKILL");
  socket?.close();
}
async function connect() {
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener(
      "error",
      () => reject(Error("Inspector connection failed")),
      { once: true },
    );
  });
  socket.addEventListener("close", () => {
    for (const p of pending.values()) p.reject(Error("Inspector closed"));
    pending.clear();
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const p = pending.get(message.id);
      pending.delete(message.id);
      if (p)
        message.error
          ? p.reject(Error(message.error.message))
          : p.resolve(message.result || {});
      return;
    }
    if (
      message.method === "Debugger.scriptParsed" &&
      message.params.url === "file:///work/main.js"
    )
      scriptId = message.params.scriptId;
    if (message.method === "Debugger.paused")
      chain = chain
        .then(() => paused(message.params))
        .catch((e) => {
          if (!finished && socket.readyState === WebSocket.OPEN) fail(e);
        });
  });
  await send("Runtime.enable");
  await send("Debugger.enable");
  await send("Debugger.setBlackboxPatterns", {
    patterns: ["^(?!file:///work/main\\.js$).*"],
  });
  await send("Debugger.setPauseOnExceptions", { state: "uncaught" });
  await send("Runtime.runIfWaitingForDebugger");
}
async function identity(remote) {
  for (const known of identities) {
    if (known.handle === remote.objectId) return known.id;
    try {
      const result = await send("Runtime.callFunctionOn", {
        objectId: known.handle,
        functionDeclaration: "function(other) { return this === other; }",
        arguments: [{ objectId: remote.objectId }],
        returnByValue: true,
        silent: true,
        throwOnSideEffect: true,
      });
      if (result.result?.value === true) return known.id;
    } catch {
      /* Stale inspector handles are not evidence of equality. */
    }
  }
  if (identities.length >= 128) {
    limited = true;
    throw Error("达到 128 个对象身份上限");
  }
  const id = "j" + (identities.length + 1);
  const retained = await send("Runtime.callFunctionOn", {
    objectId: remote.objectId,
    functionDeclaration: 'function() { "use strict"; return this; }',
    objectGroup: "trace-persistent",
    silent: true,
  });
  identities.push({ id, handle: retained.result?.objectId || remote.objectId });
  return id;
}
async function value(remote, heap, depth = 0) {
  if (!remote) return "<不可读取>";
  if (remote.subtype === "null") return null;
  if (remote.type === "undefined") return "undefined";
  if (remote.type === "function")
    return (
      "ƒ " + (remote.description?.split("\n")[0].slice(0, 100) || "function")
    );
  if (remote.type !== "object")
    return (
      remote.unserializableValue ??
      (typeof remote.value === "string"
        ? remote.value.slice(0, 240)
        : (remote.value ?? remote.description ?? "<未知>"))
    );
  if (!remote.objectId) return "<不可展开对象>";
  const id = await identity(remote),
    reference = { ref: id };
  if (heap.has(id) || heap.size >= 32) return reference;
  const object = {
    id,
    type: remote.className || remote.subtype || "Object",
    fields: {},
    fieldTypes: {},
    limited: depth >= 3,
  };
  heap.set(id, object);
  if (depth >= 3) return reference;
  if (remote.className === "global") {
    object.type = "globalThis（未展开）";
    object.limited = true;
    return reference;
  }
  try {
    const properties =
      (
        await send("Runtime.getProperties", {
          objectId: remote.objectId,
          ownProperties: true,
          generatePreview: false,
        })
      ).result || [];
    const selected = properties
      .filter(
        (p) => p.name !== "__proto__" && p.name !== "length" && p.enumerable,
      )
      .slice(0, 12);
    object.limited = properties.filter((p) => p.enumerable).length > 12;
    const length = properties.find((p) => p.name === "length");
    if (remote.subtype === "array" && length?.value)
      object.length = length.value.value;
    for (const p of selected) {
      object.fieldTypes[p.name] =
        p.value?.type || (p.get ? "accessor" : "unknown");
      object.fields[p.name] = p.value
        ? await value(p.value, heap, depth + 1)
        : "<访问器未执行>";
    }
  } catch {
    object.unavailable = true;
  }
  return reference;
}
async function paused(event) {
  if (finished) return;
  if (event.callFrames[0]?.location.scriptId !== scriptId) {
    await send("Debugger.stepOut");
    return;
  }
  await send("Debugger.setSkipAllPauses", { skip: true });
  const userFrames = event.callFrames.filter(
    (f) => f.location.scriptId === scriptId,
  );
  if (userFrames.length) {
    const heap = new Map(),
      stack = [];
    for (const [i, f] of userFrames.slice(0, 12).entries()) {
      sourceFunctions.add(f.functionName || "顶层脚本");
      const locals = [],
        seen = new Set();
      if (f.functionName && f.this)
        locals.push({
          name: "this",
          type: f.this.className || f.this.type,
          value: await value(f.this, heap),
        });
      for (const scope of f.scopeChain.filter((s) =>
        ["local", "block", "closure", "catch", "script"].includes(s.type),
      )) {
        if (!scope.object.objectId) continue;
        const properties =
          (
            await send("Runtime.getProperties", {
              objectId: scope.object.objectId,
              ownProperties: true,
              generatePreview: false,
            })
          ).result || [];
        for (const p of properties) {
          if (locals.length >= 24) break;
          if (seen.has(p.name) || ignored.has(p.name) || p.name.startsWith("."))
            continue;
          seen.add(p.name);
          locals.push({
            name: p.name,
            type: p.value?.className || p.value?.type || "unknown",
            value: p.value
              ? await value(p.value, heap)
              : "<未初始化或不可读取>",
          });
        }
      }
      stack.push({
        method: f.functionName || "顶层脚本",
        line: f.location.lineNumber + 1,
        column: f.location.columnNumber + 1,
        depth: userFrames.length - i,
        locals,
      });
    }
    const isException = event.reason === "exception";
    if (isException)
      exception = event.data?.description || "JavaScript 未捕获异常";
    console.log(
      JSON.stringify({
        type: "frame",
        index: count++,
        line: userFrames[0].location.lineNumber + 1,
        column: userFrames[0].location.columnNumber + 1,
        method: userFrames[0].functionName || "顶层脚本",
        thread: "Node 主线程",
        event: isException ? "uncaught-exception" : "line",
        message: isException ? exception : "",
        semantics: isException ? "exception-thrown" : "at-location",
        ...takeOutput(),
        stack,
        heap: [...heap.values()],
        statics: [],
        stackTruncated: userFrames.length > 12,
        classes: [
          {
            name: "main.js",
            fields: [],
            methods: [...sourceFunctions].map((name) => ({
              name,
              returnType: "未知",
              static: false,
              parameters: ["…"],
            })),
            limited: false,
          },
        ],
      }),
    );
  }
  if (count >= limit) {
    limited = true;
    child.kill("SIGKILL");
    socket.close();
    return;
  }
  await send("Debugger.setSkipAllPauses", { skip: false });
  await send("Debugger.stepInto", { breakOnAsyncCall: false });
}
