<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { projects } from "../projects";
import { projectDocument } from "../projectDocument";
import { articles } from "../textbook";
import { courses } from "../curriculum";
import Editor from "../components/Editor.vue";
import { api } from "../api";
import { useCoach } from "../store";
const route = useRoute(),
  s = useCoach(),
  query = ref(""),
  category = ref("all"),
  building = ref(false),
  source = ref(""),
  applied = ref(""),
  stage = ref(1),
  error = ref(""),
  busy = ref(false),
  versionBusy = ref(false),
  versions = ref<any[]>([]),
  validation = ref<{ passed: boolean; rows: any[] } | null>(null);
const project = computed(() => projects.find((p) => p.id === route.params.id)),
  categories = [...new Set(projects.map((p) => p.category))];
const frameElement = ref<HTMLIFrameElement>(),
  restoredState = ref<unknown>(null);
const filtered = computed(() =>
  projects.filter(
    (p) =>
      (category.value === "all" || p.category === category.value) &&
      (!query.value ||
        [p.title, p.category, p.description].join(" ").includes(query.value)),
  ),
);
const preview = computed(() =>
  project.value
    ? projectDocument(
        project.value,
        building.value
          ? applied.value || project.value.starter
          : project.value.core,
        building.value ? restoredState.value : null,
      )
    : "",
);
const prerequisite = (id: string) =>
  articles.find((a) => a.id === id)?.title ||
  courses.find((c) => c.id === id)?.title ||
  id;
const link = (id: string) =>
  articles.some((a) => a.id === id)
    ? "/read/" + id
    : "/learn/" + id + "?language=javascript";
