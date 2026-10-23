import type { Language } from "./books";
import { vueArticles } from "./vueTextbook";
import { foundationArticles } from "./foundationTextbook";
import { structuresArticles } from "./structuresTextbook";
export type Article = {
  environment?: "browser";
  id: string;
  language: Language;
  title: string;
  goal: string;
  intuition: string;
  definition: string;
  code: string;
  output: string;
  reasoning: { code: string; why: string }[];
  change: string;
  errors: string;
  structure: string;
  prerequisite: string[];
  source: string;
  exercises: string[];
  projects: string[];
};
const java = (body: string, helpers = "") =>
  `public class Main {\n${helpers ? helpers + "\n" : ""}  public static void main(String[] args) {\n${body
    .split("\n")
    .map((s) => "    " + s)
    .join("\n")}\n  }\n}`;
const J = "https://dev.java/learn/";
const S = "https://javascript.info/";
export const articles: Article[] = [
  ...vueArticles,
  ...foundationArticles,
  ...structuresArticles,
];
function add(
  id: string,
  title: string,
  goal: string,
  intuition: string,
  definition: string,
  code: string,
  output: string,
  reasoning: [string, string][],
  change: string,
  errors: string,
  structure: string,
  prerequisite: string[] = [],
  exercises: string[] = [],
  projects: string[] = [],
) {
  articles.push({
    id,
    language: id.startsWith("java-") ? "java" : "javascript",
    title,
    goal,
    intuition,
    definition,
    code,
    output,
    reasoning: reasoning.map(([code, why]) => ({ code, why })),
    change,
    errors,
    structure,
    prerequisite,
    source: id.startsWith("java-") ? J : S,
    exercises,
    projects,
  });
}
add(
  "java-start-first",
  "第一次运行：让程序显示一个结果",
  "让计算机显示欢迎语，并计算两张 12 元门票的总价。",
  "计算器按下等号后才计算。Java 也需要明确的执行入口，写进文件并不会自己运行。",
  "源码是人编写的文本。编译器检查源码并生成字节码。JVM 是执行这些字节码的程序。本例使用 Java 21。",
  java('System.out.println("你好，Java");\nSystem.out.println(12 * 2);'),
  "你好，Java\n24",
  [
    [
      "public class Main",
      "定义名为 Main 的类。将文件保存为 Main.java，使公开类名与文件名一致。",
    ],
    [
      "public static void main(String[] args)",
      "这是本例的执行入口。先把它作为固定外壳使用。后面分别学习 public、static、参数与数组。",
    ],
    [
      "System.out.println",
      "println 是输出方法。括号中放要输出的内容。双引号中的内容是文本；12 * 2 是需要计算的表达式。",
    ],
    ["12 * 2", "先相乘得到 24，再把结果交给 println；不是输出字符 12 * 2。"],
  ],
  '把 12 * 2 写成 "12 * 2"，输出会变成原样文本。删除语句末尾的分号，本例不能通过编译。',
  "中文文字放在双引号中。Java 使用英文分号和括号。先运行 javac Main.java，再运行 java Main；也可以用 Java 21 的 java Main.java 单文件启动。",
  "编写 Main.java → 编译检查 → 进入 main → 按顺序计算并输出。",
  [],
  ["ticket-total"],
  ["orbit-clock"],
);
add(
  "java-start-compile",
  "源码如何变成可执行的程序",
  "区分写错语法和程序运行后算错，知道错误发生在哪一步。",
  "食谱需要被读懂后才能执行。编译器先检查代码的结构与类型，再生成 JVM 能识别的指令。",
  "字节码是 JVM 使用的指令形式。.class 文件保存编译结果与类的信息。它不是 CPU 可以直接执行的本机机器码。",
  java("int total = 3 * 8;\nSystem.out.println(total);"),
  "24",
  [
    [
      "int total = 3 * 8;",
      "编译器检查变量类型与表达式。执行时先算乘法，再将结果保存到 total。",
    ],
    [
      "System.out.println(total);",
      "执行时读取 total 的当前值并输出。javac 本身不会因此打印 24。",
    ],
  ],
  "把 total 改成未声明的 sum：编译失败。把乘法改成加法：能编译，但得到 11。这是逻辑错误。",
  "修改源码后必须运行新版本。旧 .class 可以继续执行旧逻辑；修改 .java 不会自动更新所有运行环境中的 .class。",
  "源码负责表达意图，编译器检查并转换，JVM 执行；按错误发生的阶段排查。",
  ["java-start-first"],
);
add(
  "java-start-jdk",
  "JDK 与 JVM：谁负责编译，谁负责运行",
  "知道安装开发工具后获得了什么，避免把语言、工具和运行程序混成一件事。",
  "写文章需要编辑工具，阅读文章需要阅读器。开发工具可以包含运行能力，但两种职责仍然不同。",
  "JDK 是 Java 开发工具包，包含 javac、java 等工具。JVM 是执行 Java 字节码的虚拟机；java 启动器负责启动它。",
  java(
    'System.out.println(System.getProperty("java.version"));\nSystem.out.println(6 * 7);',
  ),
  "第一行显示实际 Java 版本\n42",
  [
    [
      'System.getProperty("java.version")',
      "读取当前运行环境的 Java 版本。具体字符串由运行环境决定。",
    ],
    ["6 * 7", "与版本读取无关，单独计算后输出 42。"],
  ],
  "使用 java -version 查看启动器版本，使用 javac -version 查看编译器版本；它们可能来自不同安装路径。",
  "不能因为 java 命令存在就认定 javac 一定存在。字节码版本过新时，旧 JVM 可能无法运行它。",
  "先核对工具路径与版本，再判断代码或运行参数的问题。",
  ["java-start-compile"],
);
add(
  "java-start-main",
  "main 与代码组织：先定义，再调用",
  "找到程序的入口，并把重复行为拆成可调用的方法。",
  "写下一个操作步骤，不等于立即执行它。只有走到调用位置，程序才开始执行那个方法。",
  "方法是一段有名称、可以调用的代码。main 是本例的入口方法。方法调用会建立一次调用记录，返回后继续原来的位置。",
  java(
    'greet("小明");\ngreet("小红");',
    '  static void greet(String name) {\n    System.out.println("你好，" + name);\n  }',
  ),
  "你好，小明\n你好，小红",
  [
    [
      "static void greet(String name)",
      "定义接收一个 String 参数的方法。void 表示不返回结果。此时定义代码不会自己输出。",
    ],
    ['greet("小明")', "将文本值传入参数 name，然后执行 greet 内部语句。"],
    [
      'greet("小红")',
      "第一次调用返回后，建立第二次调用；这次 name 接收到不同值。",
    ],
  ],
  "把两个调用交换，输出顺序也交换。删除调用但保留方法定义，程序仍可运行，却不会输出欢迎语。",
  "在 main 外随意写执行语句不符合本例类体结构。参数 name 属于 greet 的调用，不会自动成为 main 的局部变量。",
  "定义行为 → 在入口调用 → 传入参数 → 方法返回 → 继续下一行。",
  ["java-start-first"],
  ["greeting"],
);
add(
  "java-start-errors",
  "区分编译错误、运行异常和错误结果",
  "遇到红字时先定位阶段，避免靠随机改代码解决问题。",
  "未能开始、途中失败、顺利完成但算错，是三种不同问题。它们需要不同证据。",
  "编译错误阻止生成有效程序。异常是运行时报告的异常情况。逻辑错误可以没有异常，但结果违背目标。",
  java("int total = 12;\nint people = 3;\nSystem.out.println(total / people);"),
  "4",
  [
    ["int people = 3;", "准备除数。这里只保存整数；没有开始做除法。"],
    ["total / people", "运行时读取两个值。12 除以 3 得到整数 4。"],
  ],
  "people 改为 0：整数除法运行时抛出 ArithmeticException。把 people 拼错：编译失败。改为 5：输出 2，整数除法丢弃小数部分。",
  "异常消息是运行事实，不自动证明你不懂某个概念。先检查指出的源码行、输入和预期，再缩小原因。",
  "先问是否通过编译 → 是否中途抛异常 → 实际结果是否符合预期。",
  ["java-start-compile"],
  ["safe-divide"],
);
add(
  "java-basics-types",
  "整数范围：为什么最大值再加一会变小",
  "选择能装下数据的类型，并识别溢出的结果。",
  "计数器只有固定位数时，超过能表示的最大数会发生回绕。Java 的 int 也有固定范围。",
  "int 是 32 位有符号整数，范围为 -2147483648 到 2147483647。整数溢出不会自动抛异常。long 是 64 位整数。",
  java(
    "int count = Integer.MAX_VALUE;\nSystem.out.println(count + 1);\nlong safe = (long) count + 1;\nSystem.out.println(safe);",
  ),
  "-2147483648\n2147483648",
  [
    ["Integer.MAX_VALUE", "获取 int 的最大值。它是类型边界，不是无限大的数。"],
    [
      "count + 1",
      "两个操作数都是 int，所以执行 int 加法。结果超出范围后回绕。",
    ],
    [
      "(long) count + 1",
      "先将 count 转为 long，再做 long 加法，结果可以在 long 中表示。",
    ],
  ],
  "写成 long safe = count + 1，仍会先发生 int 溢出，再把错误结果扩大成 long。扩大结果的容器无法修复已经发生的溢出。",
  "小数常量默认是 double。整数范围、浮点精度和字符串中的数字是三类问题，应分别处理。",
  "先决定运算使用的类型，再检查该类型能否表示中间结果。",
  ["java-start-errors"],
  ["ticket-total"],
);
add(
  "java-basics-conversion",
  "类型转换：转换发生在计算之前还是之后",
  "避免两个整数相除后，再用 double 接收却丢掉小数。",
  "先把 7 块饼平均分成 2 份，如果只保留完整块，之后换更大的盘子也找不回丢掉的小数。",
  "类型转换让一个值以另一种类型参与运算。Java 中两个 int 相除执行整数除法；一个操作数是 double 时可执行浮点除法。",
  java(
    "int total = 7;\nint count = 2;\ndouble a = total / count;\ndouble b = (double) total / count;\nSystem.out.println(a);\nSystem.out.println(b);",
  ),
  "3.0\n3.5",
  [
    [
      "double a = total / count;",
      "右侧先执行 int 除法得到 3，再转换为 double 的 3.0。左侧不会倒过来改变右侧已经选择的运算。",
    ],
    [
      "(double) total / count",
      "先把 total 转为 7.0，让这次除法使用浮点运算，结果为 3.5。",
    ],
  ],
  "将转换移到整个除法外侧：(double)(total / count)，仍得到 3.0。",
  "double 也不是精确十进制类型。金额需要结合业务选用整数最小单位或 BigDecimal；类型转换本身不会使所有计算精确。",
  "先判断每个操作数的类型 → 确定运算规则 → 计算 → 赋给目标变量。",
  ["java-basics-types"],
);
add(
  "java-basics-branch",
  "条件判断：让程序在两条路中选一条",
  "根据余额决定能否购买，避免两种相反结果同时发生。",
  "闸机根据票是否有效选择放行或拒绝。条件是做选择的依据，不是执行动作本身。",
  "boolean 是只有 true、false 两个值的类型。if 根据条件值决定是否执行语句；else 在条件为 false 时执行。",
  java(
    'int balance = 20;\nint price = 12;\nif (balance >= price) {\n  balance -= price;\n  System.out.println("购买成功");\n} else {\n  System.out.println("余额不足");\n}\nSystem.out.println(balance);',
  ),
  "购买成功\n8",
  [
    ["balance >= price", "读取余额和价格，比较得到 true。比较本身不会扣款。"],
    [
      "balance -= price",
      "仅在 true 分支中扣款，相当于 balance = balance - price。",
    ],
    ["else", "与当前 if 配对。本轮不会执行这个分支。"],
  ],
  "balance 改为 10，进入 else，余额仍为 10。改成两个独立 if 时，第二个条件会读取可能已修改的余额，行为可能不同。",
  "Java 的 if 条件必须是 boolean。不要在尚未判断余额时先扣款；那会让失败操作也改变状态。",
  "准备数据 → 判断条件 → 只执行选中的分支 → 汇合继续。",
  ["java-basics-types"],
  ["ticket-total"],
  ["pixel-board"],
);
add(
  "java-basics-strings",
  "字符串比较：内容相同，为什么 == 可能是 false",
  "判断用户输入的文字是否一致，并区分内容和对象身份。",
  "两张纸可以写着同样的字，却仍然是两张纸。内容相同与是否同一个对象是不同问题。",
  "String 表示不可变的文本。Java 中引用上的 == 比较是否引用同一个对象；String.equals 比较字符内容。",
  java(
    'String a = new String("java");\nString b = new String("java");\nSystem.out.println(a == b);\nSystem.out.println(a.equals(b));\nString upper = a.toUpperCase(java.util.Locale.ROOT);\nSystem.out.println(a);\nSystem.out.println(upper);',
  ),
  "false\ntrue\njava\nJAVA",
  [
    [
      'new String("java")',
      "本例刻意创建新的字符串对象，用于分离身份与内容；日常不需要这样复制字面量。",
    ],
    ["a == b", "两个变量指向不同新对象，所以身份比较为 false。"],
    ["a.equals(b)", "比较文本内容，字符序列相同，所以为 true。"],
    [
      "a.toUpperCase",
      "返回转换后的文本。原字符串内容不变；需要用返回值接收结果。",
    ],
  ],
  'b 改成 a，== 为 true。调用方法时 a 若为 null，会抛 NullPointerException；"java".equals(a) 在 a 为 null 时返回 false。',
  "字符串常量池可能使某些 == 比较恰好为 true，不能据此使用 == 比较文本内容。",
  "先问比较身份还是内容，再选择 == 或 equals；字符串转换读取返回值。",
  ["java-basics-types"],
  ["palindrome"],
  ["word-rain"],
);
add(
  "java-objects-class",
  "类、对象与构造方法：new 的右边发生了什么",
  "创建两个学生，分别保存姓名和年龄，而不是把所有学生的数据混在一起。",
  "一张空表规定填写姓名、年龄。每个学生各填一份，表的结构相同，填写的数据可以不同。",
  "类定义一种类型及其成员。对象是按照类的定义创建的具体实例。构造方法在对象创建过程中执行，负责初始化。引用用于找到对象。",
  java(
    'Student stu = new Student("小明", 19);\nStudent other = new Student("小红", 18);\nSystem.out.println(stu.name);\nSystem.out.println(other.age);',
    "  static class Student {\n    String name;\n    int age;\n    Student(String name, int age) {\n      this.name = name;\n      this.age = age;\n    }\n  }",
  ),
  "小明\n18",
  [
    [
      "static class Student",
      "在 Main 中定义一个不需要外部 Main 实例的嵌套类。String name 与 int age 定义每个学生对象拥有的字段。",
    ],
    [
      'Student stu = new Student("小明", 19);',
      "左边声明 Student 类型变量 stu。右边为 Student 创建对象，并调用匹配的构造方法；构造正常结束后，new 表达式产生对象引用，赋值保存到 stu。",
    ],
    [
      "this.name = name;",
      "左侧是当前对象的字段，右侧是传入构造方法的参数。this 用于区分同名的两者。",
    ],
    [
      'new Student("小红", 18)',
      "再创建一个不同的对象。它有自己的字段，不会覆盖第一个对象的数据。",
    ],
  ],
  "把 other 改成 stu，两个变量会引用同一个对象。只删除构造方法后，原先带参数的 new Student(...) 将不再匹配。",
  "已经声明有参构造方法时，编译器不会再自动提供无参构造方法。构造方法没有返回类型；new 表达式产生引用，不是让构造方法 return 对象。",
  "类规定字段和方法 → new 创建对象并执行构造 → 变量保存引用 → 点号访问成员。",
  ["java-basics-strings"],
  ["reference-copy"],
  ["pet-garden"],
);
add(
  "java-objects-pass-value",
  "值传递：修改对象与替换参数有什么区别",
  "判断方法中的赋值会不会改变调用者的变量。",
  "复制一张联系卡给朋友。他可以根据卡片联系同一个人，但把自己的卡片换掉，不会替换你手里的卡片。",
  "Java 方法调用把实参值复制给形参。若这个值是引用，就复制引用值；调用者变量与形参变量仍是两个变量。",
  java(
    "Box box = new Box();\nchange(box);\nSystem.out.println(box.value);",
    "  static class Box { int value = 1; }\n  static void change(Box item) {\n    item.value = 9;\n    item = new Box();\n    item.value = 20;\n  }",
  ),
  "9",
  [
    [
      "change(box)",
      "复制 box 保存的引用到参数 item。两个变量此时引用同一个 Box。",
    ],
    [
      "item.value = 9;",
      "沿 item 找到原对象，修改它的字段。调用者通过 box 也会读到 9。",
    ],
    [
      "item = new Box();",
      "只改变 change 调用中的参数 item，使其引用新对象。main 的 box 没有重新赋值。",
    ],
    ["item.value = 20;", "修改第二个对象。原对象的 value 仍为 9。"],
  ],
  "删除 item = new Box()，后面赋值会继续修改原对象，最终输出 20。",
  "不要把“通过引用修改到共享对象”称为 Java 按引用传递。判断变量是否被替换与对象是否被修改时，应分别看栈与堆。",
  "先复制实参值 → 区分参数赋值与对象字段赋值 → 返回后查看调用者变量仍引用谁。",
  ["java-objects-class"],
  ["reference-copy"],
);
add(
  "java-objects-static",
  "static：共享计数与各自的姓名",
  "记录一共创建多少学生，同时保持每个学生有自己的名字。",
  "全班共用一块总人数看板，每个人另有自己的姓名。共享数据与每份对象的数据属于不同层次。",
  "实例字段属于具体对象。static 字段属于类的运行时状态，由该类对应的共享存储保存。实例方法有 this；静态方法没有实例 this。",
  java(
    'Student a = new Student("小明");\nStudent b = new Student("小红");\nSystem.out.println(a.name);\nSystem.out.println(b.name);\nSystem.out.println(Student.count);',
    "  static class Student {\n    static int count = 0;\n    String name;\n    Student(String name) { this.name = name; count++; }\n  }",
  ),
  "小明\n小红\n2",
  [
    [
      "static int count = 0;",
      "此计数不为每个学生各建一份。通过类名 Student.count 访问它。",
    ],
    ["String name;", "每个 Student 对象有自己的 name 字段。"],
    ["count++;", "每次构造学生时更新共享计数。两次正常创建后为 2。"],
  ],
  "把 name 改为 static，第二次构造会覆盖共享 name，a.name 和 b.name 都会读取小红。",
  "static 不等于线程安全。多线程 count++ 仍可能丢失更新。不要把 static 字段的具体物理位置简化成所有 JVM 实现完全相同。",
  "对象自己的数据用实例字段；确实属于类级共享状态时再考虑 static。",
  ["java-objects-class"],
  ["counter-object"],
);
add(
  "java-objects-access",
  "public、private 与封装：让余额只能按规则改变",
  "阻止外部代码把账户余额随意改成负数。",
  "银行可以提供存款、取款入口，同时不允许客户直接重写余额账本。",
  "访问控制决定哪些代码可以使用成员。private 限制成员在所属顶层类及其嵌套范围内访问；public 允许在可访问类型及模块规则下从外部访问。封装把状态修改集中在有规则的方法中。",
  java(
    "Account account = new Account();\naccount.deposit(20);\nSystem.out.println(account.balance());",
    '  static class Account {\n    private int balance;\n    public void deposit(int amount) {\n      if (amount <= 0) throw new IllegalArgumentException("金额必须为正数");\n      balance += amount;\n    }\n    public int balance() { return balance; }\n  }',
  ),
  "20",
  [
    [
      "private int balance;",
      "字段不作为外部调用者随意赋值的公共接口。注意本例 Main 是同一顶层嵌套范围，演示跨类限制时应拆成独立顶层类。",
    ],
    [
      "deposit(int amount)",
      "公开一个受约束的修改入口。先检查金额，再修改余额。",
    ],
    ["public int balance()", "提供读取行为，不暴露任意赋值入口。"],
  ],
  "调用 deposit(-5)，抛出异常且余额保持不变。把 balance 公开后，独立外部类可以绕开存款规则直接赋值。",
  "访问控制只是程序结构约束，不代替服务端鉴权。金额累加还需考虑溢出，真实账户应有事务与并发控制。",
  "隐藏可变状态 → 提供必要行为 → 在行为入口验证规则 → 只读查询结果。",
  ["java-objects-class"],
  ["safe-divide"],
);
add(
  "java-objects-inheritance",
  "多态：Animal 变量为什么能使用 Dog 对象",
  "把狗和其他动物交给统一的处理代码，同时保留各自的发声行为。",
  "一个要求接收“动物”的位置可以接收一只狗，因为狗是动物的一种。但“是动物”不能保证“会捡球”。",
  "继承用 extends 建立子类型关系。多态使父类型引用可以指向子类对象。重写是子类提供相同实例方法签名的实现。编译时检查允许的调用，运行时选择重写实现。",
  'abstract class Animal {\n  public void eat() { System.out.println("进食"); }\n  public abstract void speak();\n}\nclass Dog extends Animal {\n  @Override\n  public void speak() { System.out.println("汪"); }\n  public void fetch() { System.out.println("捡球"); }\n}\npublic class Main {\n  public static void main(String[] args) {\n    Animal pet = new Dog();\n    pet.eat();\n    pet.speak();\n  }\n}',
  "进食\n汪",
  [
    [
      "abstract class Animal",
      "Animal 定义共同能力。abstract 表示它不完整，不能直接 new Animal()；但可以用作变量类型。",
    ],
    [
      "class Dog extends Animal",
      "声明狗是动物的一种。这里的类型关系，是 Animal 变量能够引用 Dog 对象的依据。",
    ],
    [
      "Animal pet = new Dog();",
      "Animal 是变量声明类型；pet 是变量名。new Dog() 创建并初始化 Dog 对象，得到引用；= 将该引用保存到 pet。没有另外创建 Animal 对象，对象也没有变成 Animal。本例未声明构造方法，编译器为 Dog 提供无参构造方法。",
    ],
    [
      "pet.eat();",
      "编译器确认 Animal 提供可访问的 eat()。Dog 没有重写它，因此运行继承的 Animal.eat()。",
    ],
    [
      "pet.speak();",
      "Animal 声明了 speak()，所以调用通过编译。pet 实际引用 Dog 对象，因此进入 Dog.speak()。新调用的 this 和 main 中的 pet 引用同一个对象。",
    ],
    [
      "public void fetch()",
      "只有 Dog 提供这个方法。pet.fetch() 不能通过编译，因为 Animal 类型不能保证有 fetch()。将变量声明为 Dog 后，才能直接通过它调用 fetch()。",
    ],
  ],
  "加上 pet.fetch()：编译失败。改为 Dog pet = new Dog() 后可调用 fetch()。删除 Dog 的 speak 实现而保留具体 Dog 类：编译失败，因为它没有实现抽象方法。",
  "不要把字段和 static 方法套用实例方法重写规则。强制转换不会把对象变成另一种对象；错误的向下转换可能抛 ClassCastException。反向 Dog d = animal 也不会仅因 animal 实际引用 Dog 就自动通过编译。",
  "左侧类型决定允许的操作；右侧 new 决定具体对象；执行允许的实例方法时，根据实际对象选择重写实现。",
  ["java-objects-class", "java-objects-access"],
  ["polymorphism"],
  ["pet-garden"],
);
add(
  "javascript-fundamentals-first",
  "第一次运行 JavaScript：读取顺序与输出",
  "运行一段能看到结果的程序，区分写下代码与执行代码。",
  "在纸上写“3 乘 8”和按计算器得到 24 是两件事。程序也需要运行环境来执行表达式。",
  "JavaScript 是一门编程语言。浏览器与 Node.js 是常见运行环境。console.log 是这些环境提供的输出接口。",
  'console.log("你好，JavaScript");\nconst total = 3 * 8;\nconsole.log(total);',
  "你好，JavaScript\n24",
  [
    [
      'console.log("你好，JavaScript")',
      "将双引号中的字符串交给输出接口。双引号本身不属于文字内容。",
    ],
    ["const total = 3 * 8", "先算出 24，再创建名为 total 的绑定保存结果。"],
    ["console.log(total)", "读取变量的值，而不是输出单词 total。"],
  ],
  '把最后一行改成 console.log("total")，输出字面文本 total。将乘法改成加法，得到 11。',
  "本平台实际运行使用 Node.js。document 是浏览器提供的对象，在普通 Node 程序中不存在。",
  "按顺序计算表达式 → 保存需要复用的结果 → 明确输出。",
  [],
  ["ticket-total"],
  ["orbit-clock"],
);
add(
  "javascript-fundamentals-strict",
  "严格模式：让拼错变量名尽早报错",
  "避免给不存在的变量赋值时意外创建全局状态。",
  "写错联系人名字时立即提示，比把数据写入另一个位置更容易发现问题。",
  '严格模式是一组更严格的执行规则。脚本顶部的 "use strict" 指令可启用它。JavaScript 模块与 class 内部自动使用严格模式。',
  '"use strict";\nlet total = 3;\ntotal += 2;\nconsole.log(total);',
  "5",
  [
    ['"use strict"', "作为脚本开头的指令启用严格模式，不是打印文字。"],
    ["let total = 3", "先声明变量，再赋值。"],
    ["total += 2", "读取原值 3，加上 2，再保存 5。"],
  ],
  "将第二次 total 拼成 totla，严格模式抛 ReferenceError。未声明变量与已经声明但值为 undefined 不是一回事。",
  "严格模式不会把 JavaScript 变成静态类型语言，也不意味着所有逻辑错误都会被检测。",
  "声明绑定 → 只操作存在的名称 → 遇错先检查作用域和拼写。",
  ["javascript-fundamentals-first"],
);
add(
  "javascript-fundamentals-types",
  "值的类型与特殊值：undefined 和 null",
  "区分没有提供值与明确表示“没有对象”，避免错误读取属性。",
  "未填写的表格和主动勾选“无”可能表现都为空，但传达的意图不同。",
  'undefined 是一种原始值，常见于未初始化绑定或缺失属性。null 也是原始值，通常由程序主动用来表示空。typeof 返回类型描述字符串，但 typeof null 是历史遗留的 "object"。',
  "let name;\nconst selected = null;\nconst count = 0;\nconsole.log(name);\nconsole.log(selected);\nconsole.log(typeof count);\nconsole.log(typeof selected);",
  "undefined\nnull\nnumber\nobject",
  [
    ["let name", "创建已初始化为 undefined 的绑定。它与从未声明的变量不同。"],
    ["const selected = null", "主动保存 null，表示本例还没有选中对象。"],
    ["typeof selected", "得到 object 不代表 null 可以像对象一样读取属性。"],
  ],
  "读取 selected.name 会抛 TypeError。typeof missing 对通常未声明的名称返回 undefined；但在同一作用域 let 声明前的暂时性死区仍会抛异常。",
  "0、false、空字符串不是 null。不要用一个含糊的“没有值”解释所有不同状态。",
  "先区分绑定是否存在，再区分它保存的值与值的类型。",
  ["javascript-fundamentals-first"],
);
add(
  "javascript-fundamentals-conversion",
  '类型转换与 ===：为什么 2 + "3" 得到 23',
  "处理输入框得到的文本，并避免把拼接误当加法。",
  "表单里看起来像数字的字符，首先仍然是文本。必须明确转换后，才能按数字处理。",
  "类型转换让值按另一种类型参与运算。+ 可能做数字加法，也可能做字符串拼接。=== 不进行类型转换后再比较。",
  'const input = "3";\nconsole.log(2 + input);\nconsole.log(2 + Number(input));\nconsole.log(3 === input);\nconsole.log(3 == input);',
  "23\n5\nfalse\ntrue",
  [
    ["2 + input", "input 是字符串，+ 在此执行拼接，结果是字符串 23。"],
    ["Number(input)", "显式转换为数字 3，再与 2 相加。"],
    ["3 === input", "数字与字符串类型不同，严格相等为 false。"],
    [
      "3 == input",
      "宽松相等按相应转换规则比较，得到 true。不能据此认为原变量类型已改变。",
    ],
  ],
  'input 改为 "abc"，Number(input) 为 NaN。用 Number.isNaN 检查这种转换失败。',
  'Number("") 为 0。空输入是否有效属于业务校验，不应只依赖转换后的结果。',
  "外部文本 → 检查是否允许为空 → 显式转换 → 验证数值 → 计算。",
  ["javascript-fundamentals-types"],
  ["ticket-total"],
);
add(
  "javascript-fundamentals-operators",
  "逻辑运算与 ??：保留合法的零",
  "给缺失的设置提供默认值，但不覆盖用户明确填写的 0。",
  "音量 0 表示静音，不等于没有设置音量。默认值应只填补真正缺失的情况。",
  "|| 在左值为假值时返回右值。?? 只在左值为 null 或 undefined 时返回右值。它们返回操作数，不一定返回 boolean。",
  "const volume = 0;\nconsole.log(volume || 50);\nconsole.log(volume ?? 50);\nconst missing = undefined;\nconsole.log(missing ?? 50);",
  "50\n0\n50",
  [
    [
      "volume || 50",
      "0 是假值，所以返回 50。其他假值还包括空字符串、false、NaN、null、undefined。",
    ],
    ["volume ?? 50", "0 不属于 null 或 undefined，所以保留 0。"],
    ["missing ?? 50", "左侧缺失，使用右侧默认值。"],
  ],
  "把 volume 改为 false 或空字符串，两种写法仍有差别。右侧有函数调用时，只有确实需要右值才会执行。",
  "?? 与 ||、&& 混用时需要合适的括号，否则某些写法是语法错误。",
  "先定义什么算缺失，再选择默认值运算符；不要把合法的零当作缺失。",
  ["javascript-fundamentals-types"],
);
add(
  "javascript-fundamentals-branch",
  "条件分支：买得起才扣款",
  "让程序依据余额执行不同操作，并检查状态变化。",
  "付款成功和余额不足是同一次判断的两种结果。只有成功分支才应该扣款。",
  "if 将条件按真值规则判断，再决定执行哪条分支。else 对应条件为假时的行为。",
  'let balance = 20;\nconst price = 12;\nif (balance >= price) {\n  balance -= price;\n  console.log("购买成功");\n} else {\n  console.log("余额不足");\n}\nconsole.log(balance);',
  "购买成功\n8",
  [
    ["balance >= price", "比较产生 true，不会修改余额。"],
    ["balance -= price", "进入成功分支后才做减法与赋值。"],
    ["else", "当前条件为 true，因此跳过失败分支。"],
  ],
  "balance 改为 10，打印余额不足并保留余额 10。把扣款放到判断前，会让失败购买也改变余额。",
  '字符串 "false" 是非空字符串，按真值判断为真。外部输入要先明确解析，不能直接当 boolean。',
  "判断 → 执行唯一选中的分支 → 汇合后继续。",
  ["javascript-fundamentals-conversion"],
  ["ticket-total"],
  ["pixel-board"],
);
add(
  "javascript-fundamentals-arrows",
  "箭头函数：把一小段计算作为值传递",
  "让数组中的每个数都按相同规则变化，而不重复写三遍。",
  "把“乘二”这条规则交给处理每个元素的工具，比为每个数字单独写代码更容易复用。",
  "函数也是值，可以保存到变量并作为参数传递。箭头函数是一种函数表达式写法；表达式体直接返回表达式的值，花括号函数体需要明确 return。",
  "const double = n => n * 2;\nconst values = [1, 2, 3];\nconst result = values.map(double);\nconsole.log(JSON.stringify(result));\nconsole.log(JSON.stringify(values));",
  "[2,4,6]\n[1,2,3]",
  [
    ["n => n * 2", "创建函数值。此时没有输入 n，也没有立即执行乘法。"],
    [
      "values.map(double)",
      "map 依次用元素作为参数调用 double，收集返回值形成新数组。",
    ],
    [
      "console.log(JSON.stringify(values))",
      "本例没有修改原数组元素，原数组仍为 1、2、3。",
    ],
  ],
  "改成 n => { n * 2; } 会返回 undefined；写成 n => { return n * 2; } 才返回计算结果。",
  "箭头函数没有自己的 this，也不能作为 new 的构造函数。不要把所有普通方法无差别换成箭头函数。",
  "定义转换规则 → 将函数作为参数传入 → 接收每次返回值组成的新结果。",
  ["javascript-fundamentals-first"],
  ["map-double"],
  ["particle-field"],
);
add(
  "javascript-objects-new",
  "new：创建对象、设置原型、执行构造",
  "用相同初始化规则创建多个互不覆盖的学生对象。",
  "把同一张空表给两个人各填一份，比每次手写字段结构更一致。",
  "对本例普通构造函数使用 new 时，会创建新对象，使其原型关联到构造函数的 prototype，并以新对象作为 this 执行函数；未返回其他对象时，new 的结果是这个新对象。",
  'function Student(name) {\n  this.name = name;\n}\nStudent.prototype.greet = function () { return "你好，" + this.name; };\nconst a = new Student("小明");\nconst b = new Student("小红");\nconsole.log(a.greet());\nconsole.log(b.greet());\nconsole.log(a === b);',
  "你好，小明\n你好，小红\nfalse",
  [
    [
      "function Student(name)",
      "定义初始化逻辑。函数声明本身不会创建学生实例。",
    ],
    [
      'new Student("小明")',
      "创建新对象，把新对象绑定为构造调用的 this，然后写入 name 字段。",
    ],
    [
      "Student.prototype.greet",
      "把可共享的方法放到原型对象上，a 和 b 可以沿原型关系找到它。",
    ],
    ["a.greet()", "以 a 为接收者调用普通函数，this 为 a，因此读取小明。"],
  ],
  "去掉 new 后，普通调用的 this 规则不同；严格模式中 this 为 undefined，写 this.name 会失败。构造函数显式返回另一个对象时，new 的结果可能改为那个对象。",
  "JavaScript 的 new 与 Java 的 new 规则不同。原型关联是对象间的关系，不是 JVM 方法区的内存布局。",
  "创建对象 → 设置原型关联 → 执行初始化 → 得到实例 → 按接收者调用方法。",
  ["javascript-fundamentals-arrows"],
  ["this-receiver"],
  ["pet-garden"],
);
add(
  "javascript-data-strings",
  "字符串与 Unicode：长度不总是可见字符数",
  "可靠地比较和遍历文字，避免把一个表情拆成两半。",
  "一个屏幕上看到的符号，内部可能由多个编码单元组成。显示出来像一个，不代表底层长度一定为一。",
  "JavaScript 字符串不可变，按 UTF-16 编码单元索引。for...of 按 Unicode 码点遍历，但一个用户可见字符也可能包含多个码点。",
  'const text = "A😀";\nconsole.log(text.length);\nconsole.log([...text].length);\nconsole.log(text.toLowerCase());\nconsole.log(text);',
  "3\n2\na😀\nA😀",
  [
    ["text.length", "A 占一个 UTF-16 编码单元，表情占两个，所以长度为 3。"],
    ["[...text]", "使用字符串迭代器按码点展开，本例得到 A 和表情两个元素。"],
    ["text.toLowerCase()", "返回新字符串，不修改原字符串的内容。"],
  ],
  "使用家庭组合表情时，[...text].length 仍可能大于视觉字符数量。按用户可见字符切分时可研究 Intl.Segmenter。",
  '不能用 text[0] = "B" 修改字符串。反转普通英文的算法不能未经说明就宣称支持所有 Unicode 文本。',
  "先确定处理单位：编码单元、码点或用户可见字符，再选择遍历与切分方法。",
  ["javascript-fundamentals-types"],
  ["palindrome"],
  ["word-rain"],
);
add(
  "javascript-data-methods",
  "数组回调：map、filter、reduce 各解决什么",
  "把商品原始数据转成界面需要的列表和总价。",
  "先挑出要买的商品，再计算每件费用，最后累计。每一步有不同职责，不必全塞到一个循环。",
  "回调是作为参数传入、由其他代码调用的函数。filter 根据条件保留元素；map 为每个元素生成结果；reduce 将元素逐步汇总。",
  "const prices = [3, 8, 12];\nconst selected = prices.filter(p => p >= 8);\nconst discounted = selected.map(p => p - 1);\nconst total = discounted.reduce((sum, p) => sum + p, 0);\nconsole.log(JSON.stringify(discounted));\nconsole.log(total);",
  "[7,11]\n18",
  [
    [
      "filter(p => p >= 8)",
      "对 3 返回 false，对 8、12 返回 true，得到 [8,12]。",
    ],
    ["map(p => p - 1)", "依次生成 7 和 11，得到新数组。"],
    [
      "reduce((sum, p) => sum + p, 0)",
      "初始 sum 为 0，先得到 7，再得到 18。初始值让空数组也有明确结果。",
    ],
  ],
  "删除 reduce 的初始值后，空数组调用 reduce 会抛异常。回调没有 return 时，map 会收集 undefined。",
  "这些方法返回新数组不代表深复制元素；元素是对象时仍可能共享对象引用。",
  "筛选决定保留谁 → 映射决定变成什么 → 汇总决定合成什么。",
  ["javascript-fundamentals-arrows"],
  ["map-double", "sum-array"],
);
add(
  "javascript-data-json",
  "JSON：把数据变成可保存的文本",
  "保存设置或发送接口请求时，明确哪些数据可以转成文本。",
  "把对象写成一段约定格式的文字，另一端按同样格式恢复数据，比依赖内存中的对象编号更适合传输。",
  "JSON 是数据交换文本格式。JSON.stringify 生成 JSON 文本；JSON.parse 解析文本生成 JavaScript 值。它不会保存任意对象的所有运行能力。",
  'const settings = { theme: "dark", volume: 0 };\nconst text = JSON.stringify(settings);\nconst restored = JSON.parse(text);\nrestored.volume = 30;\nconsole.log(text);\nconsole.log(settings.volume);\nconsole.log(restored.volume);',
  '{"theme":"dark","volume":0}\n0\n30',
  [
    [
      "JSON.stringify(settings)",
      "读取可序列化数据生成字符串，不把对象真实内存地址写入文本。",
    ],
    ["JSON.parse(text)", "根据文本建立新的普通数据对象。"],
    [
      "restored.volume = 30",
      "修改恢复后的对象，本例原 settings 不会随之改变。",
    ],
  ],
  "settings 加上指向自身的属性时，stringify 会因循环引用失败。函数、undefined、BigInt、日期都有各自限制或转换规则，不能把 JSON 当作通用深复制。",
  "JSON.parse 遇到非法文本会抛异常；解析成功也不表示字段类型和值符合业务要求。",
  "对象数据 → 序列化文本 → 传输或保存 → 解析 → 校验结构和值。",
  ["javascript-objects-new"],
  ["reference-copy"],
);
