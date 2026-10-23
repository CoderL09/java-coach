package dev.trace;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice")
class Practice {

  final Runner runner;
  final Store db;
  final ObjectMapper json;

  Practice(Runner runner, Store db, ObjectMapper json) {
    this.runner = runner;
    this.db = db;
    this.json = json;
  }

  record Attempt(
    @NotBlank @Pattern(regexp = "java|javascript") String language,
    @NotBlank @Size(max = 20000) String source
  ) {}

  @PostMapping("/reverse")
  Object judge(@Valid @RequestBody Attempt a, Authentication auth)
    throws Exception {
    String token =
      "TRACE_" + UUID.randomUUID().toString().replace("-", "") + ":";
    String source = wrap(a.language(), a.source(), token);
    var execution = runner.run(a.language(), source, "");
    List<List<Integer>> cases = List.of(
      List.of(1, 2, 3, 4),
      List.of(),
      List.of(7),
      List.of(5, 5, -1)
    );
    var rows = new ArrayList<Map<String, Object>>();
    var lines = execution
      .stdout()
      .lines()
      .filter(l -> l.startsWith(token))
      .toList();
    for (int i = 0; i < cases.size(); i++) {
      var expected = new ArrayList<>(cases.get(i));
      Collections.reverse(expected);
      JsonNode actual = null;
      String reason = "未得到结果，请检查编译错误或循环";
      if (i < lines.size()) {
        try {
          actual = json.readTree(lines.get(i).substring(token.length()));
          reason = "输出与期望不同";
        } catch (Exception ignored) {}
      }
      boolean passed =
        execution.exitCode() == 0 &&
        actual != null &&
        actual.equals(json.valueToTree(expected));
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("input", cases.get(i));
      row.put("expected", expected);
      row.put("actual", actual);
      row.put("passed", passed);
      row.put("reason", passed ? "结果一致" : reason);
      rows.add(row);
    }
    boolean passed = rows
      .stream()
      .allMatch(r -> Boolean.TRUE.equals(r.get("passed")));
    String id = UUID.randomUUID().toString();
    Map<String, Object> result = Map.of(
      "tests",
      rows,
      "passed",
      passed,
      "execution",
      execution
    );
    db.submission(
      id,
      Accounts.uid(db, auth),
      "reverse",
      a.language(),
      a.source(),
      json.writeValueAsString(result)
    );
    if (!passed) {
      db.addRecord(
        UUID.randomUUID().toString(),
        Accounts.uid(db, auth),
        "reverse",
        "反转链表 · 练习未通过",
        "ERROR",
        json.writeValueAsString(
          Map.of(
            "kind",
            "reverse",
            "language",
            a.language(),
            "source",
            a.source(),
            "tests",
            rows,
            "stderr",
            execution.stderr(),
            "explanation",
            "样例未通过。先检查最早失败输入，再观察保存后继与修改 next 的顺序。这里记录的是运行事实，尚不能确定你的认知原因。",
            "model",
            "先保存原后继，再修改 current.next，最后移动 prev 与 current。",
            "counter",
            "用空链表、单节点和重复值分别检验。检查是否错误依赖节点值，而不是引用身份。"
          )
        )
      );
    }
    return result;
  }

  static String wrap(String language, String source, String token) {
    if (language.equals("javascript")) return (
      source +
      "\nconst inputs = [[1,2,3,4],[],[7],[5,5,-1]]; for(const values of inputs){let head=null;for(let i=values.length-1;i>=0;i--)head={value:values[i],next:head};try{let n=reverse(head),out=[],seen=new Set();while(n!==null){if(!n||seen.has(n)||out.length>64)throw Error('返回值无效或存在环');seen.add(n);out.push(n.value);n=n.next;}console.log('" +
      token +
      "'+JSON.stringify(out));}catch(e){console.log('" +
      token +
      "'+JSON.stringify({error:String(e)}));}}"
    );
    return (
      "public class Main { static class Node { int value; Node next; Node(int v){value=v;} }\n" +
      source +
      "\npublic static void main(String[] args){int[][] inputs={{1,2,3,4},{},{7},{5,5,-1}};for(int[] values:inputs){Node head=null;for(int i=values.length-1;i>=0;i--){Node n=new Node(values[i]);n.next=head;head=n;}try{Node n=reverse(head);java.util.List<Integer> out=new java.util.ArrayList<>();java.util.Set<Node> seen=java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());while(n!=null){if(!seen.add(n)||out.size()>64)throw new RuntimeException(\"返回链表存在环\");out.add(n.value);n=n.next;}System.out.println(\"" +
      token +
      "\"+out);}catch(Throwable e){System.out.println(\"" +
      token +
      "null\");}}}}"
    );
  }
}
