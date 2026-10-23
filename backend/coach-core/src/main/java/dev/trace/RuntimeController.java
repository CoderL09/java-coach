package dev.trace;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/runtime")
class RuntimeController {

  final Runner runner;
  final Store db;
  final ObjectMapper json;

  RuntimeController(Runner runner, Store db, ObjectMapper json) {
    this.runner = runner;
    this.db = db;
    this.json = json;
  }

  record Code(@NotBlank @Size(max = 30000) String source) {}

  @PostMapping("/{language:java|javascript}")
  Object run(
    @PathVariable String language,
    @Valid @RequestBody Code code,
    Authentication auth
  ) throws Exception {
    var execution = language.equals("java")
      ? runner.traceJava(code.source())
      : runner.traceJavaScript(code.source());
    var frames = new ArrayList<JsonNode>();
    JsonNode meta = json.createObjectNode();
    for (String line : execution.stdout().lines().toList()) {
      if (!line.startsWith("{")) continue;
      try {
        var event = json.readTree(line);
        if (event.path("type").asText().equals("frame")) frames.add(event);
        else if (event.path("type").asText().equals("meta")) meta = event;
      } catch (Exception ignored) {}
    }
    if (
      !frames.isEmpty() &&
      !Set.of("program-exit", "execution-stopped").contains(
        frames.getLast().path("event").asText()
      )
    ) {
      var end = json.createObjectNode();
      end.put("index", frames.size());
      end.put("line", 0);
      end.put("method", "");
      end.put("thread", "main");
      end.put("event", "execution-stopped");
      end.put(
        "message",
        execution.timedOut()
          ? "追踪超时，执行已终止（输出可能未完整采集）"
          : "追踪中断，输出可能未完整采集"
      );
      end.put("semantics", "runner-stop");
      end.put("stackTruncated", false);
      end.put("stdoutDelta", "");
      end.put("stderrDelta", "");
      for (String key : List.of("stack", "heap", "statics", "classes"))
        end.putArray(key);
      frames.add(end);
    }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("frames", frames);
    result.put("meta", meta);
    result.put(
      "timedOut",
      execution.timedOut() || meta.path("driverTimedOut").asBoolean()
    );
    result.put("truncated", execution.truncated());
    result.put("processExitCode", execution.exitCode());
    result.put("diagnostics", execution.stderr());
    result.put("elapsedMs", execution.elapsedMs());
    result.put(
      "semantics",
      language.equals("java") ? "before-line" : "at-location"
    );
    result.put(
      "scope",
      language.equals("java")
        ? "主线程；用户 Main.java；可见局部变量和静态字段；可达对象深度 3、最多 32 个，每个数组前 16 项、对象前 12 个字段；最多 160 个暂停点。标准输入关闭。未包含完整堆、原生内存或全部线程。"
        : "Node 主线程 main.js；最多 160 个暂停点、12 个用户调用帧、每帧 24 个绑定；对象 32 个、深度 3、自有可枚举属性前 12 项；不执行访问器。调试器可能将未初始化的词法绑定显示为 undefined。未采集任务队列、完整原型链或浏览器 DOM。"
    );
    String id = UUID.randomUUID().toString();
    long uid = Accounts.uid(db, auth);
    db.addTrace(
      id,
      uid,
      language,
      code.source(),
      json.writeValueAsString(result)
    );
    if (
      execution.timedOut() ||
      meta.path("driverTimedOut").asBoolean() ||
      frames.isEmpty() ||
      !meta.path("exception").asText().isEmpty() ||
      (!meta.path("limited").asBoolean() &&
        meta.path("targetExitCode").asInt(-1) != 0)
    ) {
      db.addRecord(
        UUID.randomUUID().toString(),
        uid,
        language + "-runtime",
        language + " 追踪 · 错误现场",
        "ERROR",
        json.writeValueAsString(
          Map.of(
            "kind",
            language + "-runtime",
            "runtimeId",
            id,
            "source",
            code.source(),
            "language",
            language,
            "stderr",
            execution.stderr() + meta.path("stderr").asText(),
            "explanation",
            "这份记录保留真实编译、运行和暂停点信息。先定位最早出现的异常或诊断，再检查相关变量。",
            "model",
            "普通行暂停点展示执行前状态；异常事件记录抛出现场。某个赋值通常在之后的暂停点才能看到结果。",
            "counter",
            "缩小输入，修改一个条件，再生成新追踪；通过历史记录比较结果。"
          )
        )
      );
    }
    return Map.of(
      "id",
      id,
      "language",
      language,
      "source",
      code.source(),
      "result",
      result
    );
  }

  @GetMapping
  Object history(Authentication auth) {
    return db.traces(Accounts.uid(db, auth));
  }

  @GetMapping("/{id}")
  Object get(@PathVariable String id, Authentication auth) throws Exception {
    var row = db.trace(Accounts.uid(db, auth), id);
    if (row == null) throw Errors.missing();
    return Map.of(
      "id",
      id,
      "source",
      row.get("source"),
      "language",
      row.get("language"),
      "result",
      json.readTree((String) row.get("trace"))
    );
  }
}
