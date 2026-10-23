import type { Article } from "./textbook";
export const structuresArticles: Article[] = [];
const j = (body: string, helpers = "") =>
  `public class Main {\n${helpers}\n  public static void main(String[] args) {\n${body
    .split("\n")
    .map((s) => "    " + s)
    .join("\n")}\n  }\n}`;
function pair(
  slugs: [string, string],
  title: string,
  goal: string,
  intuition: string,
  definition: string,
  java: string,
  javascript: string,
  output: string,
  steps: [string, string][],
  change: string,
  errors: string,
  structure: string,
  exercise: string[],
  project: string[],
) {
  for (const [i, language] of (["java", "javascript"] as const).entries())
    structuresArticles.push({
      id: language + "-structures-" + slugs[i],
      language,
      title,
      goal,
      intuition,
      definition,
      code: language === "java" ? java : javascript,
      output,
      reasoning: steps.map(([code, why]) => ({ code, why })),
      change,
      errors,
      structure,
      prerequisite: [
        language === "java" ? "java-objects-class" : "javascript-objects-new",
      ],
      source:
        language === "java"
          ? "https://dev.java/learn/"
          : "https://javascript.info/",
      exercises: exercise,
      projects: project,
    });
}
pair(
  ["cost", "cost"],
  "复杂度：输入变大后，工作量怎样增长",
  "比较逐个查找与直接读取，知道为何不能只凭一次运行毫秒数选算法。",
  "在一排抽屉里逐个找钥匙，最坏情况要查完所有抽屉。若已知道准确抽屉编号，只需打开那一个。",
  "时间复杂度描述基本操作次数随输入规模增长的趋势。O(n) 表示上界按线性规模增长，O(1) 表示在所用模型中不随 n 增长。它不表示一次运行的固定秒数。",
  j(
    "int[] values = {2,4,6,8};\nint checks = 0;\nfor(int value : values) { checks++; if(value == 8) break; }\nSystem.out.println(checks);\nSystem.out.println(values[3]);",
  ),
  "const values=[2,4,6,8];\nlet checks=0;\nfor(const value of values){checks++;if(value===8)break;}\nconsole.log(checks);\nconsole.log(values[3]);",
  "4\n8",
  [
    [
      "checks++",
      "把每次比较显式计数，先观察算法做了多少工作，而不被启动时间掩盖。",
    ],
    [
      "if(value == 8) / if(value===8)",
      "本例目标位于最后，需要比较四次。目标在开头时只比较一次，因此要区分最好与最坏情况。",
    ],
    [
      "values[3]",
      "已知下标时直接读取，不需要先扫描前面元素。本例下标必须有效。",
    ],
  ],
  "把数组长度扩大十倍，并把目标放到末尾，线性扫描比较次数约扩大十倍。连续做两次扫描仍是 O(n)，因为常数因子不改变增长阶。",
  "二分要求适合的有序访问条件。JS 数组底层优化与元素形态会影响常数；不要把任何属性访问都无条件解释成相同物理成本。",
  "定义输入规模 → 选基本操作 → 计数 → 区分情况 → 提炼增长趋势，再用实际测量补充。",
  ["binary-search"],
  ["sorting-race"],
);
pair(
  ["queue", "queue"],
  "队列：为什么最先到的人最先处理",
  "保存待处理任务，并让任务按进入顺序离开。",
  "排队办理业务时，从队尾加入，从队头离开。若每处理一人都搬动整队，维护成本会随人数增加。",
  "队列遵循先进先出。循环队列用数组和头位置、当前大小描述有效区间，利用取余让索引绕回开头，避免每次删除都整体搬移。",
  j(
    "Ring q=new Ring(3);\nq.add(10);q.add(20);\nSystem.out.println(q.poll());\nq.add(30);q.add(40);\nSystem.out.println(q.poll());\nSystem.out.println(q.poll());\nSystem.out.println(q.poll());",
    '  static class Ring {\n    int[] data; int head=0,size=0;\n    Ring(int capacity){data=new int[capacity];}\n    void add(int v){if(size==data.length)throw new IllegalStateException("队列已满");data[(head+size)%data.length]=v;size++;}\n    int poll(){if(size==0)throw new IllegalStateException("队列为空");int v=data[head];head=(head+1)%data.length;size--;return v;}\n  }',
  ),
  'class Ring {\n constructor(capacity){this.data=Array(capacity);this.head=0;this.size=0;}\n add(v){if(this.size===this.data.length)throw Error("队列已满");this.data[(this.head+this.size)%this.data.length]=v;this.size++;}\n poll(){if(this.size===0)throw Error("队列为空");const v=this.data[this.head];this.head=(this.head+1)%this.data.length;this.size--;return v;}\n}\nconst q=new Ring(3);\nq.add(10);q.add(20);console.log(q.poll());\nq.add(30);q.add(40);\nconsole.log(q.poll());console.log(q.poll());console.log(q.poll());',
  "10\n20\n30\n40",
  [
    [
      "head、size",
      "只用 head 无法知道有效元素有多少，因此增加 size；数组中旧数值不必先擦掉，逻辑区间决定哪些位置有效。",
    ],
    [
      "(head+size)%capacity",
      "新元素放在当前有效区间之后。越过数组末尾时，用取余绕回开头。",
    ],
    ["head=(head+1)%capacity", "出队只移动逻辑头，不把剩下元素逐个向前搬。"],
    ["size--", "记录有效元素减少，否则旧位置可能被当作仍在队列中的任务。"],
  ],
  "去掉取余，绕回时会越界或访问错误位置。删除 size--，队列可能错误判断为满。创建容量为 0 的队列应被构造校验拒绝，本例只接受正容量。",
  "容量固定时必须明确满队列策略：拒绝、覆盖、等待或扩容。本例选择抛异常。单线程正确不代表并发安全。",
  "定义队头和有效大小 → 检查空满 → 根据逻辑位置读写 → 更新头与大小。",
  ["sum-array"],
  ["maze-runner"],
);
pair(
  ["tree", "tree"],
  "树与递归：怎样处理数量未知的层级",
  "计算一个层级结构所有节点的值，不把层数写死。",
  "先处理眼前节点，再把左右子结构交给同一套规则。没有子节点时，就不再继续往下。",
  "树由节点与父子关系组成。本例是无环二叉树，每个节点最多两个子节点。递归让同一个方法处理更小的子树，并把返回值组合成当前结果。",
  j(
    "Node root=new Node(1,new Node(2,null,null),new Node(3,null,null));\nSystem.out.println(sum(root));",
    "  static class Node {int value;Node left,right;Node(int v,Node l,Node r){value=v;left=l;right=r;}}\n  static int sum(Node node){if(node==null)return 0;int left=sum(node.left);int right=sum(node.right);return node.value+left+right;}",
  ),
  "function sum(node){\n if(node===null)return 0;\n const left=sum(node.left);\n const right=sum(node.right);\n return node.value+left+right;\n}\nconst root={value:1,left:{value:2,left:null,right:null},right:{value:3,left:null,right:null}};\nconsole.log(sum(root));",
  "6",
  [
    [
      "if(node==null) return 0",
      "空子树没有节点，总和为 0。这既给出正确值，也终止继续访问。",
    ],
    [
      "left=sum(node.left)",
      "先递归计算左子树。当前调用要等待左侧返回，再继续计算右侧。每次调用有自己的局部变量。",
    ],
    [
      "return node.value+left+right",
      "左子树返回 2，右子树返回 3，根节点加上自己的 1 得到 6。",
    ],
  ],
  "删除空节点判断会在访问空子节点时报错。把 return 改为只加左右结果，会漏掉当前节点。交换左右递归不会改变求和结果，但访问顺序改变。",
  "每个节点处理一次，所以时间 O(n)。递归额外空间 O(h)，h 是树高；一条长链可能导致调用栈过深。带环图需要访问标记，不能当树无限递归。",
  "先定义空结构答案 → 递归取得子答案 → 加上当前节点 → 返回组合结果。",
  ["factorial"],
  ["fractal-forest"],
);
pair(
  ["sort", "sorting"],
  "插入排序：从一小段有序开始",
  "把杂乱数字排好，并理解算法怎样从手工整理过程形成。",
  "整理手里的扑克牌时，前面的牌已经有序。拿到下一张，就把更大的牌向右挪，给新牌空出位置。",
  "插入排序维护一个已排序前缀。每轮取下一个元素作为 key，把前缀中比它大的元素向后移动，最后把 key 放入空位。",
  j(
    "int[] input={3,1,2,2};\nSystem.out.println(java.util.Arrays.toString(sort(input)));",
    "  static int[] sort(int[] input){int[] a=input.clone();for(int i=1;i<a.length;i++){int key=a[i],j=i-1;while(j>=0&&a[j]>key){a[j+1]=a[j];j--;}a[j+1]=key;}return a;}",
  ),
  "function sort(input){\n const a=input.slice();\n for(let i=1;i<a.length;i++){\n  const key=a[i];let j=i-1;\n  while(j>=0&&a[j]>key){a[j+1]=a[j];j--;}\n  a[j+1]=key;\n }return a;\n}\nconsole.log(JSON.stringify(sort([3,1,2,2])));",
  "Java：[1, 2, 2, 3]\nJavaScript：[1,2,2,3]",
  [
    [
      "从 i=1 开始",
      "单个元素天然有序。因此先把 a[0] 当作已排序部分，再逐个吸收后续元素。",
    ],
    [
      "key=a[i]",
      "移动元素会覆盖原位置，所以先保存待插入的值。这个变量来自保存数据的实际需要。",
    ],
    [
      "a[j]>key",
      "只移动比 key 大的元素，直到找到插入位置。先检查 j>=0，避免越界。",
    ],
    [
      "a[j+1]=key",
      "循环停止时 j 在插入点前一位，所以空位是 j+1。本例返回复制后的数组，不修改输入。",
    ],
  ],
  "删除 key 的保存，移动后可能丢失待插入值。使用 >= 也能按数值排序，但会移动相等元素，改变稳定性相关行为。",
  "最坏时间 O(n²)，已排序输入比较移动较少。此版本先复制数组，额外空间 O(n)；不能把它说成 O(1) 额外空间。",
  "维护有序前缀 → 保存下一项 → 移开更大的项 → 放回保存值 → 扩大有序范围。",
  ["map-double"],
  ["sorting-race"],
);
pair(
  ["graph", "graph"],
  "广度优先搜索：为什么一层一层能找最少步数",
  "在每条边成本相同的关系图中，找起点到每个点的最少边数。",
  "先看一步能到哪里，再看两步能到哪里。这样第一次找到终点时，还不会漏掉更短的一层。",
  "图由节点和边组成。广度优先搜索用队列按距离层次扩展节点。本例每条边成本为一步，所以首次发现的层数就是最少边数。",
  j(
    "int[][] graph={{1,2},{0,3},{0,3},{1,2}};\nSystem.out.println(java.util.Arrays.toString(distances(graph,0)));",
    "  static int[] distances(int[][] graph,int start){int[] d=new int[graph.length];java.util.Arrays.fill(d,-1);d[start]=0;java.util.ArrayDeque<Integer> queue=new java.util.ArrayDeque<>();queue.add(start);while(!queue.isEmpty()){int u=queue.remove();for(int v:graph[u])if(d[v]==-1){d[v]=d[u]+1;queue.add(v);}}return d;}",
  ),
  "function distances(graph,start){\n const d=Array(graph.length).fill(-1),queue=[start];d[start]=0;\n for(let head=0;head<queue.length;head++){\n  const u=queue[head];\n  for(const v of graph[u])if(d[v]===-1){d[v]=d[u]+1;queue.push(v);}\n }return d;\n}\nconsole.log(JSON.stringify(distances([[1,2],[0,3],[0,3],[1,2]],0)));",
  "Java：[0, 1, 1, 2]\nJavaScript：[0,1,1,2]",
  [
    ["d 初始为 -1", "把未访问与距离 0 区分开。起点自己距离为 0。"],
    [
      "queue 先进先出",
      "前一层先进入队列，因此它们先扩展；下一层不会提前越过前一层。",
    ],
    [
      "d[v]=d[u]+1",
      "从 u 走一条边到 v，步数加一。发现时立即标记，避免多个父节点重复入队。",
    ],
  ],
  "用栈替换队列后，会优先深入一条路，不能沿用“首次到达就是最少步数”的结论。删除访问标记，带环图可能反复进入队列。",
  "边有不同权重时，BFS 的最少边数不一定是最小总费用。需要根据权重条件选择 Dijkstra 等算法。邻接表下时间 O(V+E)，访问数组与队列额外空间 O(V)。",
  "明确每边等成本 → 从起点入队 → 逐层扩展 → 发现即标记 → 记录距离与前驱。",
  ["binary-search"],
  ["maze-runner", "graph-routes"],
);
pair(
  ["dp", "strategies"],
  "动态规划：从最后一步倒推小问题",
  "计算每次走 1 或 2 阶时，走上 n 阶台阶共有多少种走法。",
  "先看最后一次迈了几阶。如果最后一步是 1 阶，之前在 n-1；如果是 2 阶，之前在 n-2。两种情况互不重叠。",
  "动态规划把重复出现的子问题结果保存并复用。状态定义描述子问题，转移关系说明如何组合较小答案，边界决定计算从哪里开始。",
  j(
    "System.out.println(ways(5));",
    '  static int ways(int n){if(n<0||n>40)throw new IllegalArgumentException("n 必须在 0 到 40");if(n==0)return 1;int a=1,b=1;for(int i=2;i<=n;i++){int next=a+b;a=b;b=next;}return b;}',
  ),
  'function ways(n){\n if(n<0||n>40)throw Error("n 必须在 0 到 40");\n if(n===0)return 1;let a=1,b=1;\n for(let i=2;i<=n;i++){const next=a+b;a=b;b=next;}\n return b;\n}\nconsole.log(ways(5));',
  "8",
  [
    [
      "ways(0)=1",
      "这里将“不迈任何一步”定义为一种完成 0 阶的方式，使转移在小输入上也一致。1 阶也只有一种方式。",
    ],
    [
      "next=a+b",
      "两类最后一步的方案数量相加，得到当前阶数答案。a、b 分别保存之前两项。",
    ],
    ["a=b; b=next", "先保存新结果，再移动窗口，避免先覆盖仍要使用的旧值。"],
  ],
  "删掉 next 临时变量，先 a=b 再 b=a+b，会把两个旧状态混淆。直接递归但不缓存会重复计算大量相同子问题。",
  "本例把 n 限制为 0 到 40，使 Java int 与 JS Number 的整数结果都安全。滚动变量把额外存储降为 O(1)，时间仍是 O(n)。",
  "定义状态含义 → 按最后一步分类 → 写边界 → 按依赖顺序计算 → 保存仍需要的旧状态。",
  ["factorial"],
  ["sorting-race"],
);
