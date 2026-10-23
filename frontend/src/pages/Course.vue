<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Terminal,
  LoaderCircle,
  BookmarkPlus,
} from "lucide-vue-next";
import { courses, type State } from "../curriculum";
import StateStage from "../components/StateStage.vue";
import TeachingMemory from "../components/TeachingMemory.vue";
import ReferenceGame from "../components/ReferenceGame.vue";
import CoachPanel from "../components/CoachPanel.vue";
import Editor from "../components/Editor.vue";
import { api } from "../api";
import { useCoach } from "../store";
import { readyTopics, courseLink } from "../books";
import { learningLanguage, chooseLanguage } from "../learningLanguage";
import { courseForLanguage } from "../courseLanguage";
const route = useRoute(),
  s = useCoach();
const router = useRouter();
const course = computed(() =>
  courseForLanguage(
    courses.find((c) => c.id === route.params.id),
    language.value,
  ),
);
const language = ref<"java" | "javascript">(
    route.query.language === "java"
      ? "java"
      : route.query.language === "javascript"
        ? "javascript"
        : learningLanguage.value,
  ),
  source = ref(""),
  index = ref(-1),
  playing = ref(false),
  answer = ref(-1),
  reveal = ref(false),
  running = ref(false),
  output = ref<any>(null),
  error = ref(""),
  saved = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
const visibleCourses = computed(() =>
  readyTopics(language.value)
    .map((t) => courses.find((c) => c.id === t.courseId))
    .filter((c) => !!c),
);
watch(
  language,
  (v) => {
    chooseLanguage(v);
    router.replace({ query: { ...route.query, language: v } });
  },
  { immediate: true },
);
watch(
  () => route.query.language,
  (v) => {
    if (v === "java" || v === "javascript") language.value = v;
  },
);
const original = computed(() => course.value?.[language.value] || ""),
  dirty = computed(() => source.value !== original.value),
  current = computed(() => course.value?.steps[Math.max(0, index.value)]),
  previous = computed(() => course.value?.steps[index.value - 1]?.state);
