<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";
import { articles } from "../textbook";
import { api } from "../api";
import { useCoach } from "../store";
import type { RuntimeResult } from "../runtime";
import { frameLabel } from "../runtime";
import StepOutput from "../components/StepOutput.vue";
import Editor from "../components/Editor.vue";
import MemoryDiagram from "../components/MemoryDiagram.vue";
import CoachPanel from "../components/CoachPanel.vue";
import { browserDocument } from "../browserDocument";
const browserSource = ref("");
const browserHtml = computed(() => browserDocument(browserSource.value));
const route = useRoute(),
  s = useCoach();
const article = computed(() => articles.find((a) => a.id === route.params.id));
const source = ref(""),
  busy = ref(false),
  result = ref<RuntimeResult>(),
  recorded = ref(""),
  index = ref(0),
  error = ref(""),
  playing = ref(false),
  saved = ref(false);
const runtimeId = ref("");
let timer: ReturnType<typeof setInterval> | undefined;
const frame = computed(() =>
  recorded.value === source.value
    ? result.value?.frames[index.value]
    : undefined,
);
const context = computed(() =>
  JSON.stringify({
    courseId: article.value?.id,
    source: source.value,
    language: article.value?.language,
    frame: frame.value,
    reasoning: article.value?.reasoning,
    output: result.value?.meta.stdout,
    provenance: frame.value
      ? "实际隔离运行的暂停快照，具体时机以 frame.semantics 为准；at-location 是源码位置，不代表整行尚未执行"
      : "尚无匹配运行状态",
  }),
);
function stop() {
  playing.value = false;
  if (timer) clearInterval(timer);
}
watch(
  article,
  (a) => {
    stop();
    source.value = a?.code || "";
    result.value = undefined;
    recorded.value = "";
    index.value = 0;
    error.value = "";
    saved.value = false;
    browserSource.value = "";
  },
  { immediate: true },
);
watch(source, () => {
  stop();
  saved.value = false;
});
onBeforeUnmount(stop);
function seek(n: number) {
  stop();
  index.value = Math.max(
    0,
    Math.min(n, (result.value?.frames.length || 1) - 1),
  );
}
function play() {
  if (playing.value) {
    stop();
    return;
  }
  if (!frame.value) return;
  if (index.value === result.value!.frames.length - 1) index.value = 0;
  playing.value = true;
  timer = setInterval(() => {
    if (index.value >= result.value!.frames.length - 1) stop();
    else index.value++;
  }, 1100);
}
async function run() {
  if (article.value?.environment === "browser") {
    browserSource.value = source.value;
    return;
  }
  if (!s.requireUser() || !article.value) return;
  stop();
  busy.value = true;
  error.value = "";
  result.value = undefined;
  const code = source.value;
  try {
    const r = await api("/runtime/" + article.value.language, "POST", {
      source: code,
    });
    result.value = r.result;
    runtimeId.value = r.id;
    recorded.value = code;
    index.value = 0;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!s.requireUser() || !article.value) return;
  try {
    await api("/records", "POST", {
      topic: article.value.id,
      title: article.value.title,
      kind: "NOTE",
      snapshot: {
        kind: "article",
        articleId: article.value.id,
        language: article.value.language,
        source: source.value,
        step: index.value,
        runtimeId:
          recorded.value === source.value ? runtimeId.value : undefined,
        explanation: article.value.definition,
        model: article.value.structure,
      },
    });
    saved.value = true;
    s.notify("已保存本节代码与学习位置");
  } catch (e) {
    error.value = (e as Error).message;
  }
}
async function restoreRecord() {
  if (!s.user || typeof route.query.record !== "string" || !article.value)
    return;
  try {
    const row = await api("/records/" + encodeURIComponent(route.query.record));
    const p =
      typeof row.snapshot === "string"
        ? JSON.parse(row.snapshot)
        : row.snapshot;
    if (p.articleId !== article.value.id) return;
    source.value = p.source || article.value.code;
    await nextTick();
    if (p.runtimeId) {
      const trace = await api("/runtime/" + encodeURIComponent(p.runtimeId));
      if (
        trace.source === source.value &&
        trace.language === article.value.language
      ) {
        result.value = trace.result;
        recorded.value = trace.source;
        runtimeId.value = trace.id;
        seek(Number(p.step) || 0);
      }
    }
    saved.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
onMounted(restoreRecord);
watch(
  () => s.user,
  () => {
    if (s.user) restoreRecord();
  },
);
watch(() => route.query.record, restoreRecord);
</script>
<template>
  <main id="main" class="article-page" v-if="article">
    <nav class="article-breadcrumb">
      <RouterLink to="/">学习目录</RouterLink
      ><span>/ {{ article.language === "java" ? "Java" : "JavaScript" }}</span
      ><button class="text-button" @click="save">
        {{ saved ? "已保存" : "保存学习位置" }}
      </button>
    </nav>
    <header class="article-heading">
      <h1>{{ article.title }}</h1>
      <p>{{ article.goal }}</p>
    </header>
    <section class="article-intro">
      <h2>先从具体问题理解</h2>
      <p>{{ article.intuition }}</p>
      <h2>这个概念是什么？</h2>
      <p>{{ article.definition }}</p>
    </section>
    <section class="article-execution" aria-label="完整代码与运行变化">
      <div class="article-source">
        <header class="panel-bar">
          <strong>完整可运行代码</strong
          ><span>{{
            article.language === "java" ? "Main.java" : "main.js"
          }}</span>
        </header>
        <Editor
          v-model="source"
          :language="article.language"
          :line="frame?.line"
          :read-only="busy"
        />
        <StepOutput
          v-if="article.environment !== 'browser'"
          :frames="result?.frames || []"
          :index="index"
          :active="!!frame"
        />
        <div class="editor-footer">
          <button
            class="text-button"
            :disabled="busy"
            @click="
              source = article.code;
              result = undefined;
            "
          >
            恢复示例</button
          ><button class="button primary" :disabled="busy" @click="run">
            {{
              busy
                ? "运行中…"
                : article.environment === "browser"
                  ? "运行浏览器示例"
                  : "运行并逐步查看"
            }}
          </button>
        </div>
      </div>
      <div class="article-memory">
        <header class="panel-bar">
          <strong>{{
            article.environment === "browser" ? "运行画面" : "内存变化"
          }}</strong
          ><small>{{
            article.environment === "browser" &&
            browserSource === source &&
            browserSource
              ? "可操作示例"
              : frameLabel(frame)
          }}</small>
        </header>
        <iframe
          v-if="
            article.environment === 'browser' &&
            browserSource &&
            browserSource === source
          "
          :srcdoc="browserHtml"
          sandbox="allow-scripts"
          title="浏览器与 Vue 互动演示"
          class="article-browser"
        ></iframe>
        <p
          v-else-if="article.environment === 'browser'"
          class="article-browser-notice"
        >
          点击运行，在隔离浏览器画面中操作。本例预置 Vue 3，并提供 #app
          挂载节点；不展示虚构的 JVM 内存图。
        </p>
        <MemoryDiagram
          v-else
          :frame="frame"
          :previous="result?.frames[index - 1]"
          :source="source"
          :language="article.language"
          :preview="!frame"
        />
        <div v-if="frame" class="article-controls">
          <button
            class="button secondary"
            @click="seek(index - 1)"
            :disabled="index === 0"
          >
            上一步</button
          ><button class="button secondary" @click="play">
            {{ playing ? "暂停" : "播放" }}</button
          ><button
            class="button primary"
            @click="seek(index + 1)"
            :disabled="index === result!.frames.length - 1"
          >
            下一步</button
          ><small>{{ index + 1 }} / {{ result!.frames.length }}</small>
        </div>
      </div>
    </section>
    <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
    <section class="article-output">
      <h2>本例预期输出</h2>
      <pre>{{ article.output }}</pre>
      <details v-if="result">
        <summary>本次实际运行输出</summary>
        <pre>{{ result.meta.stdout || "（无标准输出）" }}</pre>
        <pre v-if="result.diagnostics || result.meta.stderr"
          >{{ result.diagnostics }}{{ result.meta.stderr }}</pre>
        <p v-if="result.timedOut || result.meta.limited || result.truncated">
          本次运行达到时间、步骤或输出限制，不能视为完整执行。
        </p>
      </details>
    </section>
    <section class="article-reasoning">
      <h2>代码为什么这样组织？</h2>
      <article v-for="(r, i) in article.reasoning" :key="i">
        <code>{{ r.code }}</code>
        <p>{{ r.why }}</p>
      </article>
    </section>
    <section class="article-experiments">
      <h2>改一处，再验证</h2>
      <p>{{ article.change }}</p>
      <h2>常见错误与适用边界</h2>
      <p>{{ article.errors }}</p>
      <h2>独立写出来时，抓住什么？</h2>
      <p>{{ article.structure }}</p>
    </section>
    <section class="article-next">
      <RouterLink
        v-for="e in article.exercises"
        :key="e"
        :to="'/practice?exercise=' + e + '&language=' + article.language"
        class="button secondary"
        >相关练习 · {{ e }}</RouterLink
      ><RouterLink
        v-for="p in article.projects"
        :key="p"
        :to="'/projects/' + p"
        class="button secondary"
        >动手做项目 · {{ p }}</RouterLink
      ><RouterLink
        :to="'/lab?article=' + article.id + '&language=' + article.language"
        class="text-button"
        >在实验室自由修改</RouterLink
      >
    </section>
    <CoachPanel
      mode="learn"
      :topic="article.title"
      :course-id="article.id"
      :context="context"
    />
    <a
      class="article-reference"
      :href="article.source"
      target="_blank"
      rel="noopener noreferrer"
      >查阅语言官方文档或原始教程</a
    >
  </main>
  <main id="main" class="article-page" v-else>
    <h1>未找到这节教程</h1>
    <RouterLink to="/">返回目录</RouterLink>
  </main>
</template>
