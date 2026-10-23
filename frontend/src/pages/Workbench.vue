<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  LoaderCircle,
  Terminal,
  ChevronDown,
} from "lucide-vue-next";
import Editor from "../components/Editor.vue";
import MemoryWorld from "../components/MemoryDiagram.vue";
import { api } from "../api";
import { useCoach } from "../store";
import { sourceFor } from "../lessons";
import { articles } from "../textbook";
import type { Language } from "../books";
import type { RuntimeResult } from "../runtime";
import { frameLabel } from "../runtime";
import StepOutput from "../components/StepOutput.vue";
const route = useRoute(),
  s = useCoach();
const router = useRouter();
const activeTraceId = ref("");
const language = ref<Language>(
  route.query.language === "javascript" ? "javascript" : "java",
);
const javaExample =
  'public class Main {\n  static class Student {\n    String name;\n    int age;\n    Student(String name, int age) {\n      this.name = name;\n      this.age = age;\n    }\n  }\n  public static void main(String[] args) {\n    Student a = new Student("小明", 19);\n    Student b = a;\n    b.age = 20;\n    System.out.println(a.age);\n  }\n}';
const jsExample =
  'function experiment() {\n  const a = { name: "小明", age: 19 };\n  const b = a;\n  b.age = 20;\n  console.log(a.age);\n}\nexperiment();';
function initial() {
  const article = articles.find(
    (a) => a.id === route.query.article && a.language === language.value,
  );
  if (article) return article.code;
  const kind = String(route.params.kind || "");
  return ["reverse", "reference", "binary"].includes(kind)
    ? sourceFor(kind, language.value, [1, 2, 3, 4], "correct", 3)
    : language.value === "java"
      ? javaExample
      : jsExample;
}
const source = ref(initial()),
  recordedSource = ref(""),
  recordedLanguage = ref<Language>("java"),
  result = ref<RuntimeResult | null>(null),
  index = ref(0),
  busy = ref(false),
  playing = ref(false),
  error = ref(""),
  consoleOpen = ref(false),
  plainOutput = ref<any>(null);
