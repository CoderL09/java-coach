package dev.trace;

import java.util.*;

/** Executes bounded teaching models. These snapshots are not a trace of arbitrary source code. */
public final class TraceEngine {

  public record NodeView(String id, int value, String next) {}

  public record Frame(
    int index,
    int line,
    String title,
    String explanation,
    String change,
    Map<String, Object> locals,
    List<NodeView> nodes,
    List<Integer> active,
    boolean error
  ) {}

  public record Result(
    String kind,
    String variant,
    List<Frame> frames,
    List<Integer> output,
    boolean correct,
    String provenance
  ) {}

  static class Node {

    final String id;
    int value;
    Node next;

    Node(int i, int v) {
      id = "o" + i;
      value = v;
    }
  }

  final List<Frame> frames = new ArrayList<>();

  void frame(
    int line,
    String title,
    String why,
    String change,
    Map<String, Object> locals,
    List<Node> nodes,
    List<Integer> active,
    boolean error
  ) {
    frames.add(
      new Frame(
        frames.size(),
        line,
        title,
        why,
        change,
        new LinkedHashMap<>(locals),
        nodes
          .stream()
          .map(n ->
            new NodeView(n.id, n.value, n.next == null ? null : n.next.id)
          )
          .toList(),
        List.copyOf(active),
        error
      )
    );
  }

  static String ref(Node n) {
    return n == null ? "null" : n.id;
  }

  public Result run(
    String kind,
    List<Integer> values,
    String variant,
    int target
  ) {
    if (
      values == null ||
      values.isEmpty() ||
      values.size() > 7 ||
      values.stream().anyMatch(v -> v == null || Math.abs((long) v) > 999)
    ) throw new IllegalArgumentException("输入 1—7 个 -999 至 999 的整数");
    if (
      !Set.of("reverse", "binary", "reference").contains(kind) ||
      !Set.of("correct", "broken").contains(variant)
    ) throw new IllegalArgumentException("未知实验或变体");
    return switch (kind) {
      case "reverse" -> reverse(values, variant);
      case "binary" -> binary(values, variant, target);
      default -> reference(values, variant);
    };
  }

  Result reverse(List<Integer> values, String variant) {
    List<Node> nodes = new ArrayList<>();
    for (int i = 0; i < values.size(); i++) nodes.add(
      new Node(i, values.get(i))
    );
    for (int i = 0; i < nodes.size() - 1; i++) nodes.get(i).next = nodes.get(
      i + 1
    );
    Node prev = null,
      current = nodes.get(0),
      next = null;
    Map<String, Object> locals = new LinkedHashMap<>();
    locals.put("prev", "null");
    locals.put("current", ref(current));
    locals.put("next", "未声明");
    frame(
      2,
      "让两个指针各就各位",
      "prev 保存已反转部分的头节点。current 指向接下来要处理的节点。",
      "prev = null；current = head",
      locals,
      nodes,
      List.of(),
      false
    );
    while (current != null) {
      frame(
        3,
        "还有节点需要处理",
        "current 不为空，进入本轮循环。每轮只反转一条连接。",
        "current != null",
        locals,
        nodes,
        List.of(nodes.indexOf(current)),
        false
      );
      if (variant.equals("correct")) {
        next = current.next;
        locals.put("next", ref(next));
        frame(
          4,
          "先保存原来的后继",
          "下一行会覆盖 current.next。现在保存后继，才能在改线后继续遍历原链表。",
          "next = current.next",
          locals,
          nodes,
          List.of(nodes.indexOf(current)),
          false
        );
        current.next = prev;
        frame(
          5,
          "把这一条连接转向前方",
          "后继已经保存在 next 中。现在让当前节点指向已反转部分，不会丢失遍历入口。",
          "current.next = prev",
          locals,
          nodes,
          List.of(nodes.indexOf(current)),
          false
        );
      } else {
        current.next = prev;
        frame(
          4,
          "原来的连接被提前覆盖",
          "还没有保存原后继，就修改了 current.next。原链表后半段的遍历入口丢失了。",
          "current.next = prev",
          locals,
          nodes,
          List.of(nodes.indexOf(current)),
          true
        );
        next = current.next;
        locals.put("next", ref(next));
        frame(
          5,
          "读到的是修改后的连接",
          "此时读取 current.next 得到 prev，而不是原后继。第一轮得到 null，循环会提前结束。",
          "next = current.next",
          locals,
          nodes,
          List.of(nodes.indexOf(current)),
          true
        );
      }
      prev = current;
      locals.put("prev", ref(prev));
      frame(
        6,
        "扩展已反转部分",
        "当前节点已经接入反转后的链表，让 prev 指向新的头节点。",
        "prev = current",
        locals,
        nodes,
        List.of(nodes.indexOf(current)),
        false
      );
      current = next;
      locals.put("current", ref(current));
      frame(
        7,
        "移动到下一轮",
        "通过保存的 next 继续遍历。若它为空，下一次条件检查结束循环。",
        "current = next",
        locals,
        nodes,
        current == null ? List.of() : List.of(nodes.indexOf(current)),
        false
      );
    }
    List<Integer> output = new ArrayList<>();
    for (Node n = prev; n != null; n = n.next) output.add(n.value);
    var expected = new ArrayList<>(values);
    Collections.reverse(expected);
    boolean correct = output.equals(expected);
    frame(
      9,
      correct ? "反转完成，返回新的头节点" : "遍历提前结束，节点没有全部返回",
      correct
        ? "prev 指向完整反转链表的头。每个原节点都被处理一次，时间 O(n)，额外指针空间 O(1)。"
        : "结果只有部分节点。后半段仍可在教学对象图中看到，但已不在返回链表的可达路径上；这不表示真实 JVM 已经回收它们。",
      "return prev",
      locals,
      nodes,
      List.of(),
      !correct
    );
    return new Result(
      "reverse",
      variant,
      List.copyOf(frames),
      output,
      correct,
      "Java 执行教学模型，记录逻辑对象快照；非 JVM 任意源码跟踪或物理内存地址"
    );
  }

