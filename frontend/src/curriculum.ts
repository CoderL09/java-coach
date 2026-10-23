import { sourceFor } from "./lessons.ts";
export type State = {
  vars?: Record<string, string>;
  objects?: { id: string; fields: Record<string, string> }[];
  stack?: string[];
  cells?: string[];
  active?: number[];
  tasks?: string[];
};
export type Step = {
  title: string;
  why: string;
  observe: string;
  javaLine: number;
  jsLine: number;
  state: State;
};
export type Course = {
  id: string;
  title: string;
  group: string;
  problem: string;
  intuition: string;
  definition: string;
  java: string;
  javascript: string;
  difference: string;
  steps: Step[];
  change: string;
  errors: string;
  structure: string;
  bridge: string;
  next: string;
  experiment?: string;
  challenge: {
    question: string;
    options: string[];
    correct: number;
    explain: string;
  };
};
const javaMain = (body: string) =>
  `public class Main {\n  public static void main(String[] args) {\n${body
    .split("\n")
    .map((x) => "    " + x)
    .join("\n")}\n  }\n}`;
const step = (
  title: string,
  why: string,
  observe: string,
  javaLine: number,
  jsLine: number,
  state: State,
): Step => ({ title, why, observe, javaLine, jsLine, state });
export const courses: Course[] = [
  {
    id: "values",
    title: "变量与值：保存一次计算",
    group: "值与存储",
    problem:
      "购物车有 3 件商品，每件 8 元。我们需要计算总价，并在价格变化后重新计算。",
    intuition:
      "先把数量写在一张标有 count 的便签上，再把单价写到 price 便签上。计算时读取便签里的当前数字。便签名称和数字是两件事。",
    definition:
      "变量是程序中有名称的绑定或存储位置。值是它当前关联的数据。赋值将右侧表达式的结果保存到左侧变量。这里先研究整数值。",
    java: javaMain(
      "int count = 3;\nint price = 8;\nint total = count * price;\nprice = 10;\nSystem.out.println(total);",
    ),
    javascript:
      "let count = 3;\nlet price = 8;\nlet total = count * price;\nprice = 10;\nconsole.log(total);",
    difference:
      "Java 的 int 变量只接受相容的整数值。JavaScript 的 let 变量可重新绑定其他类型；普通数字使用 Number。这里数字很小，结果相同。JavaScript 的 const 禁止重新绑定，不能据此认为对象内容不可变。",
    steps: [
      step(
        "保存数量",
        "先计算右侧的 3，再初始化 count。",
        "count 的值是 3；其他变量尚未初始化。",
        3,
        1,
        { vars: { count: "3" } },
      ),
      step(
        "保存单价",
        "后续计算需要读取单价，所以用 price 保存 8。",
        "count 没有变化。",
        4,
        2,
        { vars: { count: "3", price: "8" } },
      ),
      step(
        "计算并保存结果",
        "读取 3 与 8，相乘得到 24，再写入 total。",
        "total 保存本次计算结果，不保存自动重算的公式。",
        5,
        3,
        { vars: { count: "3", price: "8", total: "24" } },
      ),
      step(
        "修改单价",
        "赋值只更新 price。它不会重新执行上一行。",
        "price 是 10，但 total 仍是 24。",
        6,
        4,
        { vars: { count: "3", price: "10", total: "24" } },
      ),
      step(
        "读取输出",
        "输出读取 total 的当前值。",
        "结果是 24，而不是 30。",
        7,
        5,
        { vars: { count: "3", price: "10", total: "24" }, tasks: ["输出 24"] },
      ),
    ],
    change:
      "把 total = count * price 放到 price = 10 后面，结果变为 30。删除 total 的初始化再读取它：Java 局部变量检查会拒绝编译；JS 的 let total; 会得到 undefined。",
    errors:
      "不要把 = 当作数学等号。它执行一次赋值。Java int 运算可能溢出，JS Number 也不能精确表示所有大整数。",
    structure:
      "先准备输入变量 → 计算右侧表达式 → 保存结果 → 后续使用。需要新结果时，明确重新计算。",
    bridge: "一组同类值如何保存？接着学习数组，用下标找到其中一个位置。",
    next: "arrays",
    challenge: {
      question: "只把 price 改成 10，total 会变成多少？",
      options: ["24", "30", "自动持续变化"],
      correct: 0,
      explain: "赋值执行一次。修改 price 不会自动再次执行 total 的初始化。",
    },
  },
  {
    id: "references",
    title: "对象与引用：两个名字，一个对象",
    group: "值与存储",
    problem:
      "两个人都在编辑同一份订单。我们要判断：一次赋值会复制订单内容，还是让两个变量找到同一份订单？",
    intuition:
      "把对象想成一份有字段的订单。变量像保存订单入口的便签。复制入口便签，并不会复印订单。这个比喻只解释关系，不代表真实内存布局。",
    definition:
      "对象是一份具有身份和属性的运行时数据。引用是关联到对象的值。字段是对象内部有名称的数据项。图中的 o0 是对象身份标签，不是内存地址。",
    java: sourceFor("reference", "java", [1, 99], "correct"),
    javascript: sourceFor("reference", "javascript", [1, 99], "correct"),
    difference:
      "Java 的 Box a 保存 Box 引用，类型在编译时约束使用。JS 的 const a 保存对象关联的值，不能重新绑定 a，但可以修改 a.value。两者这里都不会因赋值自动复制对象。Java 的参数传递也是值传递，其中可以复制引用值。",
    steps: [
      step(
        "创建对象并绑定 a",
        "先创建 value 为 1 的对象，再把指向它的引用保存到 a。",
        "左侧 a 是变量；右侧 value 是字段；1 是字段值；o0 是对象编号。",
        4,
        2,
        {
          vars: { a: "→ o0" },
          objects: [{ id: "o0", fields: { value: "1" } }],
        },
      ),
      step(
        "复制引用到 b",
        "右侧 a 求值得到引用值。把这个值赋给 b，不会执行第二次对象创建。",
        "两个箭头指向同一个对象，而不是两个内容相同的对象。",
        5,
        3,
        {
          vars: { a: "→ o0", b: "→ o0" },
          objects: [{ id: "o0", fields: { value: "1" } }],
        },
      ),
      step(
        "通过 b 修改字段",
        "先沿 b 找到对象，再把对象的 value 改成 99。",
        "变化发生在对象内部。a 和 b 的引用都没有改变。",
        6,
        4,
        {
          vars: { a: "→ o0", b: "→ o0" },
          objects: [{ id: "o0", fields: { value: "99" } }],
        },
      ),
      step(
        "通过 a 读取",
        "a 也关联同一个对象，因此读取到修改后的字段。",
        "输出 99。变量值与对象字段值要分别观察。",
        7,
        5,
        {
          vars: { a: "→ o0", b: "→ o0" },
          objects: [{ id: "o0", fields: { value: "99" } }],
          tasks: ["输出 99"],
        },
      ),
    ],
    change:
      "把 b 的初始化改为新建对象：Java 用 new Box(a.value)，JS 用 { value: a.value }。此时 b 指向另一个对象，修改 b.value 不会改变 a.value。",
    errors:
      "对象相等与字段相等不同。Java 引用的 ==、JS 对象的 === 在此比较身份。浅复制只复制第一层，内部对象仍可能共享。null 表示没有对象，不能直接读取其字段。",
    structure:
      "创建对象 → 保存引用 → 复制引用或新建对象 → 沿引用访问字段。始终问：变的是变量绑定，还是对象内容？",
    bridge: "节点就是带有后继引用的对象。理解共享引用后，再把对象连接成链表。",
    next: "linked",
    experiment: "reference",
    challenge: {
      question: "执行 b.value = 99 后，a 保存的是什么？",
      options: ["数字 99", "仍是关联 o0 的引用", "一个新对象"],
      correct: 1,
      explain:
        "改变的是 o0 的字段。a 的引用没有改变，沿它读取 value 才得到 99。",
    },
  },
  {
    id: "arrays",
    title: "数组与下标：找到一组值中的一个",
    group: "值与存储",
    problem:
      "保存三次测量值，并单独修改第二次结果。给每个结果取不同变量名，会让遍历和扩展变得困难。",
    intuition:
      "把一组值画成一排编号格子。第一个格子的编号是 0。要改第二个值，就使用编号 1。格子图表达顺序，不保证两门语言都采用相同物理存储。",
    definition:
      "数组提供按整数下标访问一组元素的能力。下标是元素的位置编号。长度是元素数量，最后一个有效下标通常是长度减一。",
    java: javaMain(
      "int[] values = {3, 5, 8};\nint old = values[1];\nvalues[1] = 9;\nSystem.out.println(old);\nSystem.out.println(values[1]);",
    ),
    javascript:
      "const values = [3, 5, 8];\nconst old = values[1];\nvalues[1] = 9;\nconsole.log(old);\nconsole.log(values[1]);",
    difference:
      "Java 数组长度固定，int[] 的元素类型固定。JS Array 可扩展，可有空槽和不同类型元素。JS 数组不是可直接等同于 Java int[] 的连续整数内存块。",
    steps: [
      step(
        "建立有序元素",
        "创建数组，并让 values 关联它。",
        "格子下标为 0、1、2，长度为 3。",
        3,
        1,
        { vars: { values: "→ 数组" }, cells: ["3", "5", "8"] },
      ),
      step(
        "读取第二个元素",
        "用下标 1 读取值 5，复制到 old。",
        "读取不会移除元素。",
        4,
        2,
        {
          vars: { values: "→ 数组", old: "5" },
          cells: ["3", "5", "8"],
          active: [1],
        },
      ),
      step(
        "更新一个位置",
        "只把下标 1 的元素写成 9。",
        "old 保存之前复制的 5，不会跟着变化。",
        5,
        3,
        {
          vars: { values: "→ 数组", old: "5" },
          cells: ["3", "9", "8"],
          active: [1],
        },
      ),
      step(
        "输出前后的两个值",
        "两次读取来自不同位置：一个是 old，另一个是数组元素。",
        "依次输出 5、9。",
        7,
        5,
        {
          vars: { values: "→ 数组", old: "5" },
          cells: ["3", "9", "8"],
          tasks: ["输出 5", "输出 9"],
        },
      ),
    ],
    change:
      "把下标 1 改为 3。Java 访问越界会抛异常；JS 读取不存在的该项通常得到 undefined，写入则可扩展长度。",
    errors:
      "不要混淆长度与最后下标。数组含对象时，复制一个元素引用不等于深复制对象。大数组插入中间位置通常需要移动后续元素。",
    structure:
      "创建数组 → 检查下标范围 → 读取或更新元素。遍历通常从 i = 0 开始，保持 i < length。",
    bridge:
      "只在一端加入与取出元素，可以实现栈。需要在有序数组里找值，可以学习二分查找。",
    next: "stack",
    challenge: {
      question: "长度为 3 的 Java 数组，最后一个有效下标是多少？",
      options: ["3", "2", "1"],
      correct: 1,
      explain: "从 0 编号，三个位置分别为 0、1、2。",
    },
  },
  {
    id: "loops",
    title: "循环与累计：把一次操作重复起来",
    group: "执行与调用",
    problem: "求 1 到 3 的和。我们希望改变上限后，仍能使用同一段代码。",
    intuition:
      "先准备一个空计分板，每走一步就加上当前分数。还需要知道走到哪里，以及何时停止。",
    definition:
      "循环在条件成立时重复执行一段语句。累计变量保存已经处理部分的结果。循环不变量是在每轮指定位置都成立的性质，用来解释结果为什么正确。",
    java: javaMain(
      "int sum = 0;\nfor (int i = 1; i <= 3; i++) {\n  sum += i;\n}\nSystem.out.println(sum);",
    ),
    javascript:
      "let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum);",
    difference:
      "此处执行顺序相同。Java 的 i 为 int；JS 的 i 为 Number。两者代码块里声明的 i 都不能在循环外直接使用。",
    steps: [
      step(
        "建立累计起点",
        "还没有处理任何数，所以和为 0。",
        "sum = 0 表示空前缀的和。",
        3,
        1,
        { vars: { sum: "0" } },
      ),
      step(
        "第一轮",
        "检查 1 <= 3 成立，再把 1 加到 sum。",
        "处理到 1，sum = 1。",
        5,
        3,
        { vars: { sum: "1", i: "1" }, cells: ["1", "2", "3"], active: [0] },
      ),
      step(
        "第二轮",
        "先执行 i++，再检查 2 <= 3，最后累计。",
        "处理到 2，sum = 3。",
        5,
        3,
        { vars: { sum: "3", i: "2" }, cells: ["1", "2", "3"], active: [1] },
      ),
      step(
        "第三轮",
        "3 仍在包含端点的范围内，因此还要处理一次。",
        "处理到 3，sum = 6。",
        5,
        3,
        { vars: { sum: "6", i: "3" }, cells: ["1", "2", "3"], active: [2] },
      ),
      step(
        "退出循环",
        "i 增为 4 后，条件不成立，不再执行循环体。",
        "循环块结束，i 不在外层作用域；输出 6。",
        7,
        5,
        { vars: { sum: "6" }, tasks: ["条件 4 <= 3 为假", "输出 6"] },
      ),
    ],
    change:
      "把 <= 改为 < 会漏掉 3，结果为 3。删除 i++，条件一直成立，会重复累计并最终超时或发生数值问题。",
    errors:
      "每轮开始时 sum 等于 1 到 i-1 的和。这解释了初始化、累计和停止如何配合。不要只记住 for 的括号形式。",
    structure:
      "初始化已处理部分 → 判断是否还有数据 → 处理当前项 → 推进位置。总共处理 n 项，时间 O(n)，额外只保存固定数量变量，空间 O(1)。",
    bridge:
      "相同的循环结构可以遍历数组。链表遍历改用 current.next 推进，而不是 i++。",
    next: "functions",
    challenge: {
      question: "把 i <= 3 改成 i < 3，输出是什么？",
      options: ["6", "3", "0"],
      correct: 1,
      explain: "只累计 1 和 2。端点是否包含，决定最后一项是否执行。",
    },
  },
  {
    id: "functions",
    title: "函数与调用栈：暂停、进入、返回",
    group: "执行与调用",
    problem: "一段计算要被多个地方复用，同时每次使用不同输入。",
    intuition:
      "把计算封装成一个小工作台。每次调用带入材料，完成后把结果交回调用位置。调用者在等待期间暂停。",
    definition:
      "函数是一段可被调用的代码。参数接收调用时提供的值。调用帧记录一次调用的局部状态。调用栈按后进先出的顺序组织尚未结束的调用。",
    java: "public class Main {\n  static int twice(int n) {\n    int result = n * 2;\n    return result;\n  }\n  public static void main(String[] args) {\n    int answer = twice(3);\n    System.out.println(answer);\n  }\n}",
    javascript:
      "function twice(n) {\n  const result = n * 2;\n  return result;\n}\nconst answer = twice(3);\nconsole.log(answer);",
    difference:
      "Java 这里使用静态方法，可在 main 中直接调用。JS 函数也是值，可赋给变量或传给其他函数。图展示调用关系，不代表引擎一定为每次调用保留可见的物理栈帧。",
    steps: [
      step(
        "发起调用",
        "必须先获得 twice(3) 的返回值，才能初始化 answer。",
        "调用者暂停，answer 尚未得到结果。",
        7,
        5,
        { stack: ["main / 顶层调用者"], tasks: ["等待 twice(3)"] },
      ),
      step(
        "进入函数",
        "把实参 3 的值传给形参 n。",
        "新的调用有自己的 n。",
        2,
        1,
        { stack: ["main / 顶层调用者", "twice(n=3)"], vars: { n: "3" } },
      ),
      step(
        "计算局部结果",
        "读取当前调用的 n，计算 3 * 2。",
        "result 属于这次调用。",
        3,
        2,
        {
          stack: ["main / 顶层调用者", "twice(n=3)"],
          vars: { n: "3", result: "6" },
        },
      ),
      step(
        "返回调用者",
        "return 交回 6，并结束这次调用。",
        "twice 的调用帧退出，answer 获得 6。",
        7,
        5,
        { stack: ["main / 顶层调用者"], vars: { answer: "6" } },
      ),
      step(
        "输出返回值",
        "调用完成后，才继续下一条输出语句。",
        "输出 6。",
        8,
        6,
        {
          stack: ["main / 顶层调用者"],
          vars: { answer: "6" },
          tasks: ["输出 6"],
        },
      ),
    ],
    change:
      "把参数 3 改为 5，输出 10。删除 return：Java 的这个非 void 方法无法正常通过编译；JS 函数结束时返回 undefined。",
    errors:
      "参数名不是调用者变量本身。传入对象时，复制的引用可以让函数修改同一个对象，但给参数重新赋值不会重绑调用者变量。",
    structure:
      "确定输入 → 计算局部结果 → 返回输出。遇到嵌套调用，先完成被调用函数，再回到暂停位置。",
    bridge:
      "函数再次调用自己，就是递归。理解每次调用有独立局部状态后，再学习递归与树。",
    next: "recursion",
    challenge: {
      question: "twice 正在执行时，调用者会怎样？",
      options: [
        "先输出 answer 再等待",
        "等待返回值后继续",
        "与 twice 自动并行执行",
      ],
      correct: 1,
      explain:
        "这是同步调用。调用者要等 twice 返回，才能完成 answer 的初始化。",
    },
  },
  {
    id: "this",
    title: "this 与点号：找到本次操作的对象",
    group: "对象与作用域",
    problem: "两个账户都有余额。相同的取余额逻辑，如何知道这次应读取哪个账户？",
    intuition:
      "同一张操作说明可以应用到不同账户。调用时，需要一个“这一次操作的对象”。点号用于从对象中访问具名成员。",
    definition:
      "Java 的 this 是实例方法或构造器中的当前对象引用。JS 普通函数的 this 由调用方式等规则决定；箭头函数沿用外层 this。属性访问 user.name 先求出 user，再按名称 name 读取属性。",
    java: "public class Main {\n  static class Account {\n    int balance = 10;\n    int read() { return this.balance; }\n  }\n  public static void main(String[] args) {\n    Account user = new Account();\n    System.out.println(user.read());\n  }\n}",
    javascript:
      '"use strict";\nfunction read() {\n  return this.balance;\n}\nconst user = { balance: 10, read };\nconsole.log(user.read());',
    difference:
      "JS 中把方法取出后单独调用，不会保留原对象作为 this。Java 的实例方法调用仍需要实例接收者，不能直接照搬 JS 的脱离调用规则。this 无需理解为对象内部额外保存了一个名为 this 的字段。图只展开 balance：JS 的 read 属性保存函数；Java 的 read 是实例方法，不能画成每个实例都存一份方法字段。",
    steps: [
      step(
        "创建接收对象",
        "对象保存 balance。user 保存关联它的引用。",
        "this 不是对象里额外创建的字段。",
        7,
        5,
        {
          vars: { user: "→ o0" },
          objects: [{ id: "o0", fields: { balance: "10" } }],
        },
      ),
      step(
        "通过对象调用",
        "user.read() 先定位 user，再执行其 read。",
        "本次普通方法调用中，this 关联 user 对应的对象。",
        8,
        6,
        {
          stack: ["main / 顶层", "read()"],
          vars: { user: "→ o0", this: "→ o0" },
          objects: [{ id: "o0", fields: { balance: "10" } }],
        },
      ),
      step(
        "读取 this.balance",
        "先沿 this 找到 o0，再按 balance 名称读取字段或属性。",
        "点号不是计算地址相加。实际查找规则由语言决定。",
        4,
        3,
        {
          stack: ["main / 顶层", "read()"],
          vars: { this: "→ o0" },
          objects: [{ id: "o0", fields: { balance: "10" } }],
          tasks: ["读取 balance → 10"],
        },
      ),
      step(
        "返回并输出",
        "read 交回 10，调用结束。",
        "this 是本次调用的上下文；图中调用帧退出。",
        8,
        6,
        {
          stack: ["main / 顶层"],
          vars: { user: "→ o0" },
          objects: [{ id: "o0", fields: { balance: "10" } }],
          tasks: ["输出 10"],
        },
      ),
    ],
    change:
      "JS 中新增 const f = user.read; f();。在这个严格模式普通函数示例里，this 是 undefined，读取 balance 会抛 TypeError。改为 f.call(user) 可以显式提供 this。不要把 read 改成箭头函数后仍假定规则相同。",
    errors:
      "JS 属性读取还可能沿原型查找，也可能触发 getter。本示例是自有普通数据属性。Java static 方法没有实例 this。对象图表达语言层面的关系，不承诺寄存器或堆栈中的物理位置。",
    structure:
      "先看语言 → 再看函数种类 → 再看调用方式 → 确定 this → 按成员访问规则读取值。",
    bridge:
      "对象间复用成员会引出 JS 原型与 Java 类机制。它们解决部分相似问题，但实现规则不同。",
    next: "scope",
    challenge: {
      question:
        "在本课 JS 严格模式中，const f = user.read; f(); 的 this 是谁？",
      options: ["始终是 user", "undefined", "read 函数自己"],
      correct: 1,
      explain:
        "普通函数脱离 user 单独调用，没有 user 作为接收对象。在本例严格模式下 this 为 undefined。",
    },
  },
  {
    id: "scope",
    title: "作用域与闭包：函数记得哪些变量",
    group: "对象与作用域",
    problem: "我们需要一个计数器。外部能增加计数，但不能直接改内部 count。",
    intuition:
      "创建一个专属工作区，再交出一个能访问它的按钮。工作区的外层函数结束后，只要按钮仍需要 count，相关状态就仍需可用。",
    definition:
      "作用域决定代码可以访问哪些名称。闭包是函数及其可访问的词法环境的组合。词法表示名称关系由代码嵌套结构决定，不由谁调用它决定。",
    java: "public class Main {\n  static java.util.function.IntSupplier counter() {\n    int[] count = {0};\n    return () -> ++count[0];\n  }\n  public static void main(String[] args) {\n    var next = counter();\n    System.out.println(next.getAsInt());\n    System.out.println(next.getAsInt());\n  }\n}",
    javascript:
      "function counter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = counter();\nconsole.log(next());\nconsole.log(next());",
    difference:
      "JS 闭包可以更新这里的 count 绑定。Java lambda 捕获的局部变量必须 final 或事实上不再赋值，因此示例用数组容器并更新其元素。Java 不是直接捕获一个可任意重绑的局部 int。",
    steps: [
      step(
        "创建私有状态",
        "调用 counter，为这次调用建立 count。",
        "再次调用 counter 会建立另一份状态。",
        3,
        2,
        { stack: ["调用者", "counter()"], vars: { count: "0" } },
      ),
      step(
        "返回可调用值",
        "返回函数仍需要访问计数状态。",
        "外层调用结束，不等于被捕获的状态立即消失。",
        7,
        5,
        {
          stack: ["调用者"],
          vars: { next: "→ 返回的函数" },
          objects: [{ id: "词法环境 / Java容器", fields: { count: "0" } }],
        },
      ),
      step(
        "第一次调用",
        "沿闭包关联的状态读取 0，加一并保存。",
        "同一份 count 变成 1，返回 1。",
        8,
        6,
        {
          vars: { next: "→ 返回的函数" },
          objects: [{ id: "词法环境 / Java容器", fields: { count: "1" } }],
          tasks: ["输出 1"],
        },
      ),
      step(
        "再次调用同一个函数",
        "继续使用上一轮留下的状态，而不是重新初始化。",
        "count 变成 2。",
        9,
        7,
        {
          vars: { next: "→ 返回的函数" },
          objects: [{ id: "词法环境 / Java容器", fields: { count: "2" } }],
          tasks: ["输出 2"],
        },
      ),
    ],
    change:
      "每次输出都重新调用 counter()，会创建独立状态，两次都得到 1。Java 中把数组改为 int count，再在 lambda 内 ++count，会违反捕获限制。",
    errors:
      "闭包保留的是需要访问的状态，不代表必须保留整个物理栈。不要用“栈帧没退出”解释闭包。长期持有不需要的对象，也可能延长其可达时间。",
    structure:
      "外层创建状态 → 返回使用状态的函数 → 保存返回函数 → 多次调用共享同一份状态。",
    bridge:
      "Vue 的组合式函数也会利用函数与作用域封装状态。先理解普通闭包，再研究响应式机制。",
    next: "recursion",
    challenge: {
      question: "两次独立执行 counter()，会共享 count 吗？",
      options: ["共享一个全局 count", "每次创建独立状态"],
      correct: 1,
      explain:
        "每次外层调用建立自己的状态。只有同一次调用返回的函数才关联那份状态。",
    },
  },
  {
    id: "stack",
    title: "栈：最后放入，最先取出",
    group: "基础连接数据结构",
    problem:
      "编辑器需要撤销最近一次操作。我们必须先撤销最后发生的操作，再处理更早的操作。",
    intuition:
      "将 A、B、C 依次压在一起，只能从顶部拿。第一次拿到 C，第二次拿到 B。这里顺序比具体存储方式更重要。",
    definition:
      "栈是一种只在一端加入和移除元素的数据结构。push 表示压入，pop 表示移除并返回顶部元素。后进先出描述它的操作顺序。",
    java: javaMain(
      'var stack = new java.util.ArrayDeque<String>();\nstack.push("A");\nstack.push("B");\nSystem.out.println(stack.pop());\nSystem.out.println(stack.peek());',
    ),
    javascript:
      'const stack = [];\nstack.push("A");\nstack.push("B");\nconsole.log(stack.pop());\nconsole.log(stack.at(-1));',
    difference:
      "Java ArrayDeque 的 push/pop 在双端队列的前端操作；本课图按逻辑栈底到栈顶显示。JS 数组 push/pop 在数组尾部操作。物理方向不同，抽象的后进先出相同。",
    steps: [
      step(
        "创建空栈",
        "尚无可撤销的操作，所以栈为空。",
        "空结构没有栈顶元素。",
        3,
        1,
        { cells: [] },
      ),
      step("压入 A", "记录第一个操作。", "A 成为栈顶。", 4, 2, {
        cells: ["A"],
        active: [0],
      }),
      step(
        "压入 B",
        "更新的操作放在原栈顶之上。",
        "逻辑顺序为栈底 A、栈顶 B。",
        5,
        3,
        { cells: ["A", "B"], active: [1] },
      ),
      step("弹出 B", "只移除最新的元素，返回 B。", "A 仍留在结构中。", 6, 4, {
        cells: ["A"],
        active: [0],
        tasks: ["输出 B"],
      }),
      step(
        "查看顶部",
        "peek 或 at(-1) 读取 A，但不移除。",
        "读取与弹出不同。",
        7,
        5,
        { cells: ["A"], active: [0], tasks: ["输出 A"] },
      ),
    ],
    change:
      "在空栈上调用 Java pop 会抛异常；JS 空数组 pop 返回 undefined。若要先进先出，应使用队列，不能只改一下图中的箭头。",
    errors:
      "栈不是“只能存放在内存栈区”。这是数据结构的操作规则。数组或链表都能实现它。调用栈采用相似顺序，但还有调用状态等额外语义。",
    structure:
      "保存操作用 push → 撤销用 pop → 读取当前项用 peek → 先处理空结构。通常单次端点操作为 O(1) 或均摊 O(1)。",
    bridge: "递归依赖调用栈；也可以自己维护一个栈，将部分递归遍历改成循环。",
    next: "recursion",
    challenge: {
      question: "依次 push A、push B、pop，剩下什么？",
      options: ["只剩 A", "只剩 B", "A 和 B 都在"],
      correct: 0,
      explain: "最后放入的 B 最先弹出，A 仍在栈里。",
    },
  },
  {
    id: "recursion",
    title: "递归：把问题交给更小的一次调用",
    group: "基础连接数据结构",
    problem:
      "计算 3!，也就是 3 × 2 × 1。我们希望用同一条规则处理不同的非负整数。",
    intuition:
      "先暂存“乘以 3”这个未完成工作，把 2! 交给另一次调用。再暂存“乘以 2”，直到遇到可以直接回答的 0!。随后逐层交回结果。",
    definition:
      "递归是函数在执行中再次调用自身。终止条件直接给出结果，递推规则把当前问题转成更小的问题。每次调用有独立的参数与局部状态。",
    java: "public class Main {\n  static int fact(int n) {\n    if (n == 0) return 1;\n    return n * fact(n - 1);\n  }\n  public static void main(String[] args) {\n    System.out.println(fact(3));\n  }\n}",
    javascript:
      "function fact(n) {\n  if (n === 0) return 1;\n  return n * fact(n - 1);\n}\nconsole.log(fact(3));",
    difference:
      "两者在本例中的调用顺序相同。Java int 很快溢出；JS Number 对大整数失去精度。输入必须限制为非负整数，小例子不是通用大整数阶乘实现。",
    steps: [
      step(
        "求 fact(3)",
        "3 不是终止输入。先等待 fact(2)，再乘以 3。",
        "n=3 的调用仍存在。",
        4,
        3,
        { stack: ["fact(3)：等待 3 × ?"], vars: { n: "3" } },
      ),
      step(
        "继续缩小",
        "fact(2) 继续需要 fact(1)。",
        "每层都有自己的 n，不是一个全局 n 被覆盖。",
        4,
        3,
        {
          stack: ["fact(3)：等待", "fact(2)：等待", "fact(1)：等待"],
          vars: { n: "1" },
        },
      ),
      step(
        "抵达终止条件",
        "fact(0) 直接返回 1，不再递归。",
        "只有可直接求解的起点，返回链才能开始。",
        3,
        2,
        {
          stack: ["fact(3)", "fact(2)", "fact(1)", "fact(0)：返回 1"],
          vars: { n: "0" },
        },
      ),
      step(
        "逐层返回",
        "fact(1)=1×1，fact(2)=2×1。",
        "已完成的调用依次退出。",
        4,
        3,
        {
          stack: ["fact(3)：等待", "fact(2)：返回 2"],
          vars: { n: "2" },
          tasks: ["fact(1) → 1", "fact(2) → 2"],
        },
      ),
      step(
        "完成外层",
        "fact(3) 获得 2，计算 3×2。",
        "最终输出 6，所有 fact 调用结束。",
        7,
        5,
        { stack: ["main / 顶层"], tasks: ["输出 6"] },
      ),
    ],
    change:
      "删除终止条件，递归不会按预期停止，可能栈溢出或被运行限额终止。传入 -1 也不会到达 n == 0。把 n-1 改为 n，问题没有变小。",
    errors:
      "本课把连续相同规则的调用与返回合并为教学步骤；真实 Java 追踪可以查看逐行事件。递归不是天然更快。对 n 的阶乘需要 O(n) 时间与 O(n) 调用空间。",
    structure:
      "确认输入范围 → 写直接可答的终止条件 → 缩小问题 → 组合子问题答案。",
    bridge:
      "树的每个子树也是一棵树，因此适合递归描述。需要理解遍历时，可以同时画树节点与调用栈。",
    next: "linked",
    challenge: {
      question: "为什么递归输入要从 n 变为 n-1？",
      options: ["只是固定写法", "让问题接近终止条件", "自动节省所有调用空间"],
      correct: 1,
      explain:
        "在非负整数范围内，每次减一会到达 0。缩小问题与终止条件必须配合。",
    },
  },
  {
    id: "linked",
    title: "链表与反转：改变关系，而非交换数字",
    group: "基础连接数据结构",
    problem:
      "把 1 → 2 → 3 的访问方向反过来。保持原节点，只修改它们的 next 连接。",
    intuition:
      "三个房间通过单向门连接。修改第一扇门的方向后，还要记住原来的下一间房，否则无法继续。于是需要一个临时入口。",
    definition:
      "链表由节点组成，每个节点保存数据和后继引用。头引用标出遍历起点。反转链表改变后继关系，并返回新的起点。",
    java: sourceFor("reverse", "java", [1, 2, 3], "correct"),
    javascript: sourceFor("reverse", "javascript", [1, 2, 3], "correct"),
    difference:
      "Java 用 Node 类声明字段类型；JS 用对象属性表示节点。这里两者的 next 都表示节点间关系。不是 C 指针运算，也没有可用来相加的真实地址。",
    steps: [
      step(
        "建立两个部分",
        "prev=null 表示反转部分为空，current 指向原头。",
        "原链依次为 o0 → o1 → o2。",
        4,
        2,
        {
          vars: { prev: "null", current: "→ o0" },
          objects: [
            { id: "o0", fields: { value: "1", next: "→ o1" } },
            { id: "o1", fields: { value: "2", next: "→ o2" } },
            { id: "o2", fields: { value: "3", next: "null" } },
          ],
        },
      ),
      step(
        "先保留继续入口",
        "改变 current.next 会覆盖旧连接，因此先保存旧后继。",
        "next 与原 current.next 都关联 o1。",
        6,
        4,
        {
          vars: { prev: "null", current: "→ o0", next: "→ o1" },
          objects: [
            { id: "o0", fields: { value: "1", next: "→ o1" } },
            { id: "o1", fields: { value: "2", next: "→ o2" } },
            { id: "o2", fields: { value: "3", next: "null" } },
          ],
        },
      ),
      step(
        "改变当前连接",
        "令当前节点指向反转部分的头。第一轮就是 null。",
        "o0.next 变了，但 next 仍保留 o1。",
        7,
        5,
        {
          vars: { prev: "null", current: "→ o0", next: "→ o1" },
          objects: [
            { id: "o0", fields: { value: "1", next: "null" } },
            { id: "o1", fields: { value: "2", next: "→ o2" } },
            { id: "o2", fields: { value: "3", next: "null" } },
          ],
        },
      ),
      step(
        "推进两个部分",
        "prev 移到当前节点；current 移到保存的后继。",
        "已反转部分包含 o0，待处理部分从 o1 开始。",
        9,
        7,
        {
          vars: { prev: "→ o0", current: "→ o1", next: "→ o1" },
          objects: [
            { id: "o0", fields: { value: "1", next: "null" } },
            { id: "o1", fields: { value: "2", next: "→ o2" } },
            { id: "o2", fields: { value: "3", next: "null" } },
          ],
        },
      ),
      step(
        "重复并返回新头",
        "对其余节点重复同一轮。current 为空时，prev 指向完整反转链。",
        "最终 o2 → o1 → o0。详细每轮可进入逐步实验。",
        11,
        9,
        {
          vars: { prev: "→ o2", current: "null" },
          objects: [
            { id: "o0", fields: { value: "1", next: "null" } },
            { id: "o1", fields: { value: "2", next: "→ o0" } },
            { id: "o2", fields: { value: "3", next: "→ o1" } },
          ],
        },
      ),
    ],
    change:
      "交换“保存后继”和“修改连接”的顺序，next 会读到已经改变的连接，原来的后继入口丢失。返回旧 head 只会拿到原头，它现在是尾节点。",
    errors:
      "空链表直接返回 null；单节点保持不变；重复值不改变节点身份。这里要求无环链表，有环输入会导致不同问题。每个节点处理一次，时间 O(n)，额外变量固定，空间 O(1)。",
    structure:
      "prev=null，current=head → 保存 next → current.next=prev → 推进 prev 与 current → 返回 prev。记住每条语句保护的关系，而不是只背顺序。",
    bridge:
      "节点还能有两个子引用，构成二叉树。增加多个邻接关系，则可以描述图。",
    next: "binary",
    experiment: "reverse",
    challenge: {
      question: "为什么先保存 current.next？",
      options: [
        "为了复制整个后续链表",
        "防止覆盖连接后失去继续遍历的入口",
        "为了交换数字",
      ],
      correct: 1,
      explain:
        "保存的是引用值，不是复制链表。改线之后，还要靠这个入口处理原后继。",
    },
  },
  {
    id: "binary",
    title: "二分查找：每次排除不可能的位置",
    group: "基础连接数据结构",
    problem:
      "在升序数组 [1,3,5,7,9] 中查找 7。我们希望利用顺序，避免从头检查每一个元素。",
    intuition:
      "先看中间的 5。既然 7 比 5 大，左侧所有数都不可能是 7。接下来只找右半部分。每次比较的价值，是安全地排除一片位置。",
    definition:
      "二分查找在有序搜索区间中比较中点，并将候选区间缩小。本课用包含左右端点的闭区间 [left,right]。不变量是：若目标存在，它仍在候选区间内。",
    java: sourceFor("binary", "java", [1, 3, 5, 7, 9], "correct", 7),
    javascript: sourceFor(
      "binary",
      "javascript",
      [1, 3, 5, 7, 9],
      "correct",
      7,
    ),
    difference:
      "Java 整数除法舍去小数；JS 要用 Math.floor 得到中点整数。JS 对数字排序不能直接依赖无比较函数的 sort()。本课代码输入已经升序。",
    steps: [
      step(
        "确定候选区间",
        "还未排除任何位置，因此 left=0、right=4。",
        "端点都包含在区间中。",
        4,
        2,
        {
          vars: { left: "0", right: "4", target: "7" },
          cells: ["1", "3", "5", "7", "9"],
          active: [0, 1, 2, 3, 4],
        },
      ),
      step(
        "计算中点",
        "0 + floor((4-0)/2) = 2。读取 values[2]=5。",
        "中点是下标，不是元素值。",
        6,
        4,
        {
          vars: { left: "0", right: "4", mid: "2", target: "7" },
          cells: ["1", "3", "5", "7", "9"],
          active: [2],
        },
      ),
      step(
        "排除左半部分",
        "5 < 7，升序保证下标 0 到 2 都不可能是目标。",
        "left=mid+1=3，保留位置 3 和 4。",
        8,
        6,
        {
          vars: { left: "3", right: "4", target: "7" },
          cells: ["1", "3", "5", "7", "9"],
          active: [3, 4],
        },
      ),
      step(
        "再次取中点并命中",
        "3 + floor((4-3)/2) = 3，values[3]=7。",
        "返回下标 3，而不是数字 7。",
        7,
        5,
        {
          vars: { left: "3", right: "4", mid: "3", target: "7" },
          cells: ["1", "3", "5", "7", "9"],
          active: [3],
          tasks: ["返回 3"],
        },
      ),
    ],
    change:
      "把 left=mid+1 改为 left=mid，某些小区间会不再缩小。把 <= 改为 <，可能漏掉最后一个候选位置。目标不存在时，最终 left>right，返回 -1。",
    errors:
      "先明确端点含义，再写更新式。空数组 right=-1，不进入循环。重复值时，本实现返回某个命中下标，不保证第一个。每次候选数约减半，时间 O(log n)，额外空间 O(1)。",
    structure:
      "升序前提 → 初始化闭区间 → left<=right 时取中点 → 命中返回 → 按比较排除含中点的一半 → 无候选返回 -1。",
    bridge:
      "树形索引也利用分支缩小候选范围，但具体结构、平衡条件和代价不同，不能只因“分两边”就等同二分查找。",
    next: "hash",
    experiment: "binary",
    challenge: {
      question: "中点值为 5，目标为 7，下一步 left 应是多少？",
      options: ["mid", "mid + 1", "0"],
      correct: 1,
      explain:
        "中点本身也已被排除。向 mid+1 推进，既保留所有可能位置，也保证区间缩小。",
    },
  },
  {
    id: "hash",
    title: "映射与哈希表：用键找到值",
    group: "基础连接数据结构",
    problem: "根据用户名查询积分。逐个扫描所有用户会重复做很多无关比较。",
    intuition:
      "先把用户名转换成用于定位的编号，再到对应位置找记录。不同名字可能落到同一个位置，所以还要检查真正的键。",
    definition:
      "映射保存键到值的关联。哈希表是映射的一种实现，用哈希函数将键映射到桶，再处理冲突。冲突表示不同键得到同一桶位置，不表示它们是同一个键。",
    java: javaMain(
      'var scores = new java.util.HashMap<String, Integer>();\nscores.put("Lin", 10);\nscores.put("Mei", 20);\nscores.put("Lin", 15);\nSystem.out.println(scores.get("Lin"));',
    ),
    javascript:
      'const scores = new Map();\nscores.set("Lin", 10);\nscores.set("Mei", 20);\nscores.set("Lin", 15);\nconsole.log(scores.get("Lin"));',
    difference:
      "Java HashMap 的实现确实涉及桶与冲突处理。JS Map 规范要求平均次线性访问，并未规定必须采用某一种哈希表布局。本课显示键值关联，不伪造两者内部桶位置。",
    steps: [
      step("创建映射", "初始没有键值条目。", "scores 关联映射对象。", 3, 1, {
        vars: { scores: "→ 映射" },
        objects: [{ id: "映射", fields: {} }],
      }),
      step(
        "保存 Lin",
        "第一次写入该键，建立关联。",
        "键是 Lin，值是 10。",
        4,
        2,
        { objects: [{ id: "映射", fields: { Lin: "10" } }] },
      ),
      step(
        "保存另一个键",
        "Mei 与 Lin 是不同键。",
        "两个条目同时保留。",
        5,
        3,
        { objects: [{ id: "映射", fields: { Lin: "10", Mei: "20" } }] },
      ),
      step(
        "更新已有键",
        "再次写入 Lin，替换它关联的值。",
        "不会新增第二条同键条目。",
        6,
        4,
        { objects: [{ id: "映射", fields: { Lin: "15", Mei: "20" } }] },
      ),
      step("按键读取", "查找 Lin 对应的当前值。", "输出 15。", 7, 5, {
        objects: [{ id: "映射", fields: { Lin: "15", Mei: "20" } }],
        tasks: ["输出 15"],
      }),
    ],
    change:
      "读取不存在的键：Java get 通常返回 null，JS Map.get 返回 undefined。若本身允许这些值，需用 containsKey/has 区分缺失。",
    errors:
      "平均 O(1) 不表示每次都只做一个固定操作。冲突、扩容和键的处理都有成本。Java 自定义键必须正确配合 equals 与 hashCode；可变键可能破坏查找。",
    structure:
      "选择稳定的键 → 写入关联 → 用同样的键规则查找 → 显式处理缺失。理解抽象操作后，再实现桶数组与冲突策略。",
    bridge:
      "缓存、计数统计和去重都依赖快速定位。Redis 的键值操作与本地 Map 在持久化、网络和并发方面仍有明显差别。",
    next: "async",
    challenge: {
      question: "同一个键 Lin 先设 10 再设 15，通常保留几个 Lin 条目？",
      options: ["两个", "一个，值为 15", "一个，值为 25"],
      correct: 1,
      explain: "映射的一个键关联一个当前值。第二次设置替换原值，不会自动相加。",
    },
  },
  {
    id: "async",
    title: "异步与任务顺序：稍后执行是什么意思",
    group: "异步与可靠性",
    problem:
      "程序需要等待慢操作，但不希望把所有后续工作都写成阻塞等待。理解“稍后执行”的时机，才能预测输出。",
    intuition:
      "先完成正在处理的整件事，再从待办区取工作。JS 的微任务与定时器任务有不同调度规则，不能只用“谁先登记谁先执行”解释。",
    definition:
      "异步让某项工作的完成处理发生在当前流程之后。微任务是在当前 JS 执行栈清空后、进入下一个普通任务前被处理的一类作业。Java CompletableFuture 是异步结果的抽象，不等同 JS 事件循环。",
    java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("A");\n    var done = java.util.concurrent.CompletableFuture.runAsync(\n      () -> System.out.println("C")\n    );\n    done.join();\n    System.out.println("B");\n  }\n}',
    javascript:
      'console.log("A");\nsetTimeout(() => console.log("T"), 0);\nPromise.resolve().then(() => console.log("M"));\nconsole.log("B");',
    difference:
      "JS 示例输出 A、B、M、T，定时器延迟不是精确执行时刻。Java 示例通过 join 等待 C 完成，输出 A、C、B。两段用来对比等待与调度，绝非相同机制的两种语法。",
    steps: [
      step(
        "执行同步起点",
        "当前流程先执行 A。",
        "两种语言此时都输出 A。",
        3,
        1,
        { stack: ["当前同步流程"], tasks: ["已输出 A"] },
      ),
      step(
        "安排后续工作",
        "JS 登记定时器回调，再登记 Promise 回调。Java 提交异步工作；其具体开始时机不固定。",
        "登记不等于立刻执行回调。",
        4,
        3,
        {
          stack: ["当前同步流程"],
          tasks: [
            "JS 微任务：M",
            "JS 定时器任务：T",
            "Java：C 已提交，开始时机未定",
          ],
        },
      ),
      step(
        "处理当前流程",
        "JS 继续输出 B。Java 的 join 等待 C 完成，之后才允许继续。",
        "两种语言此处有意展示不同保证。",
        7,
        4,
        { tasks: ["JS 已输出 A、B", "Java 等待 C 完成"] },
      ),
      step(
        "执行后续处理",
        "JS 当前栈清空后处理 M，再在后续任务中执行 T。Java join 返回后输出 B。",
        "JS 为 A B M T；Java 为 A C B。",
        8,
        3,
        { tasks: ["JS：A → B → M → T", "Java：A → C → B"] },
      ),
    ],
    change:
      "Java 删除 join 后，B 与 C 的相对顺序不再由这里保证。JS 删除 Promise 行后，没有 M；把定时器延迟设为 1000，不会阻塞同步 B，但回调也不保证恰好在 1000ms 执行。",
    errors:
      "这个时间轴是限定示例的教学模型，不涵盖 Node 的所有阶段或多线程完整调度。不要用 JS 的微任务规则解释 Java 线程。不要把“异步”等同“必然并行”。",
    structure:
      "区分同步语句与登记操作 → 找到等待点 → 明确调度规则 → 再预测输出。对多线程只陈述有同步关系保证的顺序。",
    bridge:
      "理解此处差异后，再分别学习 JS Promise/async-await、Vue 更新队列，以及 Java 线程池与并发控制。",
    next: "values",
    challenge: {
      question: "本课 JS 中，setTimeout(...,0) 会先于同步 B 执行吗？",
      options: ["会，因为延迟是 0", "不会，当前同步流程先完成"],
      correct: 1,
      explain:
        "0 表示定时条件，不会中断正在执行的同步代码。此例还会先处理 Promise 微任务 M。",
    },
  },
];
export const roadmap = [
  {
    title: "Java 核心进阶",
    topics:
      "类与接口、继承与多态、泛型、集合源码、异常、I/O、线程池、锁、JVM 与垃圾回收",
  },
  {
    title: "JavaScript 与 Vue",
    topics:
      "原型链、模块、类型转换、Promise、async/await、浏览器事件、Vue 响应式与渲染",
  },
  {
    title: "数据结构与算法进阶",
    topics:
      "队列、树、堆、图、排序、回溯、动态规划；接入独立练习与 LeetCode 题目链接",
  },
  {
    title: "Java 工程路线",
    topics:
      "Maven、MySQL、MyBatis、Spring Boot、Redis、Spring Cloud；结合平台自身模块学习",
  },
];