const preview = computed<State>(() => {
  const vars: Record<string, string> = {};
  for (const [i, line] of source.value.split("\n").entries()) {
    const match = line.match(
      /^\s*(?:(?:const|let|var|int|double|String|Box|Node|Account|int\[\])\s+)([A-Za-z_$][\w$]*)\s*=/,
    );
    if (match) vars[match[1] + " · L" + (i + 1)] = "待执行";
  }
  return {};
});
const context = computed(() =>
  JSON.stringify({
    lesson: course.value?.title,
    problem: course.value?.problem,
    definition: course.value?.definition,
    difference: course.value?.difference,
    language: language.value,
    source: source.value,
    provenance: dirty.value
      ? "已编辑，尚无对应内存观测"
      : index.value < 0
        ? "未运行，结构预览"
        : "预先编写的教学模型，不是真实内存观测",
    step: !dirty.value && index.value >= 0 ? current.value : undefined,
    lastWholeRunOutput: output.value,
  }),
);
function stop() {
  playing.value = false;
  if (timer) clearInterval(timer);
}
function seek(n: number) {
  stop();
  index.value = Math.max(
    -1,
    Math.min(n, (course.value?.steps.length || 1) - 1),
  );
  saved.value = false;
}
function play() {
  if (playing.value) {
    stop();
    return;
  }
  if (dirty.value) return;
  if (index.value >= (course.value?.steps.length || 1) - 1) index.value = -1;
  playing.value = true;
  timer = setInterval(() => {
    if (index.value >= (course.value?.steps.length || 1) - 1) stop();
    else index.value++;
  }, 2000);
}
function reset() {
  stop();
  source.value = original.value;
  index.value = -1;
  output.value = null;
  error.value = "";
  saved.value = false;
}
watch(original, reset, { immediate: true });
watch(source, () => {
  stop();
  saved.value = false;
});
onBeforeUnmount(stop);
async function restoreRecord() {
  if (!s.user || !route.query.record) return;
  try {
    const r = await api(
      "/records/" + encodeURIComponent(String(route.query.record)),
    );
    const p = JSON.parse(r.snapshot);
    if (p.courseId !== course.value?.id) return;
    language.value = p.language === "java" ? "java" : "javascript";
    await nextTick();
    source.value = p.source || original.value;
    seek(Number.isInteger(p.step) ? p.step : -1);
    saved.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
onMounted(restoreRecord);
watch(() => route.query.record, restoreRecord);
watch(
  () => s.user,
  () => {
    if (s.user) restoreRecord();
  },
);
async function run() {
  if (!s.requireUser()) return;
  stop();
  running.value = true;
  error.value = "";
  const submitted = source.value;
  try {
    output.value = (
      await api("/executions", "POST", {
        language: language.value,
        source: submitted,
        stdin: "",
        topic: course.value?.id || "course",
      })
    ).result;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    running.value = false;
  }
}
async function save() {
  if (!s.requireUser() || !course.value) return;
  try {
    await api("/records", "POST", {
      topic: course.value.id,
      title: course.value.title,
      kind: "NOTE",
      snapshot: {
        courseId: course.value.id,
        kind: "course",
        language: language.value,
        source: source.value,
        step: index.value,
        explanation:
          index.value >= 0 && !dirty.value
            ? current.value?.why
            : course.value.definition,
        model: course.value.structure,
        counter: course.value.change,
      },
    });
    saved.value = true;
    s.notify("课程、代码与当前步骤已保存");
  } catch (e) {
    error.value = (e as Error).message;
  }
}
</script>
<template>
  <main v-if="course" id="main" class="course-page">
    <aside class="course-outline">
      <RouterLink to="/" class="text-button"
        ><ArrowLeft :size="15" />知识目录</RouterLink
      >
      <nav aria-label="课程目录">
        <RouterLink
          v-for="c in visibleCourses"
          :key="c.id"
          :to="courseLink(c.id, language)"
          :class="{ active: c.id === course.id }"
          ><small>{{ c.group }}</small
          >{{ c.title }}</RouterLink
        >
      </nav>
    </aside>
    <div class="course-content">
      <header class="course-heading">
        <div>
          <span class="small-label">{{ course.group }}</span>
          <h1>{{ course.title }}</h1>
        </div>
        <button class="button secondary" :disabled="saved" @click="save">
          <BookmarkPlus :size="15" />{{ saved ? "已保存" : "保存学习位置" }}
        </button>
      </header>
      <section class="concept-opening">
        <h2>要解决什么问题？</h2>
        <p>{{ course.problem }}</p>
        <div class="concrete-example">
          <h3>先建立一个直觉</h3>
          <p>{{ course.intuition }}</p>
        </div>
        <h3>再给出准确的定义</h3>
        <p>{{ course.definition }}</p>
      </section>
      <details class="paired-difference book-comparison">
        <summary>
          按需对照 {{ language === "java" ? "JavaScript" : "Java" }} 的规则
        </summary>
        <p>{{ course.difference }}</p>
      </details>
      <section class="course-workspace" aria-label="代码与状态演示">
        <div class="course-code">
          <div class="panel-bar">
            <strong>完整可运行代码</strong
            ><label
              ><span class="sr-only">课程语言</span
              ><select v-model="language" :disabled="running">
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select></label
            >
          </div>
          <Editor
            v-model="source"
            :language="language"
            :line="
              !dirty && index >= 0
                ? language === 'java'
                  ? current?.javaLine
                  : current?.jsLine
                : undefined
            "
          />
          <div class="editor-footer">
            <button class="text-button" @click="reset" :disabled="running">
              <RotateCcw :size="14" />恢复本课示例</button
            ><button class="button secondary" @click="run" :disabled="running">
              <LoaderCircle v-if="running" class="spin" :size="14" /><Terminal
                v-else
                :size="14"
              />{{ running ? "执行中…" : "实际运行代码" }}
            </button>
          </div>
        </div>
        <div class="course-state">
          <div class="panel-bar">
            <strong>{{ dirty ? "等待重新运行" : "可视化教学模型" }}</strong
            ><span class="subtle">{{
              index < 0
                ? "尚未开始"
                : `步骤 ${index + 1} / ${course.steps.length}`
            }}</span>
          </div>
          <TeachingMemory
            v-if="
              !dirty && ['references', 'this', 'linked'].includes(course.id)
            "
            :state="current?.state || {}"
            :previous="previous"
            :language="language"
            :source="source"
            :preview="index < 0"
            :kind="course.id"
            :line="
              language === 'java'
                ? current?.javaLine || 1
                : current?.jsLine || 1
            "
          />
          <StateStage
            v-else
            :state="dirty ? preview : current?.state || {}"
            :previous="previous"
            :preview="index < 0 || dirty"
          />
          <p v-if="dirty" class="course-model-notice">
            代码已修改。预设教学模型已停用。实际运行可查看输出；进入实验室可查看匹配源码的运行状态。
          </p>
          <div v-else class="course-controls">
            <button
              class="icon-button"
              aria-label="上一个教学步骤"
              :disabled="index < 0"
              @click="seek(index - 1)"
            >
              <ArrowLeft :size="18" /></button
            ><button class="button primary" @click="play">
              <Pause v-if="playing" :size="16" /><Play v-else :size="16" />{{
                playing ? "暂停" : index < 0 ? "开始演示" : "自动播放"
              }}</button
            ><button
              class="button secondary"
              :disabled="index >= course.steps.length - 1"
              @click="seek(index + 1)"
            >
              <SkipForward :size="16" />下一步</button
            ><span>{{
              index < 0
                ? "先看代码，再开始"
                : index + 1 + " / " + course.steps.length
            }}</span>
          </div>
          <div
            v-if="!dirty && index >= 0 && current"
            class="guided-step"
            aria-live="polite"
          >
            <h3>{{ current.title }}</h3>
            <p><strong>为什么这样做：</strong>{{ current.why }}</p>
            <p><strong>现在观察：</strong>{{ current.observe }}</p>
          </div>
          <p v-else-if="!dirty" class="preview-explanation">
            开始演示后，逐步查看本例的状态变化。修改代码后，请在实验室运行新代码。
          </p>
        </div>
      </section>
      <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
      <section v-if="output" class="course-output">
        <h3>整次实际运行输出</h3>
        <pre>{{ output.stdout || "（没有标准输出）" }}</pre>
        <pre v-if="output.stderr" class="stderr">{{ output.stderr }}</pre>
        <p>
          退出码 {{ output.exitCode }} · {{ output.elapsedMs }}ms ·
          {{
            output.timedOut ? "已超时终止" : "独立容器运行"
          }}。此输出不代表上方预设动画的当前步骤。
        </p>
      </section>
      <section class="understanding-check">
        <div>
          <h2>改变一下，会发生什么？</h2>
          <p>{{ course.change }}</p>
          <h3>常见错误与边界</h3>
          <p>{{ course.errors }}</p>
        </div>
        <div class="prediction-game">
          <span class="tag">预测一次 · 可选</span>
          <h3>{{ course.challenge.question }}</h3>
          <button
            v-for="(option, i) in course.challenge.options"
            :key="option"
            :class="{
              chosen: answer === i,
              correct: reveal && i === course.challenge.correct,
            }"
            @click="
              answer = i;
              reveal = false;
            "
          >
            {{ option }}</button
          ><button
            class="button secondary"
            :disabled="answer < 0"
            @click="reveal = true"
          >
            验证预测
          </button>
          <p v-if="reveal" role="status">
            {{
              answer === course.challenge.correct
                ? "预测正确。"
                : "再看一下变化。"
            }}{{ course.challenge.explain }}
          </p>
        </div>
      </section>
      <section class="mental-model">
        <h2>合上解释后，如何自己写？</h2>
        <p>{{ course.structure }}</p>
        <h3>把基础连到下一步</h3>
        <p>{{ course.bridge }}</p>
        <div>
          <RouterLink
            :to="courseLink(course.next, language)"
            class="button primary"
            >继续关联知识<ArrowRight :size="15" /></RouterLink
          ><RouterLink
            v-if="course.experiment"
            :to="'/lab/' + course.experiment"
            class="button secondary"
            >改变输入，比较状态</RouterLink
          ><RouterLink to="/runtime" class="text-button"
            >Java 真实追踪</RouterLink
          >
        </div>
      </section>
      <ReferenceGame v-if="course.id === 'references'" />
      <CoachPanel
        mode="learn"
        :topic="course.title"
        :course-id="course.id"
        :context="context"
      />
    </div>
  </main>
  <main v-else id="main" class="learn-page">
    <h1>没有找到这节课程</h1>
    <RouterLink to="/">返回知识目录</RouterLink>
  </main>
</template>
