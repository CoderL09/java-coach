import type { Course } from "./curriculum";
import type { Language } from "./books";
export function courseForLanguage(
  course: Course | undefined,
  language: Language,
): Course | undefined {
  if (!course) return course;
  if (course.id === "this")
    return {
      ...course,
      definition:
        language === "java"
          ? "Java 的 this 是实例方法或构造器中的当前对象引用。它让同一段实例代码访问这一次操作对象的字段。点号用于访问指定成员。静态方法没有实例 this。"
          : "JavaScript 的 this 是调用时使用的上下文值。对普通函数，它由调用方式等规则确定；箭头函数沿用外层的 this。user.name 先求出 user 的值，再按 name 这个属性键访问属性。",
      challenge:
        language === "java"
          ? {
              question: "Java 的 static 方法能直接使用实例 this 吗？",
              options: [
                "可以，始终关联当前类的某个实例",
                "不可以，静态方法没有实例 this",
              ],
              correct: 1,
              explain:
                "静态方法调用不要求某个实例作为接收者。需要访问实例字段时，必须有明确的对象引用。",
            }
          : course.challenge,
    };
  if (course.id !== "async") return course;
  const step = (
    title: string,
    why: string,
    observe: string,
    line: number,
    tasks: string[],
  ) => ({
    title,
    why,
    observe,
    javaLine: line,
    jsLine: line,
    state: { tasks },
  });
  if (language === "java")
    return {
      ...course,
      problem:
        "先输出 A，再将输出 C 的工作交给异步任务。我们要求 C 完成后才输出 B，该在哪里等待？",
      intuition:
        "把一项工作交给另一个执行者后，当前流程可以继续。若后续工作依赖它完成，就需要一个明确的等待点。",
      definition:
        "CompletableFuture 表示可能稍后完成的计算。这里的 runAsync 提交异步任务，join 等待它完成。提交任务不保证它立即开始执行。",
      steps: [
        step(
          "输出同步起点",
          "主流程先执行输出 A。",
          "此时还未提交异步任务。",
          3,
          ["输出 A"],
        ),
        step(
          "提交异步工作",
          "runAsync 安排输出 C 的任务。开始时机由执行环境调度。",
          "不能从源码位置断言此刻 C 已经输出。",
          4,
          ["任务 C 已提交，是否开始未定"],
        ),
        step(
          "等待任务完成",
          "join 返回之前，这项异步工作必须已经完成。",
          "C 的输出发生在继续输出 B 之前。",
          7,
          ["等待 C 完成", "C 输出并完成"],
        ),
        step(
          "继续主流程",
          "join 正常返回后执行下一条语句。",
          "本例顺序保证为 A、C、B。",
          8,
          ["输出 B", "完整顺序 A → C → B"],
        ),
      ],
      change:
        "删除 done.join() 后，这段代码不再保证 B 与 C 的相对顺序。将输出 B 移到 join 前面，也会改变等待关系。",
      errors:
        "异步不等于必然并行。任务启动时间由执行环境调度。这个时间轴表达顺序保证，不是线程真实耗时图；实验室主线程追踪不包含工作线程的完整状态。",
      challenge: {
        question: "删除 join 后，B 一定在 C 后输出吗？",
        options: ["一定", "不再由这里的代码保证"],
        correct: 1,
        explain:
          "提交任务与等待完成是不同操作。删除等待后，不能继续声称 C 必然早于 B。",
      },
    };
  return {
    ...course,
    problem: "同步语句、Promise 回调和零延迟定时器写在一起时，怎样预测输出？",
    intuition:
      "先完成当前同步工作，再处理微任务，之后才轮到符合条件的定时器任务。登记回调不会中断当前代码。",
    definition:
      "异步让完成处理发生在当前流程之后。微任务是在当前执行栈清空后处理的一类作业。这里 Promise 的 then 回调是微任务，setTimeout 回调属于后续任务。",
    steps: [
      step("输出 A", "先执行当前同步语句。", "输出 A。", 1, ["输出 A"]),
      step(
        "登记定时器",
        "延迟为 0 也不会中断当前同步工作。",
        "T 等待后续任务调度。",
        2,
        ["定时器任务：T"],
      ),
      step(
        "登记 Promise 回调",
        "已完成 Promise 的 then 回调仍安排到之后的微任务处理中。",
        "M 尚未输出。",
        3,
        ["微任务：M", "定时器任务：T"],
      ),
      step("完成同步代码", "继续执行输出 B。", "当前同步输出为 A、B。", 4, [
        "已输出 A、B",
        "待处理 M、T",
      ]),
      step(
        "处理后续回调",
        "当前同步栈清空后先执行 M，再在后续定时器任务执行 T。",
        "最终顺序为 A、B、M、T。",
        3,
        ["A → B → M → T"],
      ),
    ],
    change:
      "删除 Promise 行后，没有 M。把定时器延迟改为 1000，不会阻塞同步 B，也不保证回调恰好在 1000ms 时执行。",
    errors:
      "本课展示限定示例的调度关系。它不是 Node 所有阶段或浏览器渲染队列的完整模型。真实实验室目前不采集完整任务队列。",
  };
}
