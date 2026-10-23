package dev.trace;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
class Api {

  final Store db;
  final ObjectMapper json;
  final Runner runner;
  final Coach coach;

  Api(Store db, ObjectMapper json, Runner runner, Coach coach) {
    this.db = db;
    this.json = json;
    this.runner = runner;
    this.coach = coach;
  }

  @GetMapping("/health")
  Object health() {
    return Map.of(
      "status",
      "UP",
      "application",
      "trace-coach",
      "aiEnabled",
      !coach.key.isBlank(),
      "runnerEnabled",
      runner.enabled
    );
  }

  @GetMapping("/catalog")
  Object catalog() {
    return db
      .experiments()
      .stream()
      .filter(e -> Boolean.TRUE.equals(e.get("enabled")))
      .toList();
  }

  record Trace(
    @NotBlank String kind,
    @NotNull @Size(min = 1, max = 7) List<Integer> values,
    @NotBlank String variant,
    int target
  ) {}

  @PostMapping("/model/trace")
  Object trace(@Valid @RequestBody Trace t) {
    boolean published = db
      .experiments()
      .stream()
      .anyMatch(
        e ->
          e.get("id").equals(t.kind()) && Boolean.TRUE.equals(e.get("enabled"))
      );
    if (!published) throw Errors.missing();
    return new TraceEngine().run(t.kind(), t.values(), t.variant(), t.target());
  }

  @GetMapping("/records")
  Object records(Authentication a) {
    return db.records(Accounts.uid(db, a));
  }

  @GetMapping("/records/{id}")
  Object record(@PathVariable String id, Authentication a) {
    var row = db.record(Accounts.uid(db, a), id);
    if (row == null) throw Errors.missing();
    return row;
  }

  record Save(
    @NotBlank @Pattern(regexp = "[a-z-]{1,40}") String topic,
    @NotBlank @Size(max = 150) String title,
    @NotBlank @Pattern(regexp = "ERROR|NOTE") String kind,
    @NotNull JsonNode snapshot
  ) {}

  @PostMapping("/records")
  Object save(@Valid @RequestBody Save body, Authentication a)
    throws Exception {
    String data = json.writeValueAsString(body.snapshot());
    if (data.length() > 64000) throw new IllegalArgumentException(
      "记录过大，请只保存关键步骤"
    );
    String id = UUID.randomUUID().toString();
    db.addRecord(
      id,
      Accounts.uid(db, a),
      body.topic(),
      body.title(),
      body.kind(),
      data
    );
    return Map.of("id", id);
  }

  record Edit(
    @NotBlank @Pattern(regexp = "OPEN|LEARNING|UNDERSTOOD") String state,
    @NotNull @Size(max = 10000) String note,
    @Min(0) int version
  ) {}

  @PatchMapping("/records/{id}")
  Object edit(
    @PathVariable String id,
    @Valid @RequestBody Edit e,
    Authentication a
  ) {
    long uid = Accounts.uid(db, a);
    if (db.record(uid, id) == null) throw Errors.missing();
    if (
      db.updateRecord(id, uid, e.state(), e.note(), e.version()) != 1
    ) throw Errors.conflict();
    return db.record(uid, id);
  }

  record Execute(
    @NotBlank String language,
    @NotBlank @Size(max = 30000) String source,
    @NotNull @Size(max = 4000) String stdin,
    @NotBlank @Pattern(regexp = "[a-z-]{1,40}") String topic
  ) {}

  @PostMapping("/executions")
  Object run(@Valid @RequestBody Execute e, Authentication a) throws Exception {
    var result = runner.run(e.language(), e.source(), e.stdin());
    String id = UUID.randomUUID().toString();
    long uid = Accounts.uid(db, a);
    db.submission(
      id,
      uid,
      e.topic(),
      e.language(),
      e.source(),
      json.writeValueAsString(result)
    );
    if (result.exitCode() != 0) db.addRecord(
      UUID.randomUUID().toString(),
      uid,
      e.topic(),
      result.timedOut() ? "代码运行超时" : "代码运行失败",
      "ERROR",
      json.writeValueAsString(
        Map.of(
          "kind",
          e.topic(),
          "language",
          e.language(),
          "source",
          e.source(),
          "stderr",
          result.stderr(),
          "explanation",
          result.timedOut()
            ? "程序在 12 秒内未完成，已终止独立容器。先检查循环条件、递归终止条件和输入规模；超时本身不能确定具体原因。"
            : "执行环境返回非零退出码。下面保留原始错误信息，先定位最早的编译或运行错误。",
          "model",
          "区分编译错误、运行异常与输出不符合预期。每次只修改一个原因，再运行验证。",
          "counter",
          "缩小输入，构造最小复现。保存修改前后的结果，再比较变化。"
        )
      )
    );
    return Map.of("id", id, "result", result);
  }

  @GetMapping("/submissions")
  Object submissions(Authentication a) {
    return db.submissions(Accounts.uid(db, a));
  }

  @GetMapping("/admin/overview")
  Object admin() {
    return Map.of(
      "users",
      db.users(),
      "stats",
      db.stats(),
      "experiments",
      db.experiments()
    );
  }

  record Publish(boolean enabled, @Min(0) int version) {}

  @PatchMapping("/admin/experiments/{id}")
  Object publish(@PathVariable String id, @Valid @RequestBody Publish p) {
    if (db.publish(id, p.enabled(), p.version()) != 1) throw Errors.conflict();
    return Map.of("message", "发布状态已更新");
  }
}