let timer: ReturnType<typeof setInterval> | undefined;
const dirty = computed(
  () =>
    source.value !== recordedSource.value ||
    language.value !== recordedLanguage.value,
);
const frame = computed(() =>
  !dirty.value ? result.value?.frames[index.value] : undefined,
);
const frames = computed(() => (!dirty.value ? result.value?.frames || [] : []));
const lastOutput = computed(
  () => plainOutput.value?.stdout ?? result.value?.meta.stdout ?? "",
);
const diagnostics = computed(
  () =>
    plainOutput.value?.stderr ??
    (result.value?.diagnostics || "") + (result.value?.meta.stderr || ""),
);
function stop() {
  playing.value = false;
  if (timer) clearInterval(timer);
}
function seek(n: number) {
  stop();
  index.value = Math.max(0, Math.min(n, frames.value.length - 1));
}
function play() {
  if (playing.value) {
    stop();
    return;
  }
  if (!frames.value.length) return;
  if (index.value === frames.value.length - 1) index.value = 0;
  playing.value = true;
  timer = setInterval(() => {
    if (index.value >= frames.value.length - 1) stop();
    else index.value++;
  }, 850);
}
watch(language, () => {
  stop();
  source.value = initial();
  result.value = null;
  plainOutput.value = null;
  recordedSource.value = "";
  error.value = "";
  index.value = 0;
});
watch(source, stop);
async function run() {
  if (!s.requireUser()) return;
  stop();
  busy.value = true;
  error.value = "";
  plainOutput.value = null;
  result.value = null;
  const code = source.value,
    lang = language.value;
  try {
    const r = await api("/runtime/" + lang, "POST", { source: code });
    result.value = r.result;
    activeTraceId.value = r.id;
    router.replace({ query: { ...route.query, id: r.id, language: lang } });
    recordedSource.value = code;
    recordedLanguage.value = lang;
    index.value = 0;
    if (!r.result.frames.length) {
      consoleOpen.value = true;
      error.value = r.result.timedOut
        ? "追踪启动超时，请检查代码或稍后重试。"
        : "未生成暂停点，请展开输出检查诊断。";
    }
  } catch (e) {
    error.value = (e as Error).message;
    consoleOpen.value = true;
  } finally {
    busy.value = false;
  }
}
async function restore() {
  if (typeof route.query.id !== "string" || !s.user) return;
  if (route.query.id === activeTraceId.value) return;
  busy.value = true;
  try {
    const r = await api("/runtime/" + encodeURIComponent(route.query.id));
    stop();
    consoleOpen.value = false;
    activeTraceId.value = r.id;
    language.value = r.language === "javascript" ? "javascript" : "java";
    await nextTick();
    source.value = r.source;
    recordedSource.value = r.source;
    recordedLanguage.value = language.value;
    result.value = r.result;
    index.value = 0;
  } catch (e) {
    error.value = (e as Error).message;
    consoleOpen.value = true;
  } finally {
    busy.value = false;
  }
}
function shortcuts(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (!busy.value) run();
  } else if (e.key === "F10") {
    e.preventDefault();
    if (!busy.value) seek(index.value + 1);
  } else if (e.key === "F8") {
    e.preventDefault();
    if (!busy.value) play();
  }
}
onMounted(() => {
  window.addEventListener("keydown", shortcuts);
  restore();
});
watch(
  () => s.user,
  () => {
    if (s.user) restore();
  },
);
watch(() => route.query.id, restore);
onBeforeUnmount(() => {
  stop();
  window.removeEventListener("keydown", shortcuts);
});
</script>
<template>
  <main id="main" class="workbench-page">
    <header class="workbench-toolbar">
      <label
        ><span class="sr-only">实验室语言</span
        ><select v-model="language" :disabled="busy" aria-label="实验室语言">
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
        </select></label
      >
      <div class="workbench-transport">
        <button
          class="button primary"
          :disabled="busy || !source.trim()"
          @click="run"
          title="Ctrl+Enter"
        >
          <LoaderCircle v-if="busy" :size="15" class="spin" /><Play
            v-else
            :size="15"
          />{{ busy ? "正在运行…" : "运行" }}</button
        ><button
          class="icon-button"
          aria-label="上一步"
          :disabled="!frames.length || index === 0 || busy"
          @click="seek(index - 1)"
        >
          <SkipBack :size="18" /></button
        ><button
          class="icon-button"
          :aria-label="playing ? '暂停回放' : '播放回放'"
          :disabled="!frames.length || busy"
          @click="play"
        >
          <Pause v-if="playing" :size="18" /><Play v-else :size="18" /></button
        ><button
          class="icon-button"
          aria-label="下一步"
          title="F10"
          :disabled="!frames.length || index === frames.length - 1 || busy"
          @click="seek(index + 1)"
        >
          <SkipForward :size="18" /></button
        ><button
          class="icon-button"
          aria-label="重置回放"
          :disabled="!frames.length || busy"
          @click="seek(0)"
        >
          <RotateCcw :size="17" />
        </button>
      </div>
      <span class="workbench-state">{{
        busy
          ? "生成真实运行结果"
          : frame
            ? `回放 ${index + 1} / ${frames.length}`
            : "尚无匹配的执行快照"
      }}</span
      ><button
        class="text-button console-toggle"
        :aria-expanded="consoleOpen"
        @click="consoleOpen = !consoleOpen"
      >
        <Terminal :size="15" />输出<ChevronDown :size="13" />
      </button>
    </header>
    <div class="workbench-columns">
      <section class="workbench-code" aria-label="自由代码区">
        <div class="workbench-panel-label">
          <span>{{ language === "java" ? "Main.java" : "main.js" }}</span
          ><span>{{ frame ? frameLabel(frame) : "可编辑源码" }}</span>
        </div>
        <Editor
          v-model="source"
          :language="language"
          :line="frame?.line"
          :read-only="busy"
        />
        <StepOutput
          :frames="result?.frames || []"
          :index="index"
          :active="!!frame"
        />
      </section>
      <section class="workbench-memory" aria-label="分区运行结构图">
        <div class="workbench-panel-label">
          <span>{{
            language === "java" ? "Java 运行结构" : "JavaScript 运行结构"
          }}</span
          ><span>{{
            frame
              ? language === "java"
                ? "JDI 真实观测"
                : "V8 Inspector 真实观测"
              : "等待运行"
          }}</span>
        </div>
        <MemoryWorld
          :language="language"
          :source="source"
          :frame="frame"
          :previous="result?.frames[index - 1]"
          :preview="!frame"
        />
        <p v-if="language === 'javascript'" class="workbench-capability">
          JavaScript 追踪 Node 主线程 main.js；未采集浏览器
          DOM、完整原型链与任务队列。未初始化的绑定可能显示为不可读取。
        </p>
        <p v-else-if="dirty && result" class="workbench-capability">
          代码已修改，旧轨迹已停止显示。重新运行后生成匹配的状态。
        </p>
        <p v-if="result?.meta.limited" class="workbench-capability">
          达到追踪上限，程序已终止。当前轨迹不是完整执行。
        </p>
      </section>
    </div>
    <section v-if="consoleOpen" class="workbench-console" aria-label="运行输出">
      <header>
        <h2>整次运行输出</h2>
        <span>{{
          language === "java" ? "独立容器 · Java 21" : "独立容器 · Node.js 22"
        }}</span
        ><button @click="consoleOpen = false" aria-label="收起输出">×</button>
      </header>
      <p v-if="error" role="alert" class="error-message">{{ error }}</p>
      <pre>{{ lastOutput || "（没有标准输出）" }}</pre>
      <pre v-if="diagnostics" class="stderr">{{ diagnostics }}</pre>
      <p v-if="result?.timedOut || plainOutput?.timedOut" class="warning-text">
        已达到运行时间上限。
      </p>
      <p
        v-if="result?.truncated || plainOutput?.truncated"
        class="warning-text"
      >
        输出已截断。
      </p>
    </section>
  </main>
</template>
