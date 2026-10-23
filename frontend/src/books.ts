import { articles } from "./textbook";
export type Language = "java" | "javascript";
export type Knowledge = {
  id: string;
  title: string;
  courseId?: string;
  prerequisites: string[];
};
export type Chapter = {
  id: string;
  title: string;
  description: string;
  topics: Knowledge[];
};
export type Book = {
  language: Language;
  title: string;
  subtitle: string;
  source: string;
  chapters: Chapter[];
};
type Entry = [string, string, string?];
function chapter(
  language: Language,
  id: string,
  title: string,
  description: string,
  entries: Entry[],
): Chapter {
  return {
    id,
    title,
    description,
    topics: entries.map(([slug, name, courseId], i) => ({
      id: `${language}-${id}-${slug}`,
      title: name,
      courseId,
      prerequisites: i ? [`${language}-${id}-${entries[i - 1][0]}`] : [],
    })),
  };
}
const j = (id: string, title: string, description: string, e: Entry[]) =>
  chapter("java", id, title, description, e);
const s = (id: string, title: string, description: string, e: Entry[]) =>
  chapter("javascript", id, title, description, e);
export const books: Record<Language, Book> = {
  java: {
    language: "java",
    title: "Java：从第一行到运行机制",
    subtitle: "语言、对象、算法、源码与后端工程，按前置知识逐层展开。",
    source: "https://dev.java/learn/",
    chapters: [
      j(
        "start",
        "第一篇 · 程序怎样运行",
        "先获得一次可见的运行结果，再理解工具与错误。",
        [
          ["first", "第一次运行与输入输出"],
          ["compile", "源码、编译器与字节码"],
          ["jdk", "JDK、JVM 与运行环境"],
          ["main", "main 入口与代码组织"],
          ["errors", "编译错误与运行错误"],
          ["debug", "断点、单步与变量观察"],
        ],
      ),
      j(
        "basics",
        "第二篇 · 值与控制流程",
        "把具体需求组织成计算、分支、循环和调用。",
        [
          ["variables", "变量、赋值与计算结果", "values"],
          ["types", "基本类型、范围与溢出"],
          ["conversion", "类型转换与运算规则"],
          ["branch", "条件、布尔逻辑与分支"],
          ["loop", "循环、累计与终止条件", "loops"],
          ["method", "方法、参数与返回值", "functions"],
          ["array", "数组、下标与边界", "arrays"],
          ["strings", "字符串、不可变性与比较"],
          ["unicode", "字符、Unicode 与编码"],
        ],
      ),
      j(
        "objects",
        "第三篇 · 对象与程序组织",
        "先理解引用关系，再理解类型、契约与职责。",
        [
          ["reference", "对象、引用与共享修改", "references"],
          ["pass-value", "参数的值传递"],
          ["class", "类、实例与构造器"],
          ["this", "this 与成员访问", "this"],
          ["static", "实例成员与 static"],
          ["access", "public、private 与封装"],
          ["interface", "接口与实现"],
          ["inheritance", "继承、多态与动态分派"],
          ["composition", "组合、依赖与职责"],
          ["record", "枚举、record 与模式匹配"],
        ],
      ),
      j(
        "structures",
        "第四篇 · 数据结构与算法",
        "每种结构都从它解决的问题开始，再手写实现。",
        [
          ["cost", "时间与空间复杂度"],
          ["dynamic-array", "动态数组与扩容"],
          ["linked", "节点、链表与反转", "linked"],
          ["stack", "栈与撤销操作", "stack"],
          ["queue", "队列与循环队列"],
          ["hash", "映射、哈希表与冲突", "hash"],
          ["recursion", "递归与调用栈", "recursion"],
          ["tree", "树、二叉树与遍历"],
          ["heap", "堆与优先队列"],
          ["graph", "图、广度与深度优先搜索"],
          ["binary", "二分查找与区间", "binary"],
          ["sort", "排序、比较与稳定性"],
          ["backtrack", "回溯与搜索空间"],
          ["greedy", "贪心与选择依据"],
          ["dp", "动态规划、状态与转移"],
        ],
      ),
      j(
        "library",
        "第五篇 · 核心库与源码",
        "沿一个具体行为追踪调用路径，并实现受限版本。",
        [
          ["generics", "泛型、边界与类型擦除"],
          ["equals", "equals、hashCode 与对象身份"],
          ["collections", "集合接口与选型"],
          ["arraylist", "ArrayList 扩容源码"],
          ["hashmap", "HashMap 查找与扩容源码"],
          ["exceptions", "异常传播与资源关闭"],
          ["io", "文件、流与缓冲"],
          ["time", "日期、时间与时区"],
          ["lambda", "Lambda 与捕获的局部状态", "scope"],
          ["stream", "Stream、惰性与归约"],
          ["annotation", "注解与反射"],
          ["modules", "包、模块与依赖边界"],
        ],
      ),
      j(
        "runtime",
        "第六篇 · 并发与 JVM",
        "用真实观测与受限实验理解执行机制。",
        [
          ["thread", "线程、任务与生命周期"],
          ["shared", "共享状态与竞态条件"],
          ["visibility", "可见性、原子性与有序性"],
          ["locks", "锁、同步与等待"],
          ["pool", "线程池、队列与拒绝策略"],
          ["future", "异步结果与等待", "async"],
          ["bytecode", "字节码、局部变量表与操作数栈"],
          ["loading", "类加载、链接与初始化"],
          ["memory", "栈帧、堆与类元数据"],
          ["gc", "可达性、垃圾回收与引用"],
          ["jit", "解释执行、JIT 与优化"],
          ["profile", "JFR、性能分析与故障定位"],
        ],
      ),
      j(
        "backend",
        "第七篇 · 后端工程",
        "让界面操作真正连接到服务、数据与错误处理。",
        [
          ["maven", "Maven 生命周期与依赖"],
          ["testing", "单元测试、集成测试与边界"],
          ["http", "HTTP、接口与状态码"],
          ["mysql", "MySQL、SQL 与索引"],
          ["transaction", "事务、隔离与并发修改"],
          ["jdbc", "JDBC 与连接池"],
          ["mybatis", "MyBatis 映射与动态 SQL"],
          ["spring", "Spring 容器与依赖注入"],
          ["boot", "Spring Boot 与接口服务"],
          ["redis", "Redis、缓存与会话"],
          ["security", "身份、权限与输入校验"],
          ["operations", "配置、日志、部署与恢复"],
        ],
      ),
      j(
        "systems",
        "第八篇 · 手写机制与复杂系统",
        "在约束下实现、测量、解释取舍。",
        [
          ["containers", "手写容器与迭代器"],
          ["cache", "手写有界缓存"],
          ["executor", "手写简化线程池"],
          ["ioc", "手写简化依赖容器"],
          ["vm", "教学解释器与对象模型"],
          ["cloud", "Spring Cloud 与服务通信"],
          ["resilience", "超时、重试、幂等与恢复"],
          ["observe", "指标、追踪与压测"],
          ["design", "系统边界、设计与取舍"],
        ],
      ),
    ],
  },
  javascript: {
    language: "javascript",
    title: "JavaScript：让代码与页面一起动起来",
    subtitle:
      "参考现代 JavaScript 教程的知识结构，连接浏览器、Vue 与可视化作品。",
    source: "https://javascript.info/",
    chapters: [
      s(
        "fundamentals",
        "第一部分 · 语言基础",
        "从可见的值开始，理解执行顺序。",
        [
          ["first", "运行环境、控制台与第一行代码"],
          ["strict", "代码结构与严格模式"],
          ["variables", "let、const 与赋值", "values"],
          ["types", "数据类型与特殊值"],
          ["conversion", "类型转换与相等判断"],
          ["operators", "运算符、逻辑与空值合并"],
          ["branch", "条件分支与 switch"],
          ["loop", "循环与终止条件", "loops"],
          ["functions", "函数、参数与返回值", "functions"],
          ["arrows", "函数表达式与箭头函数"],
        ],
      ),
      s("objects", "对象与引用", "理解变量、身份、属性和调用关系。", [
        ["reference", "对象、引用与复制", "references"],
        ["gc", "可达性与垃圾回收"],
        ["this", "对象方法、this 与点号", "this"],
        ["new", "构造函数与 new"],
        ["optional", "可选链与缺失属性"],
        ["symbol", "Symbol 与属性键"],
        ["primitive", "对象到原始值的转换"],
      ]),
      s("data", "数据类型与结构", "从数组与字符串连接到常用数据结构。", [
        ["numbers", "Number、精度与 BigInt"],
        ["strings", "字符串、Unicode 与不可变性"],
        ["arrays", "数组、下标与更新", "arrays"],
        ["methods", "数组方法与回调"],
        ["iterable", "可迭代对象与迭代器"],
        ["map", "Map、Set 与键值关联", "hash"],
        ["weak", "WeakMap 与 WeakSet"],
        ["destructure", "解构、剩余与展开"],
        ["json", "JSON 与序列化"],
        ["date", "日期与时间"],
      ]),
      s("functions", "函数进阶", "通过调用与作用域理解闭包和绑定。", [
        ["recursion", "递归、调用栈与返回", "recursion"],
        ["scope", "词法作用域与闭包", "scope"],
        ["var", "var、提升与全局对象"],
        ["function-object", "函数对象与命名表达式"],
        ["scheduling", "定时器与调度"],
        ["call", "call、apply 与参数转发"],
        ["bind", "bind 与函数绑定"],
        ["arrow-this", "箭头函数的词法 this"],
      ]),
      s("prototype", "属性、原型与类", "区分属性查找、原型关系与实例状态。", [
        ["descriptor", "属性描述符与访问器"],
        ["prototype", "原型链与属性查找"],
        ["constructor", "构造函数与 prototype"],
        ["class", "class 与实例方法"],
        ["extends", "继承、super 与静态成员"],
        ["private", "私有字段与封装"],
        ["instanceof", "instanceof 与类型判断"],
      ]),
      s("async", "异常、异步与模块", "明确当前执行、后续处理与模块边界。", [
        ["errors", "try/catch 与自定义错误"],
        ["callback", "回调与结果传递"],
        ["promise", "Promise 状态与链"],
        ["microtask", "微任务、任务与执行顺序", "async"],
        ["await", "async/await 与错误传播"],
        ["generator", "生成器与异步迭代"],
        ["modules", "模块、import 与 export"],
        ["dynamic", "动态导入与按需加载"],
      ]),
      s(
        "structures",
        "把基础变成数据结构与算法",
        "用 JavaScript 独立实现并验证，按需对照 Java。",
        [
          ["cost", "复杂度、输入规模与测量"],
          ["linked", "链表、引用与反转", "linked"],
          ["stack", "栈与撤销", "stack"],
          ["queue", "队列与广度优先搜索"],
          ["tree", "树、堆与遍历"],
          ["graph", "图与路径搜索"],
          ["binary", "二分查找与边界", "binary"],
          ["sorting", "排序与比较规则"],
          ["strategies", "回溯、贪心与动态规划"],
        ],
      ),
      s("document", "第二部分 · 浏览器与文档", "把数据变化连接到真实页面。", [
        ["dom", "DOM 树、节点与浏览器环境"],
        ["query", "查找、遍历与修改节点"],
        ["attributes", "属性、特性与样式"],
        ["layout", "尺寸、滚动与坐标"],
        ["events", "事件、冒泡与捕获"],
        ["delegation", "事件委托与默认行为"],
        ["pointer", "键盘、指针与拖动"],
        ["forms", "表单、焦点与输入"],
        ["loading", "文档、脚本与资源加载"],
        ["loop", "浏览器事件循环与渲染"],
      ]),
      s(
        "web",
        "第三部分 · 网络与扩展专题",
        "以实际作品学习浏览器能力与边界。",
        [
          ["fetch", "Fetch、请求与取消"],
          ["cors", "跨源请求与凭据"],
          ["realtime", "WebSocket 与服务端事件"],
          ["storage", "Cookie、Storage 与 IndexedDB"],
          ["binary", "二进制数据、文件与 Blob"],
          ["regex", "正则表达式与回溯"],
          ["animation", "动画、时间与绘制"],
          ["components", "Web Components 与 Shadow DOM"],
          ["proxy", "Proxy、Reflect 与代理行为"],
        ],
      ),
      s(
        "vue",
        "Vue 专篇 · 从使用到实现",
        "先完成可见作品，再拆解响应式和渲染。",
        [
          ["first", "组件、模板与第一个交互"],
          ["state", "ref、reactive 与状态"],
          ["derived", "computed、watch 与副作用"],
          ["communication", "props、事件与插槽"],
          ["lifecycle", "生命周期与资源清理"],
          ["routing", "路由、状态管理与请求"],
          ["reactivity", "手写依赖收集与触发"],
          ["render", "虚拟节点、更新与渲染"],
          ["scheduler", "更新队列与 nextTick"],
          ["engineering", "测试、可访问性与性能"],
        ],
      ),
    ],
  },
};
for (const book of Object.values(books)) {
  for (const chapter of book.chapters)
    for (const topic of chapter.topics) {
      if (articles.some((a) => a.id === topic.id)) topic.courseId = topic.id;
    }
}
export function readyTopics(language: Language) {
  return books[language].chapters
    .flatMap((c) => c.topics)
    .filter((t) => t.courseId);
}
export function courseLink(courseId: string, language: Language) {
  return `${articles.some((a) => a.id === courseId) ? "/read/" : "/learn/"}${courseId}?language=${language}`;
}
export function prerequisitesFor(courseId: string, language: Language) {
  return (
    books[language].chapters
      .flatMap((c) => c.topics)
      .find((t) => t.courseId === courseId)?.prerequisites || []
  );
}
