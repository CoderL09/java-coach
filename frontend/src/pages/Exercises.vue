<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import Editor from "../components/Editor.vue";
import CoachPanel from "../components/CoachPanel.vue";
import { api } from "../api";
import { useCoach } from "../store";
import { learningLanguage, chooseLanguage } from "../learningLanguage";
import type { Language } from "../books";
type Exercise = {
  id: string;
  title: string;
  topic: string;
  description: string;
  languages: string[];
  starter: Record<string, string>;
  hints: string[];
  testCount: number;
  example: { input: unknown; expected: unknown };
};
const route = useRoute(),
  router = useRouter(),
  s = useCoach(),
  list = ref<Exercise[]>([]),
  language = ref<Language>(
    route.query.language === "java"
      ? "java"
      : route.query.language === "javascript"
        ? "javascript"
        : learningLanguage.value,
  ),
  topic = ref("all"),
  query = ref(""),
  selected = ref(String(route.query.exercise || "")),
  code = ref(""),
  busy = ref(false),
  loading = ref(false),
  error = ref(""),
  result = ref<any>(null),
  hintCount = ref(0),
  solutionViewed = ref(false),
  solution = ref("");
const topics = computed(() => [
  ...new Set(
    list.value
      .filter((e) => e.languages.includes(language.value))
      .map((e) => e.topic),
  ),
]);
const filtered = computed(() =>
  list.value.filter(
    (e) =>
      e.languages.includes(language.value) &&
      (topic.value === "all" || topic.value === e.topic) &&
      (!query.value ||
        [e.title, e.topic, e.description]
          .join(" ")
          .toLowerCase()
          .includes(query.value.toLowerCase())),
  ),
);
const current = computed(() =>
  list.value.find(
    (e) => e.id === selected.value && e.languages.includes(language.value),
  ),
);
const context = computed(() =>
  JSON.stringify({
    exercise: current.value?.id,
    goal: current.value?.description,
    language: language.value,
    source: code.value,
    lastActualTests: result.value?.tests,
    evidence: result.value?.evidence,
    hintsViewed: hintCount.value,
    solutionViewed: solutionViewed.value,
    mode: "练习先听用户思路，不主动直接给答案。用户明确不会时，每次只拆一个有原因的小任务。",
  }),
);
async function load() {
  loading.value = true;
  try {
    list.value = await api("/exercises");
    await nextTick();
    await restoreRecord();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
watch(current, (e) => {
  code.value = e?.starter[language.value] || "";
  result.value = null;
  hintCount.value = 0;
  solutionViewed.value = false;
  solution.value = "";
  error.value = "";
});
watch(language, (v) => {
  chooseLanguage(v as "java" | "javascript");
  topic.value = "all";
  if (!current.value) selected.value = "";
  router.replace({
    query: {
      ...route.query,
      language: v,
      ...(selected.value
        ? { exercise: selected.value }
        : { exercise: undefined }),
    },
  });
});
watch(
  () => route.query.exercise,
  (v) => {
    selected.value = String(v || "");
  },
);
watch(
  () => s.user,
  () => {
    if (s.user && !list.value.length) load();
  },
);
function select(e: Exercise) {
  selected.value = e.id;
  router.replace({ query: { exercise: e.id, language: language.value } });
}
async function submit() {
  if (!s.requireUser() || !current.value) return;
  busy.value = true;
  error.value = "";
  result.value = null;
  try {
    result.value = await api(
      "/exercises/" + current.value.id + "/attempts",
      "POST",
      {
        language: language.value,
        source: code.value,
        hintUsed: hintCount.value > 0,
        solutionViewed: solutionViewed.value,
      },
    );
    s.notify(
      result.value.passed
        ? "本组测试通过；仅记录本次证据，不自动判定掌握"
        : "失败输入已保存到学习记录",
    );
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
async function showSolution() {
  if (!current.value || !s.requireUser()) return;
  try {
    const r = await api("/exercises/" + current.value.id + "/solution");
    solution.value = r[language.value];
    solutionViewed.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
onMounted(load);
async function restoreRecord() {
  if (!s.user || typeof route.query.record !== "string") return;
  try {
    const row = await api("/records/" + encodeURIComponent(route.query.record));
    const p =
      typeof row.snapshot === "string"
        ? JSON.parse(row.snapshot)
        : row.snapshot;
    if (!current.value || p.exerciseId !== current.value.id) return;
    await nextTick();
    code.value = p.source || current.value.starter[language.value];
    hintCount.value = p.hintUsed ? 1 : 0;
    solutionViewed.value = !!p.solutionViewed;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
watch(() => route.query.record, restoreRecord);
watch(
  () => s.user,
  () => {
    if (s.user && list.value.length) restoreRecord();
  },
);
</script>
<template>
  <main id="main" class="exercise-page">
    <header class="page-heading">
      <div>
        <h1>挑一个知识点，自己写出来。</h1>
        <p>先说思路，再动手。用实际输入检查，而不是靠“感觉会了”。</p>
      </div>
      <RouterLink to="/practice/reverse" class="text-button"
        >链表综合练习</RouterLink
      >
    </header>
    <div class="exercise-filters">
      <div class="book-language" role="group" aria-label="练习语言">
        <button
          v-for="l in ['java', 'javascript'] as const"
          :key="l"
          :aria-pressed="language === l"
          :class="{ active: language === l }"
          @click="language = l"
        >
          {{ l === "java" ? "Java" : "JavaScript" }}
        </button>
      </div>
      <label
        ><span class="sr-only">搜索练习</span
        ><input v-model="query" placeholder="搜索 this、字符串、数组…" /></label
      ><select v-model="topic" aria-label="练习知识点">
        <option value="all">全部知识点</option>
        <option v-for="t in topics" :key="t">{{ t }}</option></select
      ><button
        v-if="current"
        class="text-button"
        @click="
          selected = '';
          router.replace({ query: { language } });
        "
      >
        返回题目目录
      </button>
    </div>
    <p v-if="loading">正在读取题库…</p>
    <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
    <div v-if="!current" class="exercise-catalog">
      <button
        v-for="e in filtered"
        :key="e.id"
        class="exercise-tile"
        @click="select(e)"
      >
        <small>{{ e.topic }}</small>
        <h2>{{ e.title }}</h2>
        <p>{{ e.description }}</p>
        <span>{{ e.testCount }} 组测试 · 开始练习 →</span>
      </button>
      <p v-if="!filtered.length && !loading">
        没有匹配的练习。<button
          v-if="!s.user"
          class="text-button"
          @click="s.requireUser()"
        >
          登录后重试
        </button>
      </p>
    </div>
    <template v-else>
      <div class="practice-layout">
        <section class="problem-panel">
          <span class="tag">{{ current.topic }}</span>
          <h2>{{ current.title }}</h2>
          <p>{{ current.description }}</p>
          <div class="sample-box">
            <span>示例输入</span
            ><code>{{ JSON.stringify(current.example.input) }}</code
            ><span>期望返回</span
            ><code>{{ JSON.stringify(current.example.expected) }}</code>
          </div>
          <p>
            只填写给定方法或函数。真实运行
            {{ current.testCount }} 组测试，包含边界输入。
          </p>
          <button
            class="text-button"
            :disabled="hintCount >= current.hints.length"
            @click="hintCount++"
          >
            {{ hintCount ? "再给一点提示" : "需要一点提示" }}
          </button>
          <p v-for="(h, i) in current.hints.slice(0, hintCount)" :key="i">
            {{ h }}
          </p>
          <details
            @toggle="
              ($event.target as HTMLDetailsElement).open &&
              !solutionViewed &&
              showSolution()
            "
          >
            <summary>主动查看参考实现</summary>
            <pre v-if="solution" class="exercise-solution">{{ solution }}</pre>
            <p>查看答案后仍可练习，本次证据会标记为“查看答案后验证”。</p>
          </details>
        </section>
        <section class="practice-editor">
          <header class="panel-bar">
            <strong>你的实现</strong
            ><span>{{ language === "java" ? "Java 21" : "Node.js 22" }}</span>
          </header>
          <Editor v-model="code" :language="language" :read-only="busy" />
          <footer class="editor-footer">
            <button
              class="text-button"
              :disabled="busy"
              @click="
                code = current.starter[language];
                result = null;
              "
            >
              恢复骨架</button
            ><button class="button primary" :disabled="busy" @click="submit">
              {{ busy ? "运行并验证中…" : "运行并验证" }}
            </button>
          </footer>
        </section>
      </div>
      <section v-if="result" class="exercise-results" aria-live="polite">
        <h2>{{ result.passed ? "本组测试通过" : "还有输入未通过" }}</h2>
        <p>{{ result.evidence }}。一次通过不能证明所有情境都已掌握。</p>
        <table>
          <thead>
            <tr>
              <th>输入</th>
              <th>期望</th>
              <th>实际</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in result.tests" :key="i">
              <td>
                <code>{{ JSON.stringify(t.input) }}</code>
              </td>
              <td>
                <code>{{ JSON.stringify(t.expected) }}</code>
              </td>
              <td>
                <code>{{ JSON.stringify(t.actual) }}</code>
              </td>
              <td>{{ t.passed ? "通过" : "未通过" }}</td>
            </tr>
          </tbody>
        </table>
        <pre v-if="result.execution.stderr">{{ result.execution.stderr }}</pre>
      </section>
      <CoachPanel
        mode="practice"
        :topic="current.title"
        :course-id="current.id"
        :context="context"
      />
    </template>
    <footer class="exercise-provenance">
      本站原创练习与测试。覆盖行为不等于证明实现方式；对象关系和执行机制可到实验室检查。
    </footer>
  </main>
</template>
