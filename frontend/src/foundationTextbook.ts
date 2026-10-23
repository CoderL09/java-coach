import type { Article } from "./textbook";
export const foundationArticles: Article[] = [];
const main = (body: string, helpers = "") =>
  `public class Main {\n${helpers}\n  public static void main(String[] args) {\n${body
    .split("\n")
    .map((s) => "    " + s)
    .join("\n")}\n  }\n}`;
function add(
  id: string,
  title: string,
  goal: string,
  intuition: string,
  definition: string,
  code: string,
  output: string,
  steps: [string, string][],
  change: string,
  errors: string,
  structure: string,
  prerequisite: string[],
  exercises: string[] = [],
) {
  foundationArticles.push({
    id,
    language: id.startsWith("java-") ? "java" : "javascript",
    title,
    goal,
    intuition,
    definition,
    code,
    output,
    reasoning: steps.map(([code, why]) => ({ code, why })),
    change,
    errors,
    structure,
    prerequisite,
    source: id.startsWith("java-")
      ? "https://dev.java/learn/"
      : "https://javascript.info/",
    exercises,
    projects: [],
  });
}
add(
  "java-start-debug",
  "单步调试：执行前与执行后",
  "明确高亮行尚未执行还是已经执行，避免把旧值误读为错误。",
  "停在一道门前，说明接下来要经过它。调试器停在语句前时，变量显示的仍然是上一步的状态。",
  "暂停点是程序暂时停止的位置。本实验室采集普通源码行执行前的状态，再按顺序回放。上一步是查看旧快照，不是让程序真实倒着运行。",
  main("int total = 2;\ntotal += 3;\nSystem.out.println(total);"),
  "5",
  [
    [
      "int total = 2;",
      "第一次停在这一行前，total 尚未完成初始化。到下一行的暂停点，才能观察本次赋值留下的值。",
    ],
    ["total += 3;", "执行前 total 为 2。继续到输出行前，total 已为 5。"],
    [
      "System.out.println(total);",
      "执行前已经可以观察 total=5；整次输出属于整个程序运行结果，不自动等同当前回放位置。",
    ],
  ],
  "在 total += 3 后再加一次赋值，比较每个暂停点的值。删除加法行，输出会变为 2。",
  "同一行可能有多个操作，源码行暂停不能保证暴露每条字节码的中间状态。异常暂停与普通执行前暂停也不同。",
  "先确认暂停语义 → 看当前变量 → 预测下一行 → 单步 → 对照变化。",
  ["java-start-errors"],
  ["ticket-total"],
);
add(
  "java-basics-unicode",
  "char 与 Unicode：一个字符为什么可能占两格",
  "遍历含有表情的文字时，避免把它拆坏。",
  "屏幕上看到的一个符号，不一定只需要一个内部编码单元。显示单位和存储单位要分开。",
  "Java String 使用 UTF-16 的抽象编码单元序列。char 表示一个 16 位编码单元。某些 Unicode 码点需要两个 char，用户可见字符还可能由多个码点组成。",
  main(
    'String text = "A😀";\nSystem.out.println(text.length());\nSystem.out.println(text.codePointCount(0, text.length()));\nSystem.out.println(text.codePointAt(1));',
  ),
  "3\n2\n128512",
  [
    ["text.length()", "返回 UTF-16 编码单元数量：A 一个，表情两个，共三个。"],
    [
      "codePointCount(...)",
      "本例按码点计数得到两个，但不是通用的视觉字符数量。",
    ],
    ["codePointAt(1)", "从索引 1 处读取完整表情码点，得到十进制编号 128512。"],
  ],
  "把文本改为组合重音或家庭表情，码点数量仍可能多于视觉字符。只用 charAt 对字符串反转，可能拆开代理项对。",
  "字符编码、文件编码和字体显示是相关但不同的问题。写入文件时仍需明确 UTF-8 等编码。",
  "明确单位：char 编码单元 → Unicode 码点 → 用户可见字符，再选择算法。",
  ["java-basics-strings"],
  ["palindrome"],
);
add(
  "java-objects-interface",
  "接口：共同能力不需要共同身份",
  "让机器人和动物都能报告声音，而不强迫它们共享同一父类。",
  "狗是动物，机器人不是。但两者都可以发声。共同能力可以单独成为一个约定。",
  "接口声明一组能力。类通过 implements 承诺实现这些能力。接口变量可以引用实现了该接口的对象，实例方法仍根据实际对象选择实现。",
  main(
    "Speaker first = new Dog();\nSpeaker second = new Robot();\nSystem.out.println(first.speak());\nSystem.out.println(second.speak());",
    '  interface Speaker { String speak(); }\n  static class Dog implements Speaker { public String speak(){return "汪";} }\n  static class Robot implements Speaker { public String speak(){return "你好";} }',
  ),
  "汪\n你好",
  [
    [
      "interface Speaker",
      "声明调用者可以依赖的 speak 方法，不要求所有实现都是同一种动物。",
    ],
    [
      "implements Speaker",
      "具体类承诺提供兼容的实现。接口中的该方法隐含 public，类实现时不能缩小访问权限。",
    ],
    [
      "Speaker first = new Dog()",
      "变量按能力约定使用对象；调用时仍进入实际 Dog 的实现。",
    ],
  ],
  "删除 Robot.speak 且保持 Robot 为具体类，无法通过编译。实现类可以实现多个接口，但 Java 类不能同时 extends 多个类。",
  "接口也可以包含 default、static 等成员，本例先研究抽象实例方法。是否用接口取决于真实职责，不必为每个类机械增加接口。",
  "先找调用者需要的能力 → 声明接口 → 各实现提供行为 → 调用者依赖约定。",
  ["java-objects-class"],
  ["polymorphism"],
);
add(
  "java-objects-composition",
  "组合：让对象使用另一个对象的能力",
  "给角色更换移动方式，而不是不断创建不同继承层级。",
  "人可以使用自行车移动，但人不是自行车。把能使用的部件放进对象，关系会更贴合实际。",
  "组合让一个对象保存并使用另一个对象。依赖是完成工作所需要的能力。构造参数可以把所需依赖传进来，减少对象内部固定创建具体实现。",
  main(
    "Player player = new Player(new Walk());\nSystem.out.println(player.move());",
    '  interface Movement { String move(); }\n  static class Walk implements Movement { public String move(){return "步行";} }\n  static class Player {\n    private final Movement movement;\n    Player(Movement movement){this.movement=movement;}\n    String move(){return movement.move();}\n  }',
  ),
  "步行",
  [
    [
      "Player(Movement movement)",
      "外部传入移动能力。Player 不必知道所有具体移动方式。",
    ],
    ["this.movement=movement", "对象保存依赖引用，后续使用同一个部件。"],
    ["movement.move()", "将具体移动工作交给部件实现，Player 负责组织调用。"],
  ],
  "增加 Fly implements Movement，将 new Walk() 换成 new Fly()，无需修改 Player 的移动入口。传 null 会在使用时失败，可在构造时拒绝。",
  "组合不意味着所有关系都应绕一层。先判断是“是一种”还是“使用一个”，再决定类型组织。",
  "定义职责 → 传入所需能力 → 保存依赖 → 委托具体工作。",
  ["java-objects-interface"],
);
add(
  "java-objects-record",
  "record 与枚举：表达有限选择和一组数据",
  "明确任务状态的有限取值，并让坐标作为值使用。",
  "任务状态只能是待做、完成等有限选项。坐标则是 x、y 组成的数据，不需要手写所有读取和比较方法。",
  "enum 声明有限的具名实例。record 声明以组件组成的数据载体，自动提供组件访问器、equals、hashCode 和 toString 等；组件引用不可重新赋值，但不自动保证引用对象深度不可变。",
  main(
    "Point a = new Point(2, 3);\nPoint b = new Point(2, 3);\nStatus status = Status.DONE;\nSystem.out.println(a.equals(b));\nSystem.out.println(a.x());\nSystem.out.println(status);",
    "  record Point(int x, int y) {}\n  enum Status { TODO, DONE }",
  ),
  "true\n2\nDONE",
  [
    [
      "record Point(int x, int y)",
      "声明两个组件。本例相等性来自组件值，而不是必须同一个对象。",
    ],
    ["a.equals(b)", "不同 Point 对象的组件都相同，因此 equals 为 true。"],
    ["Status.DONE", "从明确列出的状态中选择一个，不使用任意字符串拼写状态。"],
  ],
  "把 Point 的一个组件改成可变 List，该列表仍可能被外部修改。可以在构造时防御性复制，但这需要明确的设计。",
  "record 适合数据表达，不是所有实体的替代。枚举的 name、展示文案和数据库存储值也应区分，避免重命名造成持久化兼容问题。",
  "有限选择用枚举表达；一组值的相等性与访问用 record 表达；另外检查可变性边界。",
  ["java-objects-class"],
);
add(
  "javascript-objects-optional",
  "可选链：缺失一层时停止读取",
  "在用户还没填写地址时显示默认城市，而不是让页面报错。",
  "需要先找到用户，再找到地址，最后才能读取城市。中途没有对象时，就不能继续沿路径读取。",
  "可选链 ?. 在左侧为 null 或 undefined 时停止这段链并返回 undefined。它不会把所有错误都吞掉，也不能代替变量声明。",
  'const user = {name:"小明"};\nconst city = user.address?.city ?? "尚未填写";\nconsole.log(city);\nuser.address = {city:"杭州"};\nconsole.log(user.address?.city ?? "尚未填写");',
  "尚未填写\n杭州",
  [
    [
      "user.address?.city",
      "先读取 address。缺失时得到 undefined，可选链停止后续 city 读取。",
    ],
    [
      '?? "尚未填写"',
      "仅在 null 或 undefined 时提供默认值，合法空字符串不会被自动替换。",
    ],
    [
      "user.address = ...",
      "对象内部新增地址，之后再次读取才能得到新结果。之前保存的 city 字符串不会自动更新。",
    ],
  ],
  "删除 ?.，第一次读取会对 undefined 访问 city，从而抛异常。用括号切断连续链后，再访问后续成员也可能报错。",
  "unknownUser?.name 仍要求 unknownUser 这个变量可被解析。可选调用 obj.fn?.() 也不保证一个非函数值可以调用。",
  "沿对象路径逐层读取 → 对允许缺失的位置使用 ?. → 明确最终缺失时的默认行为。",
  ["javascript-fundamentals-operators"],
);
add(
  "javascript-functions-call",
  "call 与 apply：明确提供 this",
  "复用同一个普通函数，让它分别读取不同对象的数据。",
  "同一套读取规则可以作用于不同资料。函数代码不需要复制，但每次必须知道本次使用哪份对象。",
  "普通函数的 this 与调用方式有关。call 显式提供 this 和逐个参数；apply 显式提供 this 和一个参数列表。它们不会永久改变函数的后续调用规则。",
  '"use strict";\nfunction describe(prefix) { return prefix + this.name; }\nconst user = {name:"小明"};\nconsole.log(describe.call(user,"你好，"));\nconsole.log(describe.apply({name:"小红"},["欢迎，"]));',
  "你好，小明\n欢迎，小红",
  [
    [
      "function describe(prefix)",
      "定义普通函数。定义时还没有确定未来每次普通调用的 this。",
    ],
    [
      "describe.call(user,...)",
      "本次调用中将 this 指定为 user，prefix 接收第二个实参。",
    ],
    [
      "describe.apply(...,[...])",
      "参数从数组形式的列表传入，this 由第一个实参指定。",
    ],
  ],
  '将 describe 改为箭头函数，call 不会替换其词法 this。直接 describe("你好，") 在本例严格普通调用中 this 为 undefined。',
  "显式传 null 或 undefined 在严格与非严格函数中有差异。本例使用严格模式，不用“this 总是某个对象”概括所有情况。",
  "区分函数定义和调用 → 选定本次 this → 按参数位置传值 → 执行读取。",
  ["javascript-objects-new"],
  ["this-receiver"],
);
add(
  "javascript-functions-bind",
  "bind：创建带有固定接收者的新函数",
  "把对象方法交给别处调用时，保留预期的接收者。",
  "把方法单独拿出来传递时，原来的点号调用关系可能丢失。bind 提前记住希望使用的接收者。",
  "bind 返回一个新函数，保存本次绑定的 this 与可选的前置参数。普通调用这个新函数时，使用保存的接收者。原函数本身不会因此被改写。",
  '"use strict";\nconst user={name:"小明",read(){return this.name;}};\nconst bound=user.read.bind(user);\nconsole.log(bound());\nconsole.log(bound.call({name:"小红"}));',
  "小明\n小明",
  [
    [
      "user.read.bind(user)",
      "创建新的绑定函数，并保存 user 作为接收者。没有立即调用 read。",
    ],
    ["bound()", "即使没有 user. 这个调用形式，也能使用已保存的 user。"],
    ["bound.call(...)", "普通调用绑定函数时，call 无法替换它已经绑定的 this。"],
  ],
  "把 const bound 改成 user.read，直接调用时将失去对象接收者，本例严格模式下读取 this.name 会失败。",
  "bind 返回的新函数具有不同身份。事件监听注册了 bound 后，移除时需要同一份函数引用，不能重新 bind 一次来移除。",
  "需要保留接收者时创建绑定函数 → 保存它 → 用同一引用传递和清理。",
  ["javascript-functions-call"],
  ["this-receiver"],
);
add(
  "javascript-functions-arrow-this",
  "箭头函数：this 来自外层哪一次调用",
  "让内部回调读取所属对象，而不是被新的普通调用改变 this。",
  "内部操作继续沿用外层已经确定的对象，比再次根据回调的调用形式猜测更稳定。",
  "箭头函数没有自己的 this 绑定，会沿外层词法环境读取 this。读取到哪个值，要看外层调用如何建立 this；不是笼统的“永远指向定义它的对象”。",
  '"use strict";\nconst user={name:"小明",makeReader(){return ()=>this.name;}};\nconst read=user.makeReader();\nconsole.log(read());\nconsole.log(read.call({name:"小红"}));',
  "小明\n小明",
  [
    ["user.makeReader()", "这次普通方法调用使 makeReader 内的 this 为 user。"],
    [
      "return ()=>this.name",
      "创建箭头函数，保留访问外层 this 的能力。返回时还没有读取 name。",
    ],
    [
      "read.call(...)",
      "箭头函数不会因为 call 的参数建立自己的 this，因此仍读取外层 user。",
    ],
  ],
  "把 makeReader 本身改为箭头函数，它就不会通过 user.makeReader() 获得 user 作为自己的 this。之后的行为由更外层环境决定。",
  "箭头函数不能用 new 调用，也没有自己的 arguments。需要独立动态接收者的方法，应选择合适的普通函数形式。",
  "先找到包住箭头函数的外层环境 → 确认那个环境的 this → 箭头调用时沿用它。",
  ["javascript-functions-call"],
  ["this-receiver"],
);
add(
  "javascript-prototype-prototype",
  "原型链：对象没有这个属性时去哪里找",
  "让多个对象共享方法，同时保留自己的数据。",
  "先查自己的资料夹，找不到再按关联查公共资料。公共资料不用为每个人复制一份。",
  "对象可以关联一个原型对象。读取属性时先检查自身，再沿原型链查找，直到找到或到达 null。原型链与变量作用域链是不同关系。",
  'const animal={speak(){return this.name+" 发声";}};\nconst dog=Object.create(animal);\ndog.name="小黑";\nconsole.log(dog.speak());\nconsole.log(Object.hasOwn(dog,"speak"));\nconsole.log(Object.getPrototypeOf(dog)===animal);',
  "小黑 发声\nfalse\ntrue",
  [
    [
      "Object.create(animal)",
      "创建一个新对象，并把它的原型关联为 animal；没有复制 animal 的全部属性。",
    ],
    [
      "dog.speak()",
      "dog 自身找不到 speak，沿原型找到函数。调用的接收者仍是 dog，所以 this.name 读取 dog 的 name。",
    ],
    ["Object.hasOwn(...)", "只检查自身属性，因此 speak 为 false。"],
  ],
  "给 dog.speak 单独赋值后，它会遮蔽原型同名属性。删除自身 speak 后，又能沿原型找到共享方法。",
  "不要用 Java 的类内存模型解释 JavaScript 原型链。共享原型中的可变对象属性还可能造成多实例共享修改。",
  "自身查找 → 原型查找 → 保留原调用接收者 → 找不到则得到 undefined。",
  ["javascript-objects-new"],
  ["this-receiver"],
);
add(
  "javascript-prototype-class",
  "class：把构造和实例方法组织在一起",
  "创建多个计数器，每个有自己的值，共享同一套增加方法。",
  "每个计数器保存自己的数字，但增加规则不需要为每个实例重复定义。",
  "class 是 JavaScript 基于原型机制的类语法。constructor 负责构造初始化。普通实例方法放在原型对象上；实例字段保存在实例中。类体中的代码使用严格模式。",
  "class Counter {\n  constructor(start){this.value=start;}\n  increment(){this.value++;return this.value;}\n}\nconst a=new Counter(0);\nconst b=new Counter(10);\nconsole.log(a.increment());\nconsole.log(b.increment());\nconsole.log(a.increment===b.increment);",
  "1\n11\ntrue",
  [
    [
      "constructor(start)",
      "new 调用时对新实例初始化 value。a 与 b 拥有各自的 value。",
    ],
    [
      "increment()",
      "本例普通方法位于 Counter.prototype 上，两实例可以共享函数。",
    ],
    [
      "a.increment===b.increment",
      "读取到同一个原型方法函数，因此为 true；调用接收者仍然可以不同。",
    ],
  ],
  "将方法写成实例箭头字段，每个实例通常会创建自己的函数，身份比较不同。直接 Counter(0) 无法像普通函数一样调用 class。",
  "方法单独取出调用时不会自动永久绑定实例。class 语法相似不代表 JavaScript 具有 Java 的静态变量类型检查。",
  "构造初始化实例字段 → 原型共享方法 → 调用时用接收者决定 this。",
  ["javascript-prototype-prototype"],
  ["this-receiver"],
);
add(
  "javascript-async-promise",
  "Promise：把稍后结果连接成一条处理链",
  "在结果尚未准备好时，先写好成功与失败的后续处理。",
  "取餐后给你一个取餐凭证。凭证不是餐本身，但可以约定餐做好后怎么处理。这个比喻不代表操作一定在新线程执行。",
  "Promise 表示一次异步操作的最终完成或失败。状态从 pending 转为 fulfilled 或 rejected 后不会再次改变。then 返回新的 Promise，用来传递后续结果。",
  'console.log("开始");\nPromise.resolve(3)\n  .then(value=>value*2)\n  .then(value=>console.log(value));\nconsole.log("结束");',
  "开始\n结束\n6",
  [
    ["Promise.resolve(3)", "创建一个以 3 完成的 Promise。它本身不是数字 3。"],
    [
      "then(value=>value*2)",
      "注册后续处理。回调通过 Promise 任务机制稍后执行，其返回值用于完成下一个 Promise。",
    ],
    ['console.log("结束")', "当前同步代码继续执行，不会等待 then 回调。"],
  ],
  '在第一个 then 中加 throw Error("失败")，后续成功回调会被跳过，错误沿链传播到 catch。删除 value*2 的 return 会让下一步收到 undefined。',
  "Promise 构造函数中的 executor 同步执行；then 回调稍后执行。不要把所有包在 Promise 中的代码都称为异步线程。",
  "当前注册处理链 → 同步代码结束 → 按顺序处理结果或传播错误。",
  ["javascript-fundamentals-arrows"],
);
add(
  "javascript-async-await",
  "async/await：暂停当前异步函数，不暂停整个程序",
  "让多步异步处理更接近顺序表达，同时知道等待期间谁还能运行。",
  "正在等一份结果的任务可以先暂停，其他任务仍然可以继续。暂停一个任务不等于整个环境停止。",
  "async 函数总是返回 Promise。await 等待可等待值的完成，并把当前 async 函数的后续部分安排为稍后继续；调用者的同步代码仍会继续。",
  'async function run(){\n  console.log("A");\n  const value=await Promise.resolve(3);\n  console.log("B",value);\n}\nrun();\nconsole.log("C");',
  "A\nC\nB 3",
  [
    ["run()", "进入 async 函数，先同步执行到第一个 await，所以 A 先输出。"],
    [
      "await Promise.resolve(3)",
      "即使 Promise 已经完成，后续继续执行仍通过相应异步处理安排。当前函数在此让出执行机会。",
    ],
    ['console.log("C")', "调用者继续，因此 C 先于 B 输出。"],
  ],
  "删除 await，value 变成 Promise 对象，而不是完成后的 3。把 Promise 换成拒绝，await 会以抛出异常的方式报告，可用 try/catch 捕获。",
  "不要在需要并行的多个独立请求中无意逐个 await。也不要忘记处理顶层返回 Promise 的拒绝。",
  "async 返回 Promise → await 暂停当前函数后续 → 调用者继续 → 完成后恢复或抛错。",
  ["javascript-async-promise"],
);
add(
  "javascript-data-destructure",
  "解构与展开：复制了哪一层",
  "方便地取出对象属性，并知道浅复制后哪些数据仍然共享。",
  "复制一张目录并不会复制目录指向的所有文件。展开对象复制属性值；若属性值是引用，引用关系仍然保留。",
  "解构从结构中取值并创建或赋值给绑定。对象展开复制自身可枚举属性的值到新对象；它是浅复制，不递归复制所有嵌套对象。",
  'const original={name:"小明",settings:{theme:"dark"}};\nconst {name}=original;\nconst copy={...original};\ncopy.settings.theme="light";\ncopy.name="小红";\nconsole.log(name);\nconsole.log(original.name);\nconsole.log(original.settings.theme);',
  "小明\n小明\nlight",
  [
    [
      "const {name}=original",
      "读取当时的 name 值，创建独立的绑定。之后 original.name 改变不会自动重新给 name 赋值。",
    ],
    [
      "const copy={...original}",
      "创建新对象，复制 name 字符串和 settings 引用。",
    ],
    [
      'copy.settings.theme="light"',
      "copy 与 original 仍引用同一个 settings 对象，因此修改可从两边观察到。",
    ],
  ],
  "使用 settings:{...original.settings} 为这一层创建新对象后，本例 theme 修改才会分离。更深层仍需分别考虑。",
  "数组展开也只浅复制。浅复制不是错误，是否需要共享还是复制应依据业务目标决定。",
  "先看复制边界 → 区分原始值与引用值 → 沿引用检查共享修改。",
  ["javascript-objects-new"],
  ["reference-copy"],
);
