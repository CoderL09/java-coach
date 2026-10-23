package dev.trace;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/exercises")
class ExerciseController {

  private final Runner runner;
  private final Store db;
  private final ObjectMapper json;
  private final JsonNode catalog;

  ExerciseController(Runner runner, Store db, ObjectMapper json)
    throws Exception {
    this.runner = runner;
    this.db = db;
    this.json = json;
    try (var in = new ClassPathResource("exercises.json").getInputStream()) {
      catalog = json.readTree(in);
    }
  }

  JsonNode find(String id) {
    for (var e : catalog) if (e.path("id").asText().equals(id)) return e;
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "练习不存在");
  }

  @GetMapping
  Object list() {
    var out = json.createArrayNode();
    for (var e : catalog) {
      var copy = e.deepCopy();
      ((com.fasterxml.jackson.databind.node.ObjectNode) copy).remove(
        List.of("solution", "cases", "javaHelper", "jsHelper")
      );
      ((com.fasterxml.jackson.databind.node.ObjectNode) copy).put(
        "testCount",
        e.path("cases").size()
      );
      ((com.fasterxml.jackson.databind.node.ObjectNode) copy).set(
        "example",
        e.path("cases").get(0).deepCopy()
      );
      (
        (com.fasterxml.jackson.databind.node.ObjectNode) copy.path("example")
      ).remove(List.of("java", "js"));
      out.add(copy);
    }
    return out;
  }

  @GetMapping("/{id}/solution")
  Object solution(@PathVariable String id) {
    return find(id).path("solution");
  }

  record Attempt(
    @NotBlank @Pattern(regexp = "java|javascript") String language,
    @NotBlank @Size(max = 20000) String source,
    boolean hintUsed,
    boolean solutionViewed
  ) {}

  @PostMapping("/{id}/attempts")
  Object attempt(
    @PathVariable String id,
    @Valid @RequestBody Attempt a,
    Authentication auth
  ) throws Exception {
    var spec = find(id);
    boolean supported = false;
    for (var lang : spec.path("languages"))
      if (lang.asText().equals(a.language())) supported = true;
    if (!supported) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "此练习不支持所选语言"
    );
    String token =
      "RESULT_" + UUID.randomUUID().toString().replace("-", "") + ":";
    var execution = runner.run(
      a.language(),
      wrap(spec, a.language(), a.source(), token),
      ""
    );
    var lines = execution
      .stdout()
      .lines()
      .filter(l -> l.startsWith(token))
      .toList();
    var rows = new ArrayList<Map<String, Object>>();
    int i = 0;
    for (var test : spec.path("cases")) {
      JsonNode actual = null;
      try {
        if (i < lines.size()) actual = json.readTree(
          lines.get(i).substring(token.length())
        );
      } catch (Exception ignored) {}
      boolean passed =
        execution.exitCode() == 0 &&
        !execution.timedOut() &&
        actual != null &&
        actual.equals(test.path("expected"));
      var row = new LinkedHashMap<String, Object>();
      row.put("input", test.path("input"));
      row.put("expected", test.path("expected"));
      row.put("actual", actual);
      row.put("passed", passed);
      row.put(
        "reason",
        passed ? "返回值符合约定" : "先检查输入、返回值和运行诊断"
      );
      rows.add(row);
      i++;
    }
    boolean passed = rows
      .stream()
      .allMatch(r -> Boolean.TRUE.equals(r.get("passed")));
    var result = new LinkedHashMap<String, Object>();
    result.put("tests", rows);
    result.put("passed", passed);
    result.put("execution", execution);
    result.put(
      "evidence",
      a.solutionViewed()
        ? "查看答案后验证"
        : a.hintUsed()
          ? "提示后验证"
          : "未使用本站提示或答案的本次验证"
    );
    long uid = Accounts.uid(db, auth);
    db.submission(
      UUID.randomUUID().toString(),
      uid,
      id,
      a.language(),
      a.source(),
      json.writeValueAsString(result)
    );
    if (!passed) {
      var snapshot = new LinkedHashMap<String, Object>();
      snapshot.put("kind", "exercise");
      snapshot.put("exerciseId", id);
      snapshot.put("language", a.language());
      snapshot.put("source", a.source());
      snapshot.put("tests", rows);
      snapshot.put("stderr", execution.stderr());
      snapshot.put(
        "explanation",
        "返回行为未通过本组测试。先定位最早失败输入，再对照约定；这不能直接证明认知原因。"
      );
      snapshot.put("model", spec.path("description").asText());
      snapshot.put("counter", spec.path("hints").get(0).asText());
      db.addRecord(
        UUID.randomUUID().toString(),
        uid,
        id,
        spec.path("title").asText() + " · 练习未通过",
        "ERROR",
        json.writeValueAsString(snapshot)
      );
    }
    return result;
  }

  static String wrap(
    JsonNode spec,
    String language,
    String source,
    String token
  ) {
    var checks = new StringBuilder();
    for (var test : spec.path("cases")) {
      String call = test.path(language.equals("java") ? "java" : "js").asText();
      checks.append(
        language.equals("java")
          ? "try{System.out.println(\"" +
              token +
              "\"+encode(" +
              call +
              "));}catch(Throwable e){System.out.println(\"" +
              token +
              "null\");}\n"
          : "try{console.log('" +
              token +
              "'+JSON.stringify(" +
              call +
              "));}catch(e){console.log('" +
              token +
              "null');}\n"
      );
    }
    if (language.equals("javascript")) return (
      "'use strict';\n" +
      source +
      "\n" +
      spec.path("jsHelper").asText("") +
      "\n" +
      checks
    );
    return (
      "import java.util.StringJoiner;\npublic class Main {\n" +
      source +
      "\n" +
      spec.path("javaHelper").asText("") +
      "\n" +
      ENCODE +
      "\npublic static void main(String[] args){\n" +
      checks +
      "\n}}"
    );
  }

  static final String ENCODE = """
  static String encode(Object v){
    if(v==null)return "null";
    if(v instanceof String s){StringBuilder b=new StringBuilder("\\\"");for(char c:s.toCharArray()){switch(c){case '\\"':b.append("\\\\\\\"");break;case '\\\\':b.append("\\\\\\\\");break;case '\\n':b.append("\\\\n");break;case '\\r':b.append("\\\\r");break;case '\\t':b.append("\\\\t");break;default:if(c<32)b.append(String.format("\\\\u%04x",(int)c));else b.append(c);}}return b.append('\\"').toString();}
    if(v.getClass().isArray()){StringJoiner j=new StringJoiner(",","[","]");for(int i=0;i<java.lang.reflect.Array.getLength(v);i++)j.add(encode(java.lang.reflect.Array.get(v,i)));return j.toString();}
    return String.valueOf(v);
  }
  """;
}