watch(
  project,
  (p) => {
    building.value = false;
    source.value = p?.starter || "";
    applied.value = "";
    restoredState.value = null;
    stage.value = 1;
    validation.value = null;
    versions.value = [];
    error.value = "";
    if (s.user && p) load();
  },
  { immediate: true },
);
watch(
  () => s.user,
  () => {
    if (s.user && project.value) load();
  },
);
watch(source, () => {
  validation.value = null;
});
async function load() {
  if (!project.value) return;
  versionBusy.value = true;
  try {
    versions.value = await api("/projects/" + project.value.id + "/versions");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    versionBusy.value = false;
  }
}
async function captureState() {
  const target = frameElement.value?.contentWindow;
  if (!target) throw Error("画面尚未准备好，请稍后保存。");
  const nonce = crypto.randomUUID();
  return await new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", receive);
      reject(Error("无法读取作品状态，请先更新画面并确认代码没有报错。"));
    }, 2500);
    function receive(e: MessageEvent) {
      if (
        e.source !== target ||
        e.data?.type !== "trace:state" ||
        e.data.nonce !== nonce
      )
        return;
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      resolve(e.data.state);
    }
    window.addEventListener("message", receive);
    target.postMessage({ type: "trace:save", nonce }, "*");
  });
}
async function save() {
  if (!s.requireUser() || !project.value) return;
  if (source.value !== (applied.value || project.value.starter)) {
    error.value =
      "代码尚未应用到画面。请先点击“更新画面”，再保存对应作品状态。";
    return;
  }
  versionBusy.value = true;
  try {
    const state = JSON.stringify(await captureState());
    await api("/projects/versions", "POST", {
      projectId: project.value.id,
      stage: stage.value,
      source: source.value,
      state,
    });
    await load();
    s.notify("已保存个人代码和作品当前状态");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    versionBusy.value = false;
  }
}
function restoreVersion(v: any) {
  try {
    const state = JSON.parse(v.state || "null");
    source.value = v.source;
    applied.value = v.source;
    stage.value = v.stage;
    restoredState.value = state;
  } catch {
    error.value = "保存的状态格式无法读取。";
  }
}
function updatePreview() {
  restoredState.value = null;
  applied.value = source.value;
}
async function validate() {
  if (!s.requireUser() || !project.value) return;
  busy.value = true;
  error.value = "";
  try {
    const token = "PROJECT_" + crypto.randomUUID() + ":";
    const testSource =
      source.value +
      "\n" +
      project.value.tests
        .map(
          (t) =>
            `try{console.log(${JSON.stringify(token)}+JSON.stringify(transform(...${JSON.stringify(t.args)})));}catch(e){console.log(${JSON.stringify(token)}+JSON.stringify({error:String(e)}));}`,
        )
        .join("\n");
    const r = await api("/executions", "POST", {
      language: "javascript",
      source: testSource,
      stdin: "",
      topic: "project-" + project.value.id,
    });
    const lines = r.result.stdout
      .split("\n")
      .filter((l: string) => l.startsWith(token));
    const rows = project.value.tests.map((t, i) => {
      let actual;
      try {
        actual = JSON.parse(lines[i]?.slice(token.length));
      } catch {}
      return {
        ...t,
        actual,
        passed:
          r.result.exitCode === 0 &&
          !r.result.timedOut &&
          JSON.stringify(actual) === JSON.stringify(t.expected),
      };
    });
    validation.value = { passed: rows.every((r) => r.passed), rows };
    if (r.result.stderr) error.value = r.result.stderr;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main id="main" class="projects-page" v-if="!project">
    <header class="projects-heading">
      <div>
        <span class="small-label">先玩到，再做出来。</span>
        <h1>把知识变成一个好玩的作品。</h1>
        <p>每个成品都能试玩。选一个喜欢的，再沿阶段任务实现自己的版本。</p>
      </div>
      <span>{{ projects.length }} 个可试玩项目</span>
    </header>
    <div class="project-filters">
      <label
        ><span class="sr-only">搜索项目</span
        ><input v-model="query" placeholder="搜索像素、音乐、迷宫…" /></label
      ><button @click="category = 'all'" :aria-pressed="category === 'all'">
        全部</button
      ><button
        v-for="c in categories"
        :key="c"
        @click="category = c"
        :aria-pressed="category === c"
      >
        {{ c }}
      </button>
    </div>
    <div class="project-gallery">
      <RouterLink
        v-for="p in filtered"
        :key="p.id"
        :to="'/projects/' + p.id"
        class="project-cover"
        ><div class="project-cover-art" :class="'cover-' + p.id">
          <span v-if="p.id === 'pet-garden'">(•ᴥ•)</span
          ><span v-else-if="p.id === 'word-rain'">hello<br />world</span
          ><span v-else-if="p.id === 'step-sequencer'">▥ ▥ ▥</span
          ><svg v-else viewBox="0 0 320 160" aria-hidden="true">
            <template
              v-if="p.id.includes('orbit') || p.id.includes('particle')"
            >
              <ellipse
                v-for="r in [35, 58, 80]"
                :key="r"
                cx="160"
                cy="80"
                :rx="r * 1.5"
                :ry="r * 0.7"
                fill="none"
                stroke="#3b687a"
              />
              <circle cx="160" cy="80" r="14" fill="#ffd082" />
              <circle cx="240" cy="105" r="8" fill="#70e5bd" />
            </template>
            <template v-else-if="p.id.includes('sorting')">
              <rect
                v-for="(v, i) in [45, 90, 60, 110, 80, 40, 100, 70]"
                :key="i"
                :x="40 + i * 30"
                :y="145 - v"
                width="20"
                :height="v"
                :fill="i % 2 ? '#70e5bd' : '#8bbaff'"
                rx="3"
              />
            </template>
            <template v-else-if="p.id.includes('fractal')">
              <path
                d="M160 150V90L110 45M160 90L210 45M110 45L85 20M110 45L130 15M210 45L190 15M210 45L240 20"
                fill="none"
                stroke="#70e5bd"
                stroke-width="4"
              />
            </template>
            <template v-else-if="p.id.includes('physics')">
              <circle
                v-for="(v, i) in [45, 110, 180, 245]"
                :key="i"
                :cx="v"
                :cy="40 + i * 25"
                :r="12 + i * 3"
                :fill="i % 2 ? '#70e5bd' : '#8bbaff'"
              />
              <path d="M30 145H290" stroke="#ffd082" />
            </template>
            <template v-else-if="p.id.includes('graph')">
              <path
                d="M45 85L125 35L150 130L265 65L45 85L150 130"
                stroke="#70e5bd"
                fill="none"
                stroke-width="2"
              />
              <circle
                v-for="(pos, i) in [
                  [45, 85],
                  [125, 35],
                  [150, 130],
                  [265, 65],
                ]"
                :key="i"
                :cx="pos[0]"
                :cy="pos[1]"
                r="12"
                fill="#8bbaff"
              />
            </template>
            <template v-else>
              <rect
                v-for="i in 72"
                :key="i"
                :x="44 + ((i - 1) % 12) * 20"
                :y="20 + Math.floor((i - 1) / 12) * 20"
                width="17"
                height="17"
                :fill="(i * 7) % 11 < 4 ? '#70e5bd' : '#203748'"
                rx="2"
              />
            </template>
          </svg>
        </div>
        <div class="project-cover-text">
          <small>{{ p.category }}</small>
          <h2>{{ p.title }}</h2>
          <p>{{ p.description }}</p>
          <span>试玩成品 · 查看制作阶段 →</span>
        </div></RouterLink
      >
    </div>
    <p class="project-count-note">
      长期目标为 120
      个正式项目。当前只统计上方实际可玩的独立项目，后续批次不计入当前数量。
    </p>
  </main>
  <main v-else id="main" class="project-detail">
    <nav class="article-breadcrumb">
      <RouterLink to="/projects">项目工坊</RouterLink
      ><span>/ {{ project.category }}</span>
    </nav>
    <header class="project-title">
      <div>
        <h1>{{ project.title }}</h1>
        <p>{{ project.description }}</p>
      </div>
      <button class="button primary" @click="building = !building">
        {{ building ? "返回最终成品" : "开始制作我的版本" }}
      </button>
    </header>
    <div :class="['project-playground', { building }]">
      <section class="project-stage">
        <header class="panel-bar">
          <strong>{{
            building ? "我的版本" : "最终成品 · 可以直接操作"
          }}</strong
          ><span>{{
            building ? "代码修改后点击更新画面" : "先体验，再开始制作"
          }}</span>
        </header>
        <iframe
          ref="frameElement"
          :key="preview"
          :srcdoc="preview"
          sandbox="allow-scripts"
          :title="project.title + '互动作品'"
          allow="autoplay"
          referrerpolicy="no-referrer"
        ></iframe>
      </section>
      <section v-if="building" class="project-code">
        <header class="panel-bar">
          <strong>本阶段核心逻辑</strong><span>JavaScript</span>
        </header>
        <Editor v-model="source" language="javascript" :read-only="busy" />
        <footer class="editor-footer">
          <button class="button secondary" @click="updatePreview">
            更新画面</button
          ><button class="button primary" :disabled="busy" @click="validate">
            {{ busy ? "验证中…" : "运行核心测试" }}
          </button>
        </footer>
      </section>
    </div>
    <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
    <section v-if="validation" class="exercise-results">
      <h2>
        {{
          validation.passed ? "核心样例通过，继续完成画面验收" : "检查这些输入"
        }}
      </h2>
      <table>
        <thead>
          <tr>
            <th>参数</th>
            <th>期望</th>
            <th>实际</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in validation.rows" :key="i">
            <td>{{ JSON.stringify(r.args) }}</td>
            <td>{{ JSON.stringify(r.expected) }}</td>
            <td>{{ JSON.stringify(r.actual) }}</td>
            <td>{{ r.passed ? "通过" : "未通过" }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <div class="project-learning">
      <section>
        <h2>学完这些，就能开始</h2>
        <RouterLink
          v-for="id in project.prerequisites"
          :key="id"
          :to="link(id)"
          class="project-prerequisite"
          >{{ prerequisite(id) }} →</RouterLink
        >
        <p class="project-infrastructure">
          本项目提供显示与操作外壳，你负责实现核心规则。下方每一阶段都要用实际操作检查效果。核心测试通过不等于整个作品已完成。
        </p>
        <p class="project-infrastructure">{{ project.source }}</p>
      </section>
      <section>
        <h2>每一步都得到一个可见成果</h2>
        <button
          v-for="(item, i) in project.stages"
          :key="i"
          :class="['project-task', { active: stage === i + 1 }]"
          @click="
            stage = i + 1;
            building = true;
          "
        >
          <strong>{{ i + 1 }}. {{ item.title }}</strong>
          <p>{{ item.task }}</p>
          <small>验收：{{ item.acceptance }}</small>
        </button>
      </section>
    </div>
    <section v-if="building" class="project-versions">
      <header>
        <h2>我的阶段成果</h2>
        <button class="button primary" :disabled="versionBusy" @click="save">
          保存第 {{ stage }} 阶段版本
        </button>
      </header>
      <p v-if="!s.user">登录后，可将代码与作品状态保存到自己的账号。</p>
      <p v-else-if="!versions.length">
        还没有保存的版本。先实现一个小目标，再留下第一份成果。
      </p>
      <button
        v-for="v in versions"
        :key="v.id"
        class="version-row"
        @click="restoreVersion(v)"
      >
        第 {{ v.stage }} 阶段 ·
        {{ String(v.createdAt).replace("T", " ").slice(0, 19) }}
        <span>恢复代码与画面</span>
      </button>
      <details>
        <summary>研究完整成品的核心实现</summary>
        <pre>{{ project.core }}</pre>
      </details>
    </section>
  </main>
</template>
