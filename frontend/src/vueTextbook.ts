import type { Article } from "./textbook";
export const vueArticles: Article[] = [];
function lesson(
  slug: string,
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
  prerequisite: string[],
) {
  vueArticles.push({
    id: "javascript-vue-" + slug,
    language: "javascript",
    environment: "browser",
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
    source: "https://vuejs.org/guide/",
    exercises: [],
    projects: ["pixel-board"],
  });
}
lesson(
  "first",
  "Vue 第一个交互：数据怎样变成页面",
  "让按钮上的数字随点击变化，不用每次手动查找并改写节点。",
  "先描述“数字显示 count”，再改变 count。Vue 负责把状态变化同步到依赖它的画面。",
  "组件把状态、行为和显示规则组织在一起。模板描述显示内容。Vue 读取响应式状态，首次渲染页面，并在状态变化后安排更新。本页浏览器演示预置 Vue 3 全局对象和 #app 容器。",
  `const { createApp, ref } = Vue;
createApp({
  setup() {
    const count = ref(0);
    function increment() { count.value++; }
    return { count, increment };
  },
  template: '<button @click="increment">点了 {{ count }} 次</button>'
}).mount('#app');`,
  "初始按钮显示：点了 0 次。每次点击增加 1。",
  [
    [
      "ref(0)",
      "创建一个响应式引用，初始值为 0。在 JavaScript 中通过 .value 读取和修改。",
    ],
    [
      "return { count, increment }",
      "将状态与行为暴露给模板使用。没有返回的 setup 局部变量不会自动提供给模板。",
    ],
    [
      '@click="increment"',
      "把点击事件连接到函数。模板中 {{ count }} 会自动解包这里顶层的 ref。",
    ],
    [
      "mount('#app')",
      "找到容器并启动组件渲染。定义组件对象还没有把它显示出来。",
    ],
  ],
  "将 count.value++ 改成 count++，会试图重新给 const 绑定赋值并报错。将 ref(0) 改为普通对象且未使用响应式包装，Vue 不会因普通赋值自动安排更新。",
  "模板插值用于显示文本，不应将用户输入直接当模板执行。这个演示中的模板由课程提供，用户数据应作为状态传入。",
  "准备状态 → 暴露给模板 → 将事件连接到行为 → 行为修改状态 → Vue 更新画面。",
  ["javascript-fundamentals-arrows"],
);
lesson(
  "state",
  "ref 与 reactive：保存哪一种状态",
  "管理玩家分数和位置，并知道什么时候要使用 .value。",
  "单个分数可以放进一个响应式盒子；一组相关属性可以通过一个对象统一管理。这里的盒子只是接口比喻。",
  "ref 通过 .value 提供响应式值。reactive 返回普通对象的响应式代理，代理能拦截属性读写。使用代理才会经过这条跟踪路径。",
  `const { createApp, ref, reactive } = Vue;
createApp({
 setup() {
   const score = ref(0);
   const player = reactive({ x: 0, y: 0 });
   function move() { player.x++; score.value += 10; }
   return { score, player, move };
 },
 template: '<div><p>分数 {{score}} · 位置 {{player.x}}, {{player.y}}</p><button @click="move">向右一步</button></div>'
}).mount('#app');`,
  "每次点击，x 增加 1，分数增加 10。",
  [
    [
      "const player = reactive(...)",
      "得到代理对象。读写 player.x 会经过代理。",
    ],
    ["player.x++", "更新对象属性，不需要写 player.value。"],
    [
      "score.value += 10",
      "score 是 ref，脚本中通过 .value 修改值。模板中的顶层 score 自动解包。",
    ],
  ],
  "将 const { x } = player 加入 setup 后，x 只是本次解构得到的数字。后续 player.x 改变不会自动重写这个局部数字；可用 toRef 保持属性关联。",
  "直接替换整个 reactive 代理变量可能断开已有消费者与旧代理的关联。区分替换对象与修改对象字段。",
  "单个值优先清晰地使用 ref；相关对象属性用 reactive；始终明确修改的是哪个响应式入口。",
  ["javascript-vue-first"],
);
lesson(
  "derived",
  "computed 与 watch：结果和动作分开",
  "自动显示购物总价，并在数量变化时记录一次通知。",
  "总价可以从数量与单价算出，不需要另存一份再手动同步。通知则是变化后要做的动作。",
  "computed 表示由其他状态计算出的派生值，会缓存依赖未变时的结果。watch 观察指定来源，变化时执行回调，适合副作用，例如发请求或记录日志。",
  `const { createApp, ref, computed, watch } = Vue;
createApp({
 setup() {
   const count = ref(1);
   const total = computed(() => count.value * 12);
   const note = ref('还没有修改');
   watch(count, (now, old) => { note.value = old + ' → ' + now; });
   return { count, total, note };
 },
 template: '<div><button @click="count++">加一张票</button><p>总价 {{total}} 元</p><small>{{note}}</small></div>'
}).mount('#app');`,
  "初始总价 12；点击后总价 24，并显示 1 → 2。",
  [
    [
      "computed(() => count.value * 12)",
      "首次读取时计算，并跟踪 count。count 变化后，下一次读取会获得更新结果。",
    ],
    [
      "watch(count, ...)",
      "直接观察 ref。回调得到新值与旧值。默认不会因为注册监听就立即执行。",
    ],
    ["note.value = ...", "这是变化之后更新提示的动作；它与总价计算分开。"],
  ],
  "给 watch 加 { immediate: true } 会在注册时先调用一次，首次旧值可能是 undefined。computed 内不要修改 count，否则计算结果的过程也会改变输入。",
  "watch(() => player.x, callback) 监听 reactive 属性；直接传 player.x 得到的是当前数字，不是可跟踪的来源。",
  "可从现有状态推导的结果用 computed；需要执行动作时，再选择合适的 watch 来源。",
  ["javascript-vue-state"],
);
lesson(
  "communication",
  "props 与事件：让组件协作",
  "把计分按钮封装成子组件，同时让父组件保留分数管理权。",
  "父组件告诉按钮显示几分。按钮报告“用户要求加分”，由父组件决定如何修改。",
  "props 是父组件传给子组件的输入。组件事件是子组件向外报告的行为。顶层 prop 是只读输入，不应直接在子组件里赋值。插槽让父组件提供子组件中的一段显示内容。",
  String.raw`const { createApp, ref } = Vue;
const ScoreButton = {
 props: { score: Number },
 emits: ['increase'],
 template: '<button @click="$emit(\'increase\')"><slot></slot> {{score}}</button>'
};
createApp({
 components: { ScoreButton },
 setup() { const score=ref(0); return {score}; },
 template: '<ScoreButton :score="score" @increase="score++">我的分数</ScoreButton>'
}).mount('#app');`,
  "子按钮显示父组件的分数；点击后父组件更新，再传回新分数。",
  [
    [
      "props: { score: Number }",
      "声明子组件接收的输入。输入来源是父组件的绑定。",
    ],
    ["emits: ['increase']", "声明子组件会发出的事件，帮助明确组件接口。"],
    ['@increase="score++"', "父组件处理子组件的请求并修改自己的状态。"],
    ["<slot></slot>", "在这个位置显示父组件传入的内容“我的分数”。"],
  ],
  "直接在子组件对 score 赋值会违反单向数据流并触发开发警告。移除父组件的事件处理，按钮还能发事件，但分数不会改变。",
  "props 的只读约束是浅层的。传入对象时，子组件仍可能修改对象内部数据；应约定通过事件请求更改，避免隐藏耦合。",
  "父传输入 → 子展示并报告事件 → 父更新状态 → 新输入流回子组件。",
  ["javascript-vue-state"],
);
lesson(
  "lifecycle",
  "生命周期：什么时候启动，什么时候清理",
  "进入页面后启动计时器，离开组件时停止它。",
  "打开水龙头之后需要关上。组件申请计时器、监听器或连接后，也需要确定释放位置。",
  "生命周期是组件从创建、挂载、更新到卸载的一组阶段。onMounted 在挂载后运行；onUnmounted 用于卸载时清理外部资源。",
  `const { createApp, ref, onMounted, onUnmounted } = Vue;
const Timer = {
 setup() {
   const seconds=ref(0); let timer;
   onMounted(()=>{timer=setInterval(()=>seconds.value++,1000);});
   onUnmounted(()=>clearInterval(timer));
   return {seconds};
 }, template:'<p>已经运行 {{seconds}} 秒</p>'
};
createApp({components:{Timer},setup(){return {show:ref(true)};},template:'<button @click="show=!show">显示 / 卸载计时器</button><Timer v-if="show" />'}).mount('#app');`,
  "显示时每秒增加；卸载后停止；重新显示会创建新的计时器组件。",
  [
    ["onMounted(...)", "等组件完成挂载，再启动与它相关的计时任务。"],
    ["onUnmounted(...)", "组件卸载时清理计时器，避免它在界面消失后继续工作。"],
    [
      'v-if="show"',
      "false 时卸载组件，不只是把它藏起来。重新为 true 时创建新实例。",
    ],
  ],
  "将 v-if 改为 v-show，组件仅切换显示样式，计时器不会因此卸载。删除清理语句，旧计时器可能继续运行并保留相关状态。",
  "生命周期注册函数应在 setup 的同步调用过程中注册。只在页面上看不到某个元素，不代表对应组件已经释放。",
  "申请资源时，同时确定拥有者和清理时机；组件卸载就释放属于它的资源。",
  ["javascript-vue-first"],
);
lesson(
  "routing",
  "路由、共享状态与请求：分别负责什么",
  "切换两个界面，同时保留它们共享的计分状态。",
  "页面地址决定你看到哪一页，共享状态决定多页共同使用的数据，请求负责与服务交换数据。三者职责不同。",
  "客户端路由根据地址选择组件。状态管理负责共享数据与更新入口。请求负责异步获取外部结果。本例用两个按钮模拟页面选择，先观察共享状态；它不是完整路由库实现。",
  String.raw`const { createApp, ref } = Vue;
const sharedScore=ref(0);
createApp({
 setup(){const page=ref('home');return {page,sharedScore};},
 template:'<nav><button @click="page=\'home\'">首页</button><button @click="page=\'score\'">分数页</button></nav><div v-if="page===\'home\'"><h2>训练首页</h2><button @click="sharedScore++">完成一次训练</button></div><p v-else>当前分数 {{sharedScore}}</p>'
}).mount('#app');`,
  "在首页加分，再切到分数页，读取同一份共享分数。",
  [
    [
      "const sharedScore=ref(0)",
      "状态定义在应用组件外，本例切换显示时保留它。SSR 服务端不能把每个用户私有状态简单放成跨请求全局变量。",
    ],
    [
      "const page=ref(...)",
      "只决定当前显示哪个部分。本例没有同步 URL 和浏览历史。",
    ],
    ["v-if / v-else", "根据页面选择显示不同内容，共享分数不需要复制两份。"],
  ],
  "完整应用用 Vue Router 管理 URL、前进后退与组件匹配。请求需要加载、成功、失败、取消等状态；路由切换时还应防止旧请求覆盖新页面。",
  "这个演示只演示职责分离，不声称实现路由库或后端。持久化到本地或服务端也不是 ref 自动完成的。",
  "地址选择页面；共享状态保留跨页面数据；请求将服务结果写入状态；界面从状态渲染。",
  ["javascript-vue-state"],
);
lesson(
  "reactivity",
  "手写响应式：谁读取了这个属性",
  "理解为什么修改一个属性后，只有依赖它的显示需要重新计算。",
  "给每个属性记录“谁用过我”。修改这个属性时，再通知这些使用者。",
  "依赖是一次计算读取的状态。依赖收集记录属性与计算的关系。触发更新在属性改变时重新执行相关计算。本例只有单属性、单订阅者，用于看清机制，不是完整 Vue 实现。",
  `const root=document.querySelector('#app');
root.innerHTML='<button id="add">增加</button><p id="out"></p>';
let subscriber=null;
const state=new Proxy({count:0},{
 get(target,key){return Reflect.get(target,key);},
 set(target,key,value){const old=target[key];Reflect.set(target,key,value);if(old!==value&&subscriber)subscriber();return true;}
});
function render(){document.querySelector('#out').textContent='计数 '+state.count;}
subscriber=render;
document.querySelector('#add').onclick=()=>state.count++;
render();`,
  "点击后代理拦截写入，再执行 render 更新文本。",
  [
    [
      "new Proxy(...)",
      "通过代理拦截属性操作。原始对象本身没有自动获得这些拦截行为。",
    ],
    [
      "subscriber=render",
      "本例手动登记唯一的依赖。真正的依赖收集会在读取时按对象和属性登记当前 effect。",
    ],
    [
      "set(target,key,value)",
      "先更新原对象，再比较新旧值，最后通知登记的计算。",
    ],
  ],
  "直接修改原始对象会绕过代理。扩展为多个属性时，需要为每个属性建立订阅集合；否则任何写入都会通知全部计算。",
  "此模型不支持嵌套 effect、清理分支依赖、集合、批处理或递归防护，不可替代 Vue。真正的 Vue 响应式还需要处理这些边界。",
  "读取时记录使用者 → 写入时找到使用者 → 安排其重新执行。这个演示先手动登记，用来隔离理解通知过程。",
  ["javascript-vue-state"],
);
lesson(
  "render",
  "渲染：描述界面与修改节点的边界",
  "看懂模板之外，Vue 怎样接受一份界面描述并把它显示出来。",
  "先列出“要有一个按钮，按钮上显示几次”，再由渲染器完成节点创建和更新。",
  "虚拟节点是描述界面节点的 JavaScript 对象。h 创建虚拟节点；渲染器将描述应用到真实 DOM。更新时不等于每次销毁整页。",
  `const {createApp,ref,h}=Vue;
createApp({
 setup(){
   const count=ref(0);
   return ()=>h('button',{onClick:()=>count.value++},'点击 '+count.value+' 次');
 }
}).mount('#app');`,
  "按钮每次点击后显示新的次数。",
  [
    ["return ()=>h(...)", "setup 返回一个渲染函数。Vue 在需要渲染时执行它。"],
    [
      "h('button',...)",
      "创建按钮的虚拟节点描述。这个调用本身不是 document.createElement。",
    ],
    [
      "count.value",
      "渲染期间读取状态，建立更新依赖。状态改变后 Vue 安排新的渲染。",
    ],
  ],
  "将 count.value 的读取移到 setup 的一次性文本计算里，返回的渲染函数若只读取旧文本，就不会获得新的数字。",
  "列表更新还需要稳定的 key 来表达身份。虚拟 DOM 不保证所有情况下比手写 DOM 更快；其价值包括声明式组织与更新管理。",
  "状态 → 渲染函数 → 虚拟节点 → 渲染器 → 真实 DOM。更新时重新描述，再按规则应用差异。",
  ["javascript-vue-state"],
);
lesson(
  "scheduler",
  "nextTick：状态已经变了，DOM 为什么还是旧的",
  "在修改状态后，准确读取已经更新的页面内容。",
  "把多次改动合并后再刷新画面，可以减少重复工作。因此数据变化与 DOM 更新不一定发生在同一瞬间。",
  "Vue 会缓冲 DOM 更新，并在下一轮更新刷新中批量执行。nextTick 让代码等待当前已安排的 DOM 更新完成；它不代表等待所有网络或计时器。",
  `const {createApp,ref,nextTick}=Vue;
createApp({
 setup(){
   const count=ref(0),log=ref('');
   async function add(){count.value++;const before=document.querySelector('#value').textContent;await nextTick();const after=document.querySelector('#value').textContent;log.value='等待前：'+before+'；等待后：'+after;}
   return {count,log,add};
 },template:'<button @click="add">增加并读取节点</button><p id="value">{{count}}</p><small>{{log}}</small>'
}).mount('#app');`,
  "第一次点击后记录：等待前：0；等待后：1。",
  [
    ["count.value++", "响应式状态立即改变，并安排相关组件更新。"],
    [
      "const before=...",
      "当前同步代码还没让出执行机会，DOM 仍可能显示上次渲染的内容。",
    ],
    ["await nextTick()", "等待 Vue 已安排的更新刷新，再读取节点文本。"],
  ],
  "删除 await nextTick()，两次同步读取可能都是旧值。连续修改三次状态，界面通常合并到一次刷新，不保证显示每个中间值。",
  "不要用固定 setTimeout 毫秒数代替准确等待更新。nextTick 也不能保证浏览器已经完成实际绘制或某个图片资源已经加载。",
  "修改状态 → 安排刷新 → 同步代码结束 → 刷新 DOM → nextTick 后读取。",
  ["javascript-vue-state"],
);
lesson(
  "engineering",
  "验证一个组件：行为、可访问性与资源",
  "让按钮能被键盘使用，列表有稳定身份，错误有清楚反馈。",
  "一个看起来能点的区域，不一定能被键盘或读屏正确使用。需要检查真实操作，而不只检查截图。",
  "组件测试观察输入、交互和可见结果。可访问性让不同输入与感知方式的用户能使用同一功能。性能分析要测量真实瓶颈，再决定优化。",
  String.raw`const {createApp,ref}=Vue;
createApp({
 setup(){const tasks=ref([{id:1,text:'读懂输入'},{id:2,text:'检查边界'}]);function remove(id){tasks.value=tasks.value.filter(t=>t.id!==id);}return {tasks,remove};},
 template:'<h2>训练清单</h2><p role="status">还剩 {{tasks.length}} 项</p><ul><li v-for="task in tasks" :key="task.id">{{task.text}} <button @click="remove(task.id)" :aria-label="\'完成：\'+task.text">完成</button></li></ul>'
}).mount('#app');`,
  "点击完成后，目标任务消失，剩余数量更新。按钮可用 Tab 聚焦、Enter 激活。",
  [
    [
      ':key="task.id"',
      "使用稳定身份匹配列表项。删除一项后，其余项的身份没有因下标移动而改变。",
    ],
    ["<button>", "使用原生按钮获得基本键盘与语义能力，不用普通 div 模拟按钮。"],
    [
      'role="status"',
      "数量变化可以作为状态信息被辅助技术感知，不强制抢走用户焦点。",
    ],
  ],
  "用数组下标作有状态列表的 key，删除或重排后可能错误复用局部状态。删除 aria-label 后，多个同名“完成”按钮更难区分目标。",
  "先验证核心行为、空列表、键盘、焦点和清理，再测量大列表更新。不要用动画和复杂缓存掩盖错误行为。",
  "明确用户目标 → 执行真实操作 → 检查可见结果与边界 → 测量后再优化。",
  ["javascript-vue-communication", "javascript-vue-lifecycle"],
);