  Result binary(List<Integer> input, String variant, int target) {
    var values = input.stream().sorted().toList();
    var nodes = new ArrayList<Node>();
    for (int i = 0; i < values.size(); i++) nodes.add(
      new Node(i, values.get(i))
    );
    int left = 0,
      right = values.size() - 1,
      found = -1;
    Map<String, Object> locals = new LinkedHashMap<>();
    locals.put("left", left);
    locals.put("right", right);
    locals.put("target", target);
    frame(
      2,
      "建立闭区间",
      "数组按升序排列。若目标存在，它必须位于 [left, right] 内。",
      "left = 0；right = length - 1",
      locals,
      nodes,
      List.of(),
      false
    );
    while (left <= right) {
      int mid = left + (right - left) / 2;
      locals.put("mid", mid);
      frame(
        4,
        "选择当前区间的中点",
        "中点把候选区间分为两部分。比较后才能排除不可能的一半。",
        "mid = left + floor((right - left) / 2)",
        locals,
        nodes,
        List.of(mid),
        false
      );
      if (values.get(mid) == target) {
        found = mid;
        frame(
          5,
          "找到目标",
          "中点元素等于目标，可以直接返回下标。",
          "return mid",
          locals,
          nodes,
          List.of(mid),
          false
        );
        break;
      }
      if (values.get(mid) < target) {
        left = mid + 1;
        locals.put("left", left);
        frame(
          6,
          "排除左半区间",
          "中点及左侧元素都小于目标。下次只检查 mid + 1 到 right。",
          "left = mid + 1",
          locals,
          nodes,
          List.of(mid),
          false
        );
      } else {
        right = mid - 1;
        locals.put("right", right);
        frame(
          7,
          "排除右半区间",
          "中点及右侧元素都大于目标。下次只检查 left 到 mid - 1。",
          "right = mid - 1",
          locals,
          nodes,
          List.of(mid),
          false
        );
      }
    }
    if (found < 0) frame(
      9,
      "区间为空，目标不存在",
      "left 已大于 right，没有剩余候选位置。返回 -1。",
      "return -1",
      locals,
      nodes,
      List.of(),
      false
    );
    return new Result(
      "binary",
      variant,
      List.copyOf(frames),
      List.of(found),
      true,
      "Java 执行二分查找教学模型；数组使用排序后的输入"
    );
  }

  Result reference(List<Integer> values, String variant) {
    Node a = new Node(0, values.get(0));
    var nodes = new ArrayList<Node>();
    nodes.add(a);
    Map<String, Object> locals = new LinkedHashMap<>();
    locals.put("a", a.id);
    frame(
      2,
      "创建对象并保存引用",
      "a 保存对象的引用。画面中的 o0 是稳定对象编号，不是物理内存地址。",
      "a → o0",
      locals,
      nodes,
      List.of(0),
      false
    );
    Node b = variant.equals("correct") ? a : new Node(1, a.value);
    if (b != a) nodes.add(b);
    locals.put("b", b.id);
    frame(
      3,
      b == a ? "复制引用，不会复制对象" : "创建另一个独立对象",
      b == a
        ? "b = a 让两个变量指向同一个对象。"
        : "这里使用独立对象，后续字段修改不会影响 a。",
      "b → " + b.id,
      locals,
      nodes,
      List.of(nodes.indexOf(b)),
      false
    );
    int changed = values.size() > 1 ? values.get(1) : 99;
    b.value = changed;
    frame(
      4,
      "通过 b 修改对象字段",
      a == b
        ? "a 和 b 指向同一对象，因此通过 a 读取也会得到新值。"
        : "a 与 b 指向不同对象，因此 a 的字段保持原值。",
      "b.value = " + changed,
      locals,
      nodes,
      List.of(nodes.indexOf(b)),
      false
    );
    return new Result(
      "reference",
      variant,
      List.copyOf(frames),
      List.of(a == b ? changed : a.value),
      true,
      "对象引用教学模型；对象图不代表物理布局"
    );
  }
}
