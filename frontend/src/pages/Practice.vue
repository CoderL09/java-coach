<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Play,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Lightbulb,
  LoaderCircle,
  Code2,
  RotateCcw,
} from "lucide-vue-next";
import Editor from "../components/Editor.vue";
import { api } from "../api";
import { useCoach } from "../store";
import CoachPanel from '../components/CoachPanel.vue';
const s = useCoach(),
  language = ref("javascript"),
  code = ref(""),
  busy = ref(false),
  error = ref(""),
  result = ref<any>(null),
  hint = ref(false),
  solution = ref(false);
const templates = {
  javascript:
    "function reverse(head) {\n  // 请返回反转后的头节点。\n  return head;\n}",
  java: "static Node reverse(Node head) {\n  // Node 包含 int value 与 Node next。\n  // 请返回反转后的头节点。\n  return head;\n}",
};
function reset() {
  code.value = templates[language.value as keyof typeof templates];
  result.value = null;
  error.value = "";
}
watch(language, reset);
reset();
async function submit() {
  if (!s.requireUser()) return;
  busy.value = true;
  error.value = "";
  try {
    result.value = await api("/practice/reverse", "POST", {
      language: language.value,
      source: code.value,
    });
    s.notify(
      result.value.passed
        ? "本组样例已通过，保存为练习验证"
        : "失败输入与解释已保存到学习记录",
    );
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main id="main" class="practice-page">
    <div class="page-heading">
      <div>
        <span class="small-label">准备好了，就自己试一次。</span>
        <h1>独立练习</h1>
        <p>把看懂的过程，变成你自己写出的代码。</p>
      </div>
      <RouterLink to="/lab/reverse" class="button secondary"
        >回到实验室<ArrowUpRight :size="15"
      /></RouterLink>
    </div>
    <div class="practice-layout">
      <section class="problem-panel">
        <div class="problem-meta">
          <span class="tag cyan">链表</span><span class="tag">基础</span>
        </div>
        <h2>反转一条单向链表</h2>
        <p>
          给定头节点 <code>head</code>，反转每个节点的
          <code>next</code> 连接，并返回新的头节点。
        </p>
        <div class="sample-box">
          <span>输入</span><code>1 → 2 → 3 → 4 → null</code><span>期望</span
          ><code>4 → 3 → 2 → 1 → null</code>
        </div>
        <h3>接口约定</h3>
        <p v-if="language === 'javascript'">
          节点为 <code>{ value, next }</code>，空链表为
          <code>null</code>。只编写 <code>reverse(head)</code> 函数。
        </p>
        <p v-else>
          平台提供 <code>Node</code> 类型，含 <code>int value</code> 和
          <code>Node next</code>。只编写静态方法 <code>reverse</code>。
        </p>
        <p>
          测试覆盖空链表、单节点、多节点和重复值。节点身份与节点值是两回事。
        </p>
        <button
          class="text-button hint-button"
          :aria-expanded="hint"
          @click="hint = !hint"
        >
          <Lightbulb :size="15" />{{ hint ? "收起提示" : "需要一点提示" }}
        </button>
        <div v-if="hint" class="hint-box">
          在改变一条连接前，先想一想：下一步要从哪里继续？用一个变量保存原来的后继。
        </div>
        <button
          class="text-button hint-button"
          :aria-expanded="solution"
          @click="solution = !solution"
        >
          {{ solution ? "收起参考思路" : "主动查看参考思路" }}
        </button>
        <div v-if="solution" class="hint-box">
          <p>
            维护 prev 和 current。循环中依次：保存 next → current.next 指向 prev
            → prev 移到 current → current 移到 next。最后返回 prev。
          </p>
          <p>看过思路只代表阅读完成；练习结果独立记录。</p>
        </div>
        <a
          class="external-problem"
          href="https://leetcode.com/problems/reverse-linked-list/"
          target="_blank"
          rel="noopener noreferrer"
          >LeetCode 206 原题<ArrowUpRight :size="14" /></a
        ><small>本站为独立练习，测试结果不会同步到 LeetCode。</small>
      </section>
      <section class="practice-editor">
        <div class="panel-bar">
          <span><Code2 :size="15" />你的实现</span
          ><label
            ><span class="sr-only">练习语言</span
            ><select v-model="language" :disabled="busy">
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select></label
          >
        </div>
        <Editor v-model="code" :language="language" />
        <div class="editor-footer">
          <button class="text-button" :disabled="busy" @click="reset">
            <RotateCcw :size="13" />恢复骨架</button
          ><button class="button primary" :disabled="busy" @click="submit">
            <LoaderCircle v-if="busy" class="spin" :size="15" /><Play
              v-else
              :size="13"
              fill="currentColor"
            />{{ busy ? "正在运行测试…" : "运行并验证" }}
          </button>
        </div>
        <p v-if="error" class="inline-alert" role="alert">{{ error }}</p>
        <section v-if="result" class="test-results">
          <div
            class="test-results-title"
            :class="result.passed ? 'success-text' : 'warning-text'"
          >
            <Check v-if="result.passed" :size="17" /><AlertTriangle
              v-else
              :size="17"
            />
            <h3>
              {{
                result.passed
                  ? "本组样例全部通过"
                  : "有些输入还没有得到正确结果"
              }}
            </h3>
          </div>
          <div v-for="(t, i) in result.tests" :key="i" class="test-row">
            <span class="test-status" :class="{ pass: t.passed }">{{
              t.passed ? "通过" : "未通过"
            }}</span
            ><code>{{ JSON.stringify(t.input) }}</code
            ><span>期望 {{ JSON.stringify(t.expected) }}</span
            ><span>实际 {{ JSON.stringify(t.actual) }}</span>
          </div>
          <pre v-if="result.execution.stderr" class="stderr">{{
            result.execution.stderr
          }}</pre>
          <RouterLink v-if="!result.passed" to="/records" class="text-button"
            >查看已保存的错误与解释<ArrowUpRight :size="14"
          /></RouterLink>
          <p v-else class="subtle">
            通过当前样例构成练习证据，不代表所有输入均已证明正确。
          </p>
        </section>
      </section>
    </div>
    <CoachPanel mode="practice" topic="反转单向链表" :context="JSON.stringify({goal:'反转无环单向链表，只改变 next 连接，返回新头',input:'1 → 2 → 3 → 4 → null',expected:'4 → 3 → 2 → 1 → null',language,source:code,lastTests:result,referenceAnswerOpened:solution})"/>
  </main>
</template>
