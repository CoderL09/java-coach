export interface NodeView {
  id: string;
  value: number;
  next: string | null;
}
export interface Frame {
  index: number;
  line: number;
  title: string;
  explanation: string;
  change: string;
  locals: Record<string, unknown>;
  nodes: NodeView[];
  active: number[];
  error: boolean;
}
export interface Trace {
  kind: string;
  variant: string;
  frames: Frame[];
  output: number[];
  correct: boolean;
  provenance: string;
}
export const lessons = [
  {
    id: "reverse",
    title: "反转链表",
    subtitle: "让连接转向，理解引用如何工作",
    topic: "链表与指针",
    level: "基础",
    minutes: 12,
    color: "cyan",
    description:
      "用三个指针，重新连接一条链表。亲手观察每一次引用变化，理解为什么顺序不能交换。",
  },
  {
    id: "reference",
    title: "对象与引用",
    subtitle: "两个变量，一个对象",
    topic: "语言基础",
    level: "入门",
    minutes: 8,
    color: "violet",
    description:
      "赋值复制的是对象，还是引用？对比共享对象与独立对象，用一次修改找到答案。",
  },
  {
    id: "binary",
    title: "二分查找",
    subtitle: "每一次比较，都排除一半可能",
    topic: "搜索算法",
    level: "基础",
    minutes: 15,
    color: "amber",
    description:
      "观察搜索区间如何缩小，理解边界、循环不变量，以及为什么返回 -1。",
  },
];
export function sourceFor(
  kind: string,
  language: string,
  values: number[],
  variant: string,
  target = 7,
): string {
  const broken = variant === "broken",
    js = language === "javascript";
  if (kind === "reverse") {
    const steps = broken
      ? ["current.next = prev;", "const next = current.next;"]
      : ["const next = current.next;", "current.next = prev;"];
    if (js)
      return `function reverse(head) {\n  let prev = null, current = head;\n  while (current !== null) {\n    ${steps[0]}\n    ${steps[1]}\n    prev = current;\n    current = next;\n  }\n  return prev;\n}\n\nconst values = [${values.join(", ")}];\nlet head = null;\nfor (let i = values.length - 1; i >= 0; i--) {\n  head = { value: values[i], next: head };\n}\nconst result = [];\nfor (let n = reverse(head); n; n = n.next) result.push(n.value);\nconsole.log(JSON.stringify(result));`;
    return `public class Main {\n  static class Node { int value; Node next; Node(int v) { value = v; } }\n  static Node reverse(Node head) {\n    Node prev = null, current = head;\n    while (current != null) {\n      ${steps[0].replace("const next", "Node next")}\n      ${steps[1].replace("const next", "Node next")}\n      prev = current;\n      current = next;\n    }\n    return prev;\n  }\n  public static void main(String[] args) {\n    int[] values = {${values.join(", ")}};\n    Node head = null;\n    for (int i = values.length - 1; i >= 0; i--) {\n      Node n = new Node(values[i]); n.next = head; head = n;\n    }\n    java.util.List<Integer> result = new java.util.ArrayList<>();\n    for (Node n = reverse(head); n != null; n = n.next) result.add(n.value);\n    System.out.println(result);\n  }\n}`;
  }
  if (kind === "binary") {
    const sorted = [...values].sort((a, b) => a - b);
    if (js)
      return `function search(values, target) {\n  let left = 0, right = values.length - 1;\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (values[mid] === target) return mid;\n    if (values[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\nconsole.log(search([${sorted.join(", ")}], ${target}));`;
    return `public class Main {\n  // 输入数组必须按升序排列\n  static int search(int[] values, int target) {\n    int left = 0, right = values.length - 1;\n    while (left <= right) {\n      int mid = left + (right - left) / 2;\n      if (values[mid] == target) return mid;\n      if (values[mid] < target) left = mid + 1;\n      else right = mid - 1;\n    }\n    return -1;\n  }\n  public static void main(String[] args) {\n    System.out.println(search(new int[]{${sorted.join(", ")}}, ${target}));\n  }\n}`;
  }
  const initial = values[0] ?? 1,
    changed = values[1] ?? 99;
  if (js)
    return `function experiment() {\n  const a = { value: ${initial} };\n  const b = ${broken ? "{ value: a.value }" : "a"};\n  b.value = ${changed};\n  console.log(a.value);\n}\nexperiment();`;
  return `public class Main {\n  static class Box { int value; Box(int value) { this.value = value; } }\n  public static void main(String[] args) {\n    Box a = new Box(${initial});\n    Box b = ${broken ? "new Box(a.value)" : "a"};\n    b.value = ${changed};\n    System.out.println(a.value);\n  }\n}`;
}
export function mappedLine(kind: string, language: string, line: number) {
  return language === "javascript"
    ? line
    : line + (kind === "reference" ? 2 : 2);
}
export const teaching = {
  reverse: {
    problem:
      "链表的方向由 next 引用决定。要反转链表，必须逐个改变引用，同时保留继续遍历的入口。",
    terms: "引用是找到对象的方式。它不等于对象本身，也不是这里展示的物理地址。",
    model:
      "prev 指向已经反转的部分；current 指向待处理节点；next 暂存原后继。先保存，再改线，最后移动。",
    counter:
      "交换“保存后继”和“修改连接”的顺序，原后继会丢失。用错误版本观察：为什么三个节点只返回一个？",
    cost: "每个节点处理一次，时间复杂度 O(n)。只使用固定数量的额外引用，辅助空间 O(1)。教学快照占用的空间不计入算法本身。",
  },
  binary: {
    problem:
      "在有序数组中查找一个值。每次比较中点，排除不可能的一半，减少候选位置。",
    terms:
      "闭区间 [left, right] 包含两端位置。不变量是每轮操作后仍然成立的条件：若目标存在，它仍在候选区间内。",
    model:
      "先确认有序，再比较中点。目标更大就移动 left，更小就移动 right；区间为空时返回 -1。",
    counter:
      "把目标改成数组中不存在的值，观察区间何时变空。数组未排序时，排除一半的依据不成立。",
    cost: "每轮候选区间约减半，时间复杂度 O(log n)，辅助空间 O(1)。这里为教学排序输入；排序成本不属于二分本身。",
  },
  reference: {
    problem:
      "多个变量可能共享同一个可变对象。理解引用，才能解释“我只改了 b，为什么 a 也变了”。",
    terms:
      "对象保存字段。变量可以保存指向对象的引用。复制引用后，两个变量可以指向同一个对象。",
    model:
      "先区分变量和对象。b = a 复制引用；创建另一个对象则形成独立身份。通过引用修改的是对象字段。",
    counter:
      "切换到独立对象版本。修改 b 后，a 是否仍然改变？先预测，再逐步验证。",
    cost: "本实验展示逻辑对象身份，不代表真实内存地址，也不演示垃圾回收发生的时刻。",
  },
};
