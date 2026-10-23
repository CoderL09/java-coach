<script setup lang="ts">
import { computed } from "vue";
import MemoryWorld from "./MemoryDiagram.vue";
import type { State } from "../curriculum";
import type { Language } from "../books";
import type { RuntimeFrame } from "../runtime";
const props = defineProps<{
  state: State;
  previous?: State;
  language: Language;
  source: string;
  preview: boolean;
  kind: string;
  line: number;
}>();
const typename = computed(() =>
  props.language === "javascript"
    ? "Object"
    : props.kind === "this"
      ? "Account"
      : props.kind === "linked"
        ? "Node"
        : "Box",
);
function decode(v: string): unknown {
  if (v.startsWith("→ ")) return { ref: v.slice(2) };
  if (v === "null") return null;
  if (/^-?\d+$/.test(v)) return props.language === "java" ? v : Number(v);
  return v;
}
function type(v: string) {
  return v.startsWith("→ ") || v === "null"
    ? typename.value
    : /^-?\d+$/.test(v)
      ? props.language === "java"
        ? "int"
        : "number"
      : props.language === "java"
        ? "String"
        : "string";
}
function frame(state: State): RuntimeFrame {
  const method =
    props.kind === "linked"
      ? props.language === "java"
        ? "Main.reverse"
        : "reverse"
      : props.language === "java"
        ? "Main.main"
        : "experiment（教学作用域）";
  const heap = (state.objects || []).map((o) => ({
    id: o.id,
    type: typename.value,
    fields: Object.fromEntries(
      Object.entries(o.fields).map(([k, v]) => [k, decode(v)]),
    ),
    fieldTypes: Object.fromEntries(
      Object.entries(o.fields).map(([k, v]) => [k, type(v)]),
    ),
    limited: false,
  }));
  const locals = Object.entries(state.vars || {}).map(([name, v]) => ({
    name,
    type: type(v),
    value: decode(v),
  }));
  const stack =
    props.kind === "this" && state.vars?.this
      ? [
          {
            method: props.language === "java" ? "Account.read" : "read",
            line: props.line,
            depth: 2,
            locals: locals.filter((l) => l.name === "this"),
          },
          {
            method: props.language === "java" ? "Main.main" : "顶层脚本",
            line: props.line,
            depth: 1,
            locals: locals.filter((l) => l.name !== "this"),
          },
        ]
      : [{ method, line: props.line, depth: 1, locals }];
  return {
    index: 0,
    line: props.line,
    method,
    thread: "教学模型",
    event: "model-state",
    message: "",
    stack,
    heap,
    statics: [],
    stackTruncated: false,
    classes: [
      {
        name: typename.value + " · 模型字段定义",
        fields: Object.entries(heap[0]?.fieldTypes || {}).map(
          ([name, type]) => ({ name, type, static: false }),
        ),
        methods: [],
        limited: false,
      },
    ],
  };
}
const current = computed(() => frame(props.state)),
  before = computed(() => (props.previous ? frame(props.previous) : undefined));
</script>
<template>
  <MemoryWorld
    :frame="current"
    :previous="before"
    :language="language"
    :source="source"
    :preview="preview"
    teaching
  />
</template>
