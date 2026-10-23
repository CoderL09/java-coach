export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  prerequisites: string[];
  stages: { title: string; task: string; acceptance: string }[];
  core: string;
  starter: string;
  engine: string;
  body: string;
  tests: { args: unknown[]; expected: unknown }[];
  source: string;
};
export const projects: Project[] = [];
function add(
  id: string,
  title: string,
  category: string,
  description: string,
  prerequisites: string[],
  body: string,
  core: string,
  starter: string,
  engine: string,
  tests: Project["tests"],
  tasks: [string, string, string][],
) {
  projects.push({
    id,
    title,
    category,
    description,
    prerequisites,
    body,
    core,
    starter,
    engine,
    tests,
    stages: tasks.map(([title, task, acceptance]) => ({
      title,
      task,
      acceptance,
    })),
    source: "本站原创代码与图形，无外部素材。",
  });
}
add(
  "particle-field",
  "磁力星尘：让鼠标牵引粒子",
  "创意视觉",
  "移动指针，吸引一片星尘；点击切换排斥。",
  ["arrays", "functions"],
  `<canvas width="640" height="440"></canvas><p>移动指针牵引 · 点击切换吸引 / 排斥</p>`,
  `function transform(position,target,strength){return (target-position)*strength;}`,
  `function transform(position,target,strength){\n  // 返回朝目标方向的加速度。\n  return 0;\n}`,
  `const c=document.querySelector('canvas'),x=c.getContext('2d');let target={x:320,y:220},sign=1,last=0;const particles=Array.from({length:120},()=>({x:Math.random()*640,y:Math.random()*440,vx:0,vy:0}));c.onpointermove=e=>{const r=c.getBoundingClientRect();target={x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*440/r.height};};c.onclick=()=>sign=-sign;function frame(t){let dt=last?Math.min((t-last)/16.667,2):1;last=t;x.fillStyle='rgba(12,25,39,.18)';x.fillRect(0,0,640,440);for(const p of particles){p.vx=(p.vx+transform(p.x,target.x,.0008*sign)*dt)*.98;p.vy=(p.vy+transform(p.y,target.y,.0008*sign)*dt)*.98;p.x=(p.x+p.vx*dt+640)%640;p.y=(p.y+p.vy*dt+440)%440;x.beginPath();x.fillStyle='#81eac6';x.arc(p.x,p.y,2,0,Math.PI*2);x.fill();}requestAnimationFrame(frame);}requestAnimationFrame(frame);`,
  [
    { args: [0, 10, 0.1], expected: 1 },
    { args: [10, 0, 0.1], expected: -1 },
    { args: [5, 5, 0.1], expected: 0 },
  ],
  [
    [
      "决定运动方向",
      "计算目标与当前位置的差，再乘强度。",
      "目标在左侧、右侧、当前位置时的加速度正确。",
    ],
    [
      "连接位置与速度",
      "阅读外壳中速度累加和阻尼的位置，改变强度观察轨迹。",
      "粒子会追踪指针，点击后远离指针。",
    ],
    [
      "让画面保持稳定",
      "解释帧间隔上限、粒子数量和边界环绕。",
      "切出页面再回来不会出现无限跳跃，保存个人代码。",
    ],
  ],
);
add(
  "word-rain",
  "单词雨：把输入变成得分",
  "小游戏",
  "输入落下的单词，在它落地前拦截。",
  ["javascript-data-strings", "javascript-fundamentals-branch"],
  `<div id="sky" class="word-sky"></div><div class="tools"><input id="typing" autocomplete="off" placeholder="输入单词并按回车"><button id="restart">重新开始</button><span id="score"></span></div>`,
  `function transform(input,target){return input.trim().toLowerCase()===target.toLowerCase();}`,
  `function transform(input,target){\n  // 忽略首尾空格与大小写，比较内容。\n  return false;\n}`,
  `let score=0,miss=0,words=[],last=0,tick=0;const sky=document.querySelector('#sky'),input=document.querySelector('#typing');const pool=['java','vue','stack','array','hello','class','return'];function draw(){sky.replaceChildren(...words.map(w=>{const el=document.createElement('span');el.textContent=w.text;el.style.left=w.x+'%';el.style.top=w.y+'px';return el;}));document.querySelector('#score').textContent='得分 '+score+' · 漏掉 '+miss;}function reset(){score=0;miss=0;words=[{text:'hello',x:30,y:15}];tick=0;input.value='';draw();}input.onkeydown=e=>{if(e.key==='Enter'){const i=words.findIndex(w=>transform(input.value,w.text));if(i>=0){words.splice(i,1);score++;}input.value='';draw();}};document.querySelector('#restart').onclick=reset;function frame(t){const dt=last?Math.min(t-last,80):0;last=t;tick+=dt;if(tick>2200){tick=0;words.push({text:pool[Math.floor(Math.random()*pool.length)],x:5+Math.random()*70,y:0});}words.forEach(w=>w.y+=dt*.025);const n=words.length;words=words.filter(w=>w.y<330);miss+=n-words.length;draw();requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);`,
  [
    { args: [" JAVA ", "java"], expected: true },
    { args: ["vue", "java"], expected: false },
    { args: ["", "java"], expected: false },
  ],
  [
    [
      "写出匹配规则",
      "去掉首尾空格，将两边转换为同一大小写再比较。",
      "三组字符串测试通过。",
    ],
    [
      "把输入接到事件",
      "阅读回车事件如何查找命中的单词，修改得分。",
      "输入正确单词后消失并得分，错误输入不计分。",
    ],
    [
      "完成自己的关卡",
      "调整词库并研究下落速度与生成间隔。",
      "能够重新开始，保存实现并恢复继续玩。",
    ],
  ],
);
add(
  "pet-garden",
  "电子宠物花园：照顾一个小世界",
  "小游戏",
  "喂食、散步与休息，让宠物状态保持平衡。",
  ["java-objects-class", "javascript-objects-new"],
  `<div class="pet"><div id="face">(•ᴥ•)</div><p id="mood"></p><div id="meters"></div></div><div class="tools"><button data-action="feed">喂食</button><button data-action="play">散步</button><button data-action="rest">休息</button><button id="reset">重置</button></div>`,
  `function transform(state,action){const next={...state};if(action==='feed')next.food=Math.min(100,next.food+20);if(action==='play'){next.fun=Math.min(100,next.fun+20);next.energy=Math.max(0,next.energy-15);}if(action==='rest')next.energy=Math.min(100,next.energy+25);return next;}`,
  `function transform(state,action){\n  // 返回新状态。所有数值保持在 0 到 100。\n  return {...state};\n}`,
  `let state={food:45,fun:30,energy:70};function draw(){document.querySelector('#meters').innerHTML='';for(const k of ['food','fun','energy']){const row=document.createElement('div');row.textContent=({food:'饱腹',fun:'快乐',energy:'体力'})[k]+' '+state[k];const m=document.createElement('progress');m.max=100;m.value=state[k];row.append(m);document.querySelector('#meters').append(row);}document.querySelector('#mood').textContent=state.fun>=70?'今天真开心！':state.energy<25?'有点累，想休息':'陪我出去走走吧';document.querySelector('#face').style.transform='translateY('+(-state.fun/15)+'px)';}document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{state=transform(state,b.dataset.action);draw();});document.querySelector('#reset').onclick=()=>{state={food:45,fun:30,energy:70};draw();};draw();`,
  [
    {
      args: [{ food: 95, fun: 30, energy: 70 }, "feed"],
      expected: { food: 100, fun: 30, energy: 70 },
    },
    {
      args: [{ food: 40, fun: 90, energy: 5 }, "play"],
      expected: { food: 40, fun: 100, energy: 0 },
    },
    {
      args: [{ food: 40, fun: 30, energy: 90 }, "rest"],
      expected: { food: 40, fun: 30, energy: 100 },
    },
  ],
  [
    [
      "实现一个动作",
      "喂食增加 20 点饱腹，上限 100；返回新对象。",
      "连续喂食不会超过上限。",
    ],
    [
      "组织状态变化",
      "散步增加 20 快乐、消耗 15 体力；休息恢复 25 体力。",
      "边界测试通过，体力不能变成负数。",
    ],
    [
      "让状态影响画面",
      "观察不同状态怎样改变表情位置、文字和进度条。",
      "独立实现三种动作，并保存个人版本。",
    ],
  ],
);
add(
  "step-sequencer",
  "八步节拍机：写出自己的循环",
  "音乐声音",
  "点亮音符格子，组合四个声部的循环节奏。",
  ["arrays", "loops"],
  `<div class="tools"><button id="play">播放节奏</button><button id="clear">清空</button><label>速度 <input id="tempo" type="range" min="80" max="240" value="140"></label></div><div id="notes" class="notes"></div><p>需要先点击播放，浏览器才会允许发声。</p>`,
  `function transform(frequency,enabled){return enabled?frequency:0;}`,
  `function transform(frequency,enabled){\n  // 未启用的格子应返回 0，表示静音。\n  return 0;\n}`,
  `let pattern=Array.from({length:4},(_,r)=>Array.from({length:8},(_,s)=>(s+r*2)%4===0)),step=0,playing=false,timer,audio;const root=document.querySelector('#notes');function draw(){root.replaceChildren(...pattern.flatMap((row,r)=>row.map((on,s)=>{const b=document.createElement('button');b.style.background=on?'#70e5bd':'#203748';b.style.outline=s===step?'2px solid #ffd082':'none';b.setAttribute('aria-label','声部 '+r+' 拍 '+s);b.onclick=()=>{pattern[r][s]=!on;draw();};return b;})));}function beat(){if(!playing)return;pattern.forEach((row,r)=>{const f=transform([220,277.18,329.63,440][r],row[step]);if(f>0){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.17);}});draw();step=(step+1)%8;timer=setTimeout(beat,60000/Number(document.querySelector('#tempo').value)/2);}document.querySelector('#play').onclick=async()=>{if(!audio)audio=new AudioContext();await audio.resume();playing=!playing;clearTimeout(timer);document.querySelector('#play').textContent=playing?'暂停':'播放节奏';if(playing)beat();};document.querySelector('#clear').onclick=()=>{pattern.forEach(r=>r.fill(false));draw();};draw();`,
  [
    { args: [440, true], expected: 440 },
    { args: [440, false], expected: 0 },
  ],
  [
    [
      "让开关决定声音",
      "启用时返回频率，关闭时返回 0。",
      "启用与静音两组测试通过。",
    ],
    [
      "组织二维节拍",
      "理解行表示声部、列表示时间位置。",
      "能分别启用四个声部，清空后无声音。",
    ],
    [
      "编排自己的循环",
      "研究速度参数与每步间隔，再创作八步节奏。",
      "暂停会停止调度，保存自己的规则实现。",
    ],
  ],
);
add(
  "maze-runner",
  "迷宫导航：让程序找到出口",
  "算法互动",
  "画下障碍，让广度优先搜索找到最短路线。",
  ["arrays", "loops", "functions"],
  `<div class="tools"><button id="run">寻找最短路线</button><button id="clear">清除障碍</button><span id="info">点击格子放置障碍</span></div><div id="grid" class="maze"></div>`,
  `function transform(width,height,walls,start,goal){const blocked=new Set(walls),queue=[start],prev=new Map([[start,-1]]);for(let head=0;head<queue.length;head++){const n=queue[head];if(n===goal){const path=[];for(let p=n;p!==-1;p=prev.get(p))path.push(p);return path.reverse();}const x=n%width,y=Math.floor(n/width);for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,m=ny*width+nx;if(nx<0||nx>=width||ny<0||ny>=height||blocked.has(m)||prev.has(m))continue;prev.set(m,n);queue.push(m);}}return [];}`,
  `function transform(width,height,walls,start,goal){\n  // 用队列逐层搜索，记录前驱，再还原路径。\n  return [];\n}`,
  `let walls=new Set([17,29,41,53,65,77,89]),path=[];const g=document.querySelector('#grid');function draw(){g.replaceChildren(...Array.from({length:144},(_,i)=>{const b=document.createElement('button');b.style.background=i===0?'#70e5bd':i===143?'#ffd082':walls.has(i)?'#66758b':path.includes(i)?'#8bbaff':'#142a39';b.textContent=i===0?'起':i===143?'终':'';b.onclick=()=>{if(i===0||i===143)return;walls.has(i)?walls.delete(i):walls.add(i);path=[];draw();};return b;}));}document.querySelector('#run').onclick=()=>{path=transform(12,12,[...walls],0,143);document.querySelector('#info').textContent=path.length?'最短路线 '+(path.length-1)+' 步':'无法到达';draw();};document.querySelector('#clear').onclick=()=>{walls.clear();path=[];draw();};draw();`,
  [
    { args: [2, 2, [], 0, 3], expected: [0, 1, 3] },
    { args: [2, 2, [1, 2], 0, 3], expected: [] },
    { args: [1, 1, [], 0, 0], expected: [0] },
  ],
  [
    [
      "组织搜索队列",
      "用队列保存待探索位置，记录已访问位置与前驱。",
      "起点就是终点时返回单个位置。",
    ],
    [
      "扩展与边界",
      "按右、下、左、上扩展，排除越界、障碍和已访问位置。",
      "无法到达时返回空路径，不能左右穿行换行。",
    ],
    [
      "还原最短路线",
      "沿前驱从终点回到起点，再反转得到行走顺序。",
      "显示最短路径，并能解释首次到达为什么步数最少。",
    ],
  ],
);
add(
  "graph-routes",
  "城市路网：距离怎样传遍地图",
  "算法互动",
  "改变道路费用，观察最短距离如何重新分配。",
  ["hash", "arrays", "loops"],
  `<canvas width="640" height="390"></canvas><div class="tools"><label>道路 A—C 费用 <input id="weight" type="range" min="1" max="15" value="8"></label><button id="run">重新规划</button></div><p id="info"></p>`,
  `function transform(n,edges,start){const d=Array(n).fill(null),done=new Set();d[start]=0;for(let k=0;k<n;k++){let u=-1;for(let i=0;i<n;i++)if(!done.has(i)&&d[i]!==null&&(u===-1||d[i]<d[u]))u=i;if(u===-1)break;done.add(u);for(const [a,b,w] of edges){const v=a===u?b:b===u?a:-1;if(v>=0&&(d[v]===null||d[u]+w<d[v]))d[v]=d[u]+w;}}return d;}`,
  `function transform(n,edges,start){\n  // 非负权无向图。不可达位置保留 null。\n  return Array(n).fill(null);\n}`,
  `const c=document.querySelector('canvas'),x=c.getContext('2d'),pos=[[90,195],[240,70],[260,310],[450,100],[550,290]],base=[[0,1,3],[0,2,8],[1,2,2],[1,3,6],[2,4,4],[3,4,1]];let dist=[];function draw(){const edges=base.map(e=>e.slice());edges[1][2]=Number(document.querySelector('#weight').value);dist=transform(5,edges,0);x.clearRect(0,0,640,390);x.textAlign='center';x.font='15px sans-serif';for(const[a,b,w]of edges){x.beginPath();x.strokeStyle='#53718b';x.moveTo(...pos[a]);x.lineTo(...pos[b]);x.stroke();x.fillStyle='#ffd082';x.fillText(w,(pos[a][0]+pos[b][0])/2,(pos[a][1]+pos[b][1])/2-8);}pos.forEach((p,i)=>{x.beginPath();x.fillStyle=i===0?'#70e5bd':'#8bbaff';x.arc(...p,25,0,Math.PI*2);x.fill();x.fillStyle='#0c1927';x.fillText(String.fromCharCode(65+i),p[0],p[1]+5);x.fillStyle='#ddefff';x.fillText('距离 '+(dist[i]??'∞'),p[0],p[1]+49);});document.querySelector('#info').textContent='从 A 出发，各节点距离：'+JSON.stringify(dist);}document.querySelector('#run').onclick=draw;document.querySelector('#weight').oninput=draw;draw();`,
  [
    {
      args: [
        3,
        [
          [0, 1, 2],
          [1, 2, 3],
          [0, 2, 9],
        ],
        0,
      ],
      expected: [0, 2, 5],
    },
    { args: [3, [[0, 1, 2]], 0], expected: [0, 2, null] },
  ],
  [
    [
      "表示道路与距离",
      "用边数组存两端节点及非负费用，起点距离为 0。",
      "不可达节点保留 null，起点保持 0。",
    ],
    [
      "选出当前最近节点",
      "在未处理节点中选择距离最小者，再尝试更新邻居。",
      "三节点测试发现经过中间节点的更短路径。",
    ],
    [
      "改变权重并重算",
      "明确非负权是这里算法成立的条件。",
      "移动道路费用后距离正确更新，保存个人实现。",
    ],
  ],
);
add(
  "pixel-board",
  "像素涂鸦与时间倒流",
  "创作工具",
  "点亮格子画一只小怪兽，再撤销每一步。",
  ["javascript-fundamentals-branch", "arrays"],
  `<div class="tools"><input id="color" type="color" value="#70e5bd"><button id="undo">撤销</button><button id="clear">清空</button></div><div id="grid" class="pixels"></div>`,
  `function transform(cells,index,color){ const next=cells.slice(); next[index]=color; return next; }`,
  `function transform(cells,index,color){\n  // 返回修改后的新数组，保留原数组。\n  return cells;\n}`,
  `let cells=Array(256).fill('#142a39'),history=[];const grid=document.querySelector('#grid');function draw(){grid.replaceChildren(...cells.map((c,i)=>{const b=document.createElement('button');b.style.background=c;b.setAttribute('aria-label','像素 '+i);b.onclick=()=>{history.push(cells);cells=transform(cells,i,document.querySelector('#color').value);draw();};return b;}));}document.querySelector('#undo').onclick=()=>{if(history.length)cells=history.pop();draw();};document.querySelector('#clear').onclick=()=>{history.push(cells);cells=Array(256).fill('#142a39');draw();};[82,85,98,101,114,115,116,117,129,130,131,132,133,134,145,150].forEach(i=>cells[i]='#70e5bd');draw();`,
  [
    { args: [["a", "b"], 1, "x"], expected: ["a", "x"] },
    { args: [["a"], 0, "y"], expected: ["y"] },
  ],
  [
    [
      "让一个像素变色",
      "实现 transform：复制输入数组，再按下标写入颜色。",
      "点第一个和最后一个格子，只有目标格子改变。",
    ],
    [
      "保留每一帧",
      "理解外壳的 history.push，验证函数不能修改旧数组。",
      "画两格后撤销两次，原图完整恢复。",
    ],
    [
      "完成一幅作品",
      "用至少三种颜色绘制图案，保存个人代码版本。",
      "重新进入项目，恢复自己的版本并继续绘制。",
    ],
  ],
);
add(
  "life-grid",
  "生命游戏：让简单规则长出世界",
  "模拟世界",
  "放下细胞，观察滑翔机在网格中移动。",
  ["arrays", "loops"],
  `<div class="tools"><button id="step">演化一步</button><button id="play">播放</button><button id="reset">滑翔机</button></div><div id="grid" class="pixels"></div>`,
  `function transform(alive,neighbors){ return neighbors===3 || (alive && neighbors===2); }`,
  `function transform(alive,neighbors){\n  // 根据邻居数量，返回下一代是否存活。\n  return false;\n}`,
  `let cells=Array(256).fill(false),running=false,timer;const g=document.querySelector('#grid');function reset(){cells.fill(false);[1,18,32,33,34].forEach(i=>cells[i]=true);draw();}function draw(){g.replaceChildren(...cells.map((v,i)=>{const b=document.createElement('button');b.style.background=v?'#91f4c7':'#142a39';b.onclick=()=>{cells[i]=!cells[i];draw();};return b;}));}function step(){cells=cells.map((a,i)=>{let n=0,x=i%16,y=Math.floor(i/16);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<16&&ny>=0&&ny<16&&cells[ny*16+nx])n++;}return transform(a,n);});draw();}document.querySelector('#step').onclick=step;document.querySelector('#play').onclick=()=>{running=!running;document.querySelector('#play').textContent=running?'暂停':'播放';clearInterval(timer);if(running)timer=setInterval(step,220);};document.querySelector('#reset').onclick=reset;reset();`,
  [
    { args: [true, 2], expected: true },
    { args: [false, 3], expected: true },
    { args: [true, 4], expected: false },
    { args: [false, 2], expected: false },
  ],
  [
    [
      "写出细胞规则",
      "活细胞有 2 或 3 个邻居时存活；死细胞有 3 个邻居时复活。",
      "四组规则测试通过。",
    ],
    [
      "观察同时更新",
      "理解为什么用旧 cells 计算完整的新一代。",
      "画一排三个细胞，单步后竖起来，再一步横回来。",
    ],
    [
      "构建自己的世界",
      "搭建稳定结构、振荡结构和滑翔机。",
      "保存实现，恢复后仍能播放并暂停。",
    ],
  ],
);
add(
  "sorting-race",
  "排序节奏：让混乱排成队",
  "算法互动",
  "一步一步交换柱子，观察冒泡排序如何缩小问题。",
  ["arrays", "loops"],
  `<div class="tools"><button id="step">比较一步</button><button id="play">自动排序</button><button id="shuffle">打乱</button></div><div id="bars" class="bars"></div><p id="info"></p>`,
  `function transform(values,index){const next=values.slice();if(next[index]>next[index+1]) [next[index],next[index+1]]=[next[index+1],next[index]];return next;}`,
  `function transform(values,index){\n  // 只比较并按需要交换相邻的两个数。\n  return values.slice();\n}`,
  `let values=[7,3,10,2,8,4,9,1,6,5],i=0,end=9,timer;const bars=document.querySelector('#bars');function draw(){bars.replaceChildren(...values.map((v,k)=>{const b=document.createElement('div');b.style.height=(v*8+14)+'%';b.style.background=k===i||k===i+1?'#ffd082':k>end?'#70e5bd':'#749dea';b.textContent=v;return b;}));document.querySelector('#info').textContent=end<=0?'排序完成':'当前比较下标 '+i+' 与 '+(i+1);}function step(){if(end<=0){clearInterval(timer);return;}values=transform(values,i);i++;if(i>=end){i=0;end--;}draw();}document.querySelector('#step').onclick=step;document.querySelector('#play').onclick=()=>{clearInterval(timer);timer=setInterval(step,150);};document.querySelector('#shuffle').onclick=()=>{clearInterval(timer);values=[...Array(10)].map((_,i)=>i+1).sort(()=>Math.random()-.5);i=0;end=9;draw();};draw();`,
  [
    { args: [[3, 1, 2], 0], expected: [1, 3, 2] },
    { args: [[1, 3, 2], 0], expected: [1, 3, 2] },
    { args: [[2, 2], 0], expected: [2, 2] },
  ],
  [
    [
      "实现相邻交换",
      "比较 values[index] 与下一个值，仅在逆序时交换。",
      "无序、有序、相等三种情况通过测试。",
    ],
    [
      "完成一轮",
      "观察最大值怎样被推到本轮右端。",
      "用单步完成一轮，右端最大值不再参与下一轮。",
    ],
    [
      "比较代价",
      "记录一次打乱后的比较次数，解释双层循环。",
      "能解释每一步比较位置，保存代码。",
    ],
  ],
);
add(
  "orbit-clock",
  "轨道时钟：把时间变成运动",
  "创意视觉",
  "拖动速度，让三颗行星沿各自的轨道运行。",
  ["javascript-fundamentals-first", "functions"],
  `<canvas width="640" height="440"></canvas><div class="tools">速度 <input id="speed" type="range" min="0" max="4" step="0.1" value="1"><button id="pause">暂停</button></div>`,
  `function transform(radius,angle){return [Math.cos(angle)*radius,Math.sin(angle)*radius];}`,
  `function transform(radius,angle){\n  // 返回相对中心的 [x,y]。\n  return [radius,0];\n}`,
  `const c=document.querySelector('canvas'),ctx=c.getContext('2d');let time=0,last=0,paused=false;document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'继续':'暂停';};function draw(t){const dt=last?Math.min((t-last)/1000,.05):0;last=t;if(!paused)time+=dt*Number(document.querySelector('#speed').value);ctx.clearRect(0,0,640,440);ctx.save();ctx.translate(320,220);[70,125,185].forEach((r,i)=>{ctx.beginPath();ctx.strokeStyle='#294552';ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();const p=transform(r,time/(i+1));ctx.beginPath();ctx.fillStyle=['#70e5bd','#749dea','#ffd082'][i];ctx.arc(p[0],p[1],9+i*3,0,Math.PI*2);ctx.fill();});ctx.beginPath();ctx.fillStyle='#ffd082';ctx.shadowBlur=25;ctx.shadowColor='#ffd082';ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.restore();requestAnimationFrame(draw);}requestAnimationFrame(draw);`,
  [
    { args: [10, 0], expected: [10, 0] },
    { args: [0, 1], expected: [0, 0] },
  ],
  [
    [
      "计算圆上的位置",
      "使用 cos、sin 将半径和角度转换成坐标。",
      "角度为 0 时在右端；四分之一圈时在下方。",
    ],
    [
      "让时间推动角度",
      "观察外壳如何用两帧间隔累加时间。",
      "暂停和速度 0 都能停止运动；恢复后连续移动。",
    ],
    [
      "扩展轨道",
      "为轨道加入自己的半径与速度参数。",
      "形成至少三种不同公转周期并保存版本。",
    ],
  ],
);
add(
  "fractal-forest",
  "分形森林：让递归长出树",
  "创意视觉",
  "移动深度滑块，看一条线变成一整片树冠。",
  ["recursion"],
  `<canvas width="640" height="440"></canvas><div class="tools">深度 <input id="depth" type="range" min="1" max="10" value="8">角度 <input id="angle" type="range" min="10" max="45" value="24"></div>`,
  `function transform(length){return length*0.72;}`,
  `function transform(length){\n  // 每一层枝条应缩短。\n  return length;\n}`,
  `const c=document.querySelector('canvas'),x=c.getContext('2d');function draw(){x.clearRect(0,0,640,440);function branch(len,d){x.strokeStyle=d<3?'#70e5bd':'#e8bd89';x.lineWidth=Math.max(1,d*.65);x.beginPath();x.moveTo(0,0);x.lineTo(0,-len);x.stroke();if(d<=1)return;x.translate(0,-len);const a=Number(document.querySelector('#angle').value)*Math.PI/180;for(const dir of [-1,1]){x.save();x.rotate(dir*a);branch(transform(len),d-1);x.restore();}}x.save();x.translate(320,430);branch(100,Number(document.querySelector('#depth').value));x.restore();}document.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();`,
  [
    { args: [100], expected: 72 },
    { args: [50], expected: 36 },
  ],
  [
    [
      "缩短子问题",
      "让每一层枝条长度变为上一层的 72%。",
      "100、50 的测试分别得到 72、36。",
    ],
    [
      "找到停止条件",
      "观察 branch 中 d<=1 时为何直接返回。",
      "深度从 1 调到 8，能说明新增的分叉来自哪些调用。",
    ],
    [
      "构建自己的树形",
      "调整角度，保留有限的递归深度。",
      "不同角度呈现不同树冠，保存自己的实现。",
    ],
  ],
);
add(
  "physics-balls",
  "重力游乐场：把速度变成碰撞",
  "模拟世界",
  "点击画面投下一颗球，调重力并观察反弹。",
  ["functions", "javascript-fundamentals-branch"],
  `<canvas width="640" height="440"></canvas><div class="tools">重力 <input id="gravity" type="range" min="0" max="1" step="0.05" value="0.3"><button id="clear">清空</button></div>`,
  `function transform(velocity,restitution){return -Math.abs(velocity)*restitution;}`,
  `function transform(velocity,restitution){\n  // 碰到地面时向上反弹，并损失一部分速度。\n  return 0;\n}`,
  `const c=document.querySelector('canvas'),x=c.getContext('2d');let balls=[{x:180,y:30,vx:2,vy:0},{x:350,y:80,vx:-1,vy:0}],last=0;c.onclick=e=>{const r=c.getBoundingClientRect();balls.push({x:(e.clientX-r.left)*640/r.width,y:(e.clientY-r.top)*440/r.height,vx:Math.random()*4-2,vy:0});if(balls.length>60)balls.shift();};document.querySelector('#clear').onclick=()=>balls=[];function frame(t){const dt=last?Math.min((t-last)/16.667,3):1;last=t;x.clearRect(0,0,640,440);for(const b of balls){b.vy+=Number(document.querySelector('#gravity').value)*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>424){b.y=424;b.vy=transform(b.vy,.82);}if(b.x<12||b.x>628){b.vx=-b.vx;b.x=Math.max(12,Math.min(628,b.x));}x.beginPath();x.fillStyle='#8bbaff';x.arc(b.x,b.y,12,0,Math.PI*2);x.fill();}x.fillStyle='#70e5bd';x.fillRect(0,437,640,3);requestAnimationFrame(frame);}requestAnimationFrame(frame);`,
  [
    { args: [10, 0.8], expected: -8 },
    { args: [0, 0.8], expected: 0 },
  ],
  [
    [
      "决定反弹方向",
      "向下速度为正。地面反弹后速度应为负，并乘以恢复系数。",
      "输入 10、0.8 得到 -8。",
    ],
    [
      "连接每帧更新",
      "观察加速度怎样改变速度、速度怎样改变位置。",
      "点击上方生成球，能反弹并逐渐降低高度。",
    ],
    [
      "调节与比较",
      "对比重力为零和非零的运动。",
      "保持有限球数，保存自己的碰撞实现。",
    ],
  ],
);
