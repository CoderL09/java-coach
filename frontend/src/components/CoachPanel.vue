<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  computed,
  nextTick,
} from "vue";
import {
  Sparkles,
  Send,
  BookmarkPlus,
  RotateCcw,
  LoaderCircle,
  History,
} from "lucide-vue-next";
import { api } from "../api";
import { useCoach } from "../store";
import { useRoute } from "vue-router";
import TextExplanation from "./TextExplanation.vue";
const props = defineProps<{
  mode: "learn" | "practice" | "runtime";
  topic: string;
  context: string;
  courseId?: string;
}>();
const s = useCoach(),
  message = ref(""),
  turns = ref<{ question: string; answer: string; context?: string }[]>([]),
  threadId = ref(""),
  busy = ref(false),
  error = ref(""),
  status = ref<any>(null),
  histories = ref<any[]>([]),
  historyOpen = ref(false),
  saving = ref(-1),
  scroll = ref<HTMLElement>();
const route = useRoute();
const expanded = ref(false);
let alive = true,
  generation = 0;
const placeholders = computed(() =>
  props.mode === "practice"
    ? "先说说你准备怎么做。没有思路也可以直接告诉教练。"
    : "你想弄清哪一句代码、哪个变量，或哪一次状态变化？",
);
const suggestions = computed(() =>
  props.mode === "practice"
    ? [
        "我的思路是先遍历链表，再逐个修改 next。这样有什么风险？",
        "我没有思路，请只带我完成第一小步。",
      ]
    : [
        "用一个更简单的例子解释当前知识。",
        "当前这一步执行前后，哪些值或引用发生变化？",
        "对照 Java 和 JavaScript，解释这里的差异。",
      ],
);
function reset() {
  if (busy.value) return;
  generation++;
  turns.value = [];
  threadId.value = "";
  error.value = "";
  message.value = "";
}
watch([() => props.mode, () => props.topic], () => {
  generation++;
  turns.value = [];
  threadId.value = "";
  message.value = "";
  error.value = "";
});
watch(
  () => s.user,
  () => {
    generation++;
    turns.value = [];
    threadId.value = "";
    histories.value = [];
    if (s.user) restoreQuery();
  },
);
onMounted(async () => {
  if (s.user) {
    await loadStatus();
    await restoreQuery();
  }
});
onBeforeUnmount(() => {
  alive = false;
});
watch(
  () => route.query.coachThread,
  () => {
    if (s.user) restoreQuery();
  },
);
async function loadStatus() {
  try {
    status.value = await api("/coach/status");
  } catch (e) {
    error.value = (e as Error).message;
  }
}
async function history() {
  if (!s.requireUser()) return;
  try {
    histories.value = await api("/coach/threads");
    historyOpen.value = !historyOpen.value;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
async function restore(row: any) {
  if (busy.value) return;
  try {
    const r = await api("/coach/threads/" + row.id);
    threadId.value = row.id;
    turns.value = r.turns;
    historyOpen.value = false;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
async function restoreQuery() {
  if (!route.query.coachThread) return;
  try {
    const r = await api(
      "/coach/threads/" + encodeURIComponent(String(route.query.coachThread)),
    );
    if (r.thread.mode !== props.mode || r.thread.topic !== props.topic) return;
    threadId.value = r.thread.id;
    turns.value = r.turns;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
async function ask() {
  if (!message.value.trim() || busy.value || !s.requireUser()) return;
  busy.value = true;
  error.value = "";
  const token = generation,
    question = message.value.trim(),
    context = props.context.slice(0, 16000);
  try {
    const r = await api("/coach/ask", "POST", {
      threadId: threadId.value || null,
      mode: props.mode,
      topic: props.topic,
      context,
      message: question,
    });
    if (alive && token === generation) {
      threadId.value = r.threadId;
      turns.value.push({ question, answer: r.answer, context });
      message.value = "";
      await nextTick();
      const last = scroll.value?.querySelector<HTMLElement>(
        ".coach-turn:last-of-type",
      );
      if (scroll.value && last) scroll.value.scrollTop = last.offsetTop;
    }
  } catch (e) {
    if (alive && token === generation) error.value = (e as Error).message;
  } finally {
    if (alive) busy.value = false;
  }
}
async function save(i: number) {
  if (!s.requireUser()) return;
  saving.value = i;
  try {
    const t = turns.value[i];
    await api("/records", "POST", {
      topic: "coach",
      title: props.topic.slice(0, 100) + " · 教练解释",
      kind: "NOTE",
      snapshot: {
        kind: "coach",
        courseId: props.courseId,
        threadId: threadId.value,
        explanation: t.answer,
        question: t.question,
        source: t.context || props.context,
        model: "AI 解释供理解与验证，不自动代表掌握。",
      },
    });
    s.notify("问题、上下文与解释已保存到学习记录");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = -1;
  }
}
</script>
<template>
  <section class="coach-panel" aria-label="AI 教练">
    <div class="coach-heading">
      <div>
        <Sparkles :size="18" />
        <h2>{{ mode === "practice" ? "先说说你的思路" : "问问教练" }}</h2>
        <span class="tag">DeepSeek</span>
      </div>
      <div>
        <button
          class="icon-button"
          aria-label="查看教练历史"
          :disabled="busy"
          @click="history"
        >
          <History :size="17" /></button
        ><button
          class="icon-button"
          aria-label="开启新对话"
          :disabled="busy"
          @click="reset"
        >
          <RotateCcw :size="17" />
        </button>
      </div>
    </div>
    <p class="coach-intro">
      {{
        mode === "practice"
          ? "先明确输入与目标，再告诉教练你准备怎么做。不会时，可以让教练从一个小任务带起。"
          : "结合本课代码和当前步骤提问。教练会解释原因；你可以继续用单步和修改来验证。"
      }}历史窗口显示最近 12 轮。
    </p>
    <div v-if="historyOpen" class="coach-history">
      <p
        v-if="
          !histories.filter((x) => x.mode === mode && x.topic === topic).length
        "
      >
        当前主题还没有历史对话。
      </p>
      <button
        v-for="h in histories.filter(
          (x) => x.mode === mode && x.topic === topic,
        )"
        :key="h.id"
        @click="restore(h)"
      >
        {{ h.topic }} · {{ new Date(h.createdAt).toLocaleString("zh-CN") }}
      </button>
    </div>
    <button
      v-if="turns.length"
      class="text-button expand-explanation"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? "收起解释区域" : "展开完整解释区域" }}
    </button>
    <div
      ref="scroll"
      class="coach-turns"
      :class="{ expanded }"
      aria-live="polite"
      aria-relevant="additions"
    >
      <article v-for="(t, i) in turns" :key="i" class="coach-turn">
        <p class="coach-question">{{ t.question }}</p>
        <div class="coach-answer">
          <TextExplanation :text="t.answer" />
        </div>
        <button class="text-button" :disabled="saving === i" @click="save(i)">
          <BookmarkPlus :size="14" />{{
            saving === i ? "保存中…" : "保存这次解释"
          }}
        </button>
      </article>
      <p v-if="busy" class="coach-wait" role="status">
        <LoaderCircle class="spin" :size="16" />教练正在结合当前上下文回答…
      </p>
    </div>
    <div v-if="!turns.length" class="coach-suggestions">
      <button
        v-for="q in suggestions"
        :key="q"
        :disabled="busy"
        @click="message = q"
      >
        {{ q }}
      </button>
    </div>
    <form @submit.prevent="ask">
      <label class="sr-only" :for="'coach-' + mode">你的问题或思路</label
      ><textarea
        :id="'coach-' + mode"
        v-model="message"
        :placeholder="placeholders"
        maxlength="3000"
        rows="3"
        :disabled="busy"
      />
      <div class="coach-send">
        <small>仅发送当前上下文与最近对话。AI 解释需要运行验证。</small
        ><button class="button primary" :disabled="busy || !message.trim()">
          <Send :size="15" />{{ busy ? "回答中…" : "发送给教练" }}
        </button>
      </div>
    </form>
    <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
  </section>
</template>
