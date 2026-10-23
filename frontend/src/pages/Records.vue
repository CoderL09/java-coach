<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Search,
  NotebookPen,
  ArrowUpRight,
  BookmarkCheck,
  AlertTriangle,
  Save,
  LoaderCircle,
  ChevronRight,
} from "lucide-vue-next";
import { api } from "../api";
import { useCoach } from "../store";
import TextExplanation from "../components/TextExplanation.vue";
const s = useCoach(),
  route = useRoute(),
  records = ref<any[]>([]),
  selected = ref(""),
  query = ref(""),
  filter = ref("all"),
  note = ref(""),
  state = ref("OPEN"),
  busy = ref(false),
  error = ref("");
const filtered = computed(() =>
  records.value.filter(
    (r) =>
      (filter.value === "all" || r.kind === filter.value) &&
      (r.title + JSON.stringify(r.snapshot) + r.note)
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
);
const current = computed(() =>
  records.value.find((r) => r.id === selected.value),
);
const snapshot = computed(() => {
  try {
    return JSON.parse(current.value?.snapshot || "{}");
  } catch {
    return {};
  }
});
function choose(id: string) {
  selected.value = id;
  const r = records.value.find((r) => r.id === id);
  note.value = r?.note || "";
  state.value = r?.state || "OPEN";
  error.value = "";
}
async function load() {
  if (!s.user) return;
  busy.value = true;
  try {
    records.value = await api("/records");
    choose(
      String(route.query.id || selected.value || records.value[0]?.id || ""),
    );
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!current.value) return;
  busy.value = true;
  error.value = "";
  try {
    const updated = await api("/records/" + current.value.id, "PATCH", {
      state: state.value,
      note: note.value,
      version: current.value.version,
    });
    records.value = records.value.map((r) =>
      r.id === updated.id ? { ...r, ...updated } : r,
    );
    s.notify("笔记与理解状态已保存");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
function restore() {
  const p = snapshot.value;
  if (p.articleId)
    return (
      "/read/" +
      encodeURIComponent(p.articleId) +
      "?record=" +
      encodeURIComponent(current.value.id)
    );
  if (p.exerciseId)
    return (
      "/practice?exercise=" +
      encodeURIComponent(p.exerciseId) +
      "&language=" +
      encodeURIComponent(p.language || "javascript") +
      "&record=" +
      encodeURIComponent(current.value.id)
    );
  if (p.courseId)
    return (
      "/learn/" +
      encodeURIComponent(p.courseId) +
      (p.threadId
        ? "?coachThread=" + encodeURIComponent(p.threadId)
        : "?record=" + encodeURIComponent(current.value.id))
    );
  if (p.threadId)
    return "/practice?coachThread=" + encodeURIComponent(p.threadId);
  if (p.runtimeId) return "/runtime?id=" + encodeURIComponent(p.runtimeId);
  return (
    "/lab/" +
    (p.kind || "reverse") +
    "?" +
    new URLSearchParams({
      values: (p.values || [1, 2, 3, 4]).join(","),
      variant: p.variant || "correct",
      language: p.language || "javascript",
      target: String(p.target ?? 3),
    })
  );
}
function date(d: string) {
  return new Date(d).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
onMounted(load);
watch(() => s.user, load);
</script>
<template>
  <main id="main" class="records-page">
    <div class="page-heading">
      <div>
        <span class="small-label">让每次卡住，都有来处与出口。</span>
        <h1>你的理解，慢慢成形。</h1>
        <p>错误现场、详细解释和自己的想法，都留在这里。</p>
      </div>
      <RouterLink to="/practice" class="button secondary"
        >准备好了，去练习<ArrowUpRight :size="15"
      /></RouterLink>
    </div>
    <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
    <div v-if="!s.user" class="empty-panel">
      <NotebookPen :size="36" />
      <h2>为你的思考留一个位置</h2>
      <p>登录后保存实验步骤、错误与解释。</p>
      <button class="button primary" @click="s.authOpen = true">
        连接学习空间
      </button>
    </div>
    <div v-else-if="!records.length && !busy" class="empty-panel">
      <NotebookPen :size="36" />
      <h2>第一条记录，等你发现</h2>
      <p>在实验室保存某一步，或完成一次练习。失败现场会自动记录。</p>
      <RouterLink to="/lab/reverse" class="button primary"
        >打开实验室<ArrowUpRight :size="16"
      /></RouterLink>
    </div>
    <div v-else class="records-layout">
      <aside class="record-list">
        <label class="record-search"
          ><Search :size="15" /><input
            v-model="query"
            aria-label="搜索学习记录"
            placeholder="搜索知识、错误或笔记…"
        /></label>
        <div class="record-filters">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
            全部 {{ records.length }}</button
          ><button
            :class="{ active: filter === 'ERROR' }"
            @click="filter = 'ERROR'"
          >
            错误现场</button
          ><button
            :class="{ active: filter === 'NOTE' }"
            @click="filter = 'NOTE'"
          >
            学习笔记
          </button>
        </div>
        <button
          v-for="r in filtered"
          :key="r.id"
          class="record-item"
          :class="{ selected: selected === r.id }"
          @click="choose(r.id)"
        >
          <div class="record-item-top">
            <span :class="r.kind === 'ERROR' ? 'warning-text' : 'cyan-text'">{{
              r.kind === "ERROR" ? "错误现场" : "学习笔记"
            }}</span
            ><time>{{ date(r.createdAt) }}</time>
          </div>
          <h3>{{ r.title }}</h3>
          <span class="record-state"
            >{{
              r.state === "UNDERSTOOD"
                ? "自认为已理解"
                : r.state === "LEARNING"
                  ? "理解中"
                  : "待理解"
            }}<ChevronRight :size="13"
          /></span>
        </button>
        <p v-if="!filtered.length" class="empty-search">
          没有匹配的记录，试试其他关键词。
        </p>
      </aside>
      <article v-if="current" class="record-detail">
        <div class="record-detail-heading">
          <span
            class="tag"
            :class="current.kind === 'ERROR' ? 'amber' : 'cyan'"
            >{{
              current.kind === "ERROR" ? "从一次错误开始" : "保存的学习步骤"
            }}</span
          ><span class="subtle">{{ date(current.createdAt) }}</span>
        </div>
        <h2>{{ current.title }}</h2>
        <div v-if="snapshot.frame" class="saved-step">
          <code>{{ snapshot.frame.change }}</code
          ><span>教学步骤 {{ Number(snapshot.index) + 1 }}</span>
        </div>
        <template v-if="snapshot.question"
          ><h3>当时的问题</h3>
          <p>{{ snapshot.question }}</p></template
        >
        <h3>{{ snapshot.threadId ? "教练的解释" : "发生了什么？" }}</h3>
        <TextExplanation
          :text="snapshot.explanation || snapshot.frame?.explanation || ''"
        />
        <div v-if="snapshot.tests" class="record-test-evidence">
          <div v-for="(t, i) in snapshot.tests" :key="i">
            <span :class="t.passed ? 'success-text' : 'warning-text'">{{
              t.passed ? "通过" : "失败"
            }}</span
            ><code>{{ JSON.stringify(t.input) }}</code
            ><span
              >期望 {{ JSON.stringify(t.expected) }} / 实际
              {{ JSON.stringify(t.actual) }}</span
            >
          </div>
        </div>
        <pre v-if="snapshot.stderr" class="stderr">{{ snapshot.stderr }}</pre>
        <h3>理解它的关键</h3>
        <p>{{ snapshot.model }}</p>
        <h3>改变之后，试着解释</h3>
        <p>{{ snapshot.counter }}</p>
        <div class="record-actions">
          <RouterLink :to="restore()" class="button secondary"
            >恢复相关实验<ArrowUpRight :size="14" /></RouterLink
          ><RouterLink to="/practice" class="text-button"
            >自愿进入练习<ArrowUpRight :size="14"
          /></RouterLink>
        </div>
        <details class="saved-source">
          <summary>查看发生时的代码</summary>
          <pre>{{ snapshot.source }}</pre>
        </details>
        <div class="personal-note">
          <label for="personal-note">写下你自己的理解</label
          ><textarea
            id="personal-note"
            v-model="note"
            rows="4"
            maxlength="10000"
            placeholder="用自己的话解释原因，或记下还没弄懂的地方…"
          ></textarea>
          <div class="note-controls">
            <label
              >当前状态<select v-model="state" aria-label="当前状态">
                <option value="OPEN">待理解</option>
                <option value="LEARNING">理解中</option>
                <option value="UNDERSTOOD">自认为已理解</option>
              </select></label
            ><button class="button primary" :disabled="busy" @click="save">
              <LoaderCircle v-if="busy" class="spin" :size="15" /><Save
                v-else
                :size="15"
              />保存理解
            </button>
          </div>
          <small>阅读完成、自己的判断与练习验证分别记录。</small>
        </div>
      </article>
    </div>
  </main>
</template>
