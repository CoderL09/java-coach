<script setup lang="ts">
import { computed, ref, watch, useId } from "vue";
import type { State } from "../curriculum";
const props = defineProps<{
  state: State;
  previous?: State;
  preview?: boolean;
}>();
const selected = ref("");
const arrowId = "state-arrow-" + useId();
function inspectVariable(name: string, value: string) {
  selected.value = name + "：" + (props.preview ? "待执行，暂无运行值" : value);
}
function inspectObject(id: string) {
  selected.value = props.preview
    ? id + " 是预计创建的对象，尚无运行时字段值。"
    : id + " 是对象身份标签。内部列出字段及其当前值。";
}
const entries = computed(() => Object.entries(props.state.vars || {}));
const changed = (name: string, value: string) =>
  !props.preview && props.previous?.vars?.[name] !== value;
const fieldChanged = (id: string, name: string, value: string) =>
  !props.preview &&
  props.previous?.objects?.find((o) => o.id === id)?.fields[name] !== value;
const objects = computed(() => props.state.objects || []);
const links = computed(() => {
  const result: {
    from: string;
    to: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }[] = [];
  entries.value.forEach(([name, value], i) => {
    const k = objects.value.findIndex((o) => "→ " + o.id === value);
    if (k >= 0)
      result.push({
        from: name,
        to: objects.value[k].id,
        x1: 175,
        y1: 52 + i * 48,
        x2: 340,
        y2: 60 + k * 108,
      });
  });
  objects.value.forEach((o, i) =>
    Object.entries(o.fields).forEach(([name, value], j) => {
      const k = objects.value.findIndex((t) => "→ " + t.id === value);
      if (k >= 0)
        result.push({
          from: o.id + "." + name,
          to: objects.value[k].id,
          x1: 558,
          y1: 73 + i * 108 + j * 22,
          x2: 558,
          y2: 45 + k * 108,
        });
    }),
  );
  return result;
});
const height = computed(() =>
  Math.max(
    150,
    entries.value.length * 48 + 35,
    objects.value.length * 108 + 25,
  ),
);
watch(
  () => props.state,
  () => (selected.value = ""),
);
</script>
<template>
  <div class="state-stage" :class="{ preview }">
    <div class="state-key">
      <span>{{ preview ? "未执行 · 结构预览" : "执行后的教学状态" }}</span
      ><span>对象编号 ≠ 物理地址</span>
    </div>
    <div v-if="state.stack?.length" class="call-stack">
      <span>调用关系 · 后进入的调用在下方</span>
      <div
        v-for="(f, i) in state.stack"
        :key="i"
        :class="{ current: i === state.stack.length - 1 }"
      >
        {{ f }}
      </div>
    </div>
    <svg
      v-if="entries.length || objects.length"
      :viewBox="`0 0 620 ${height}`"
      role="group"
      aria-label="变量与对象关系图"
      class="state-svg"
    >
      <defs>
        <marker
          :id="arrowId"
          markerWidth="7"
          markerHeight="7"
          refX="7"
          refY="3.5"
          orient="auto"
        >
          <path d="M0 0 L7 3.5 L0 7" fill="var(--cyan)" />
        </marker>
      </defs>
      <text x="12" y="19" class="svg-label">
        {{ preview ? "变量声明（待执行）" : "当前可见变量 / 调用状态" }}
      </text>
      <text v-if="objects.length" x="340" y="19" class="svg-label">
        对象与字段 · 语言层模型
      </text>
      <g
        v-for="([name, value], i) in entries"
        :key="name"
        @click="inspectVariable(name, value)"
        @keydown.enter="inspectVariable(name, value)"
        @keydown.space.prevent="inspectVariable(name, value)"
        role="button"
        tabindex="0"
        :aria-label="'查看变量 ' + name"
        class="state-variable"
      >
        <rect
          x="12"
          :y="32 + i * 48"
          width="163"
          height="37"
          rx="6"
          :class="{ changed: changed(name, value) }"
        />
        <text x="23" :y="56 + i * 48">{{ name }}</text>
        <text x="163" :y="56 + i * 48" text-anchor="end" class="svg-value">
          {{ preview ? "待执行" : value }}
        </text>
      </g>
      <path
        v-for="(l, i) in links"
        v-show="!preview"
        :key="i"
        :d="
          l.x1 > 500
            ? `M${l.x1} ${l.y1} C610 ${l.y1} 610 ${l.y2} ${l.x2} ${l.y2}`
            : `M${l.x1} ${l.y1} C245 ${l.y1} 265 ${l.y2} ${l.x2} ${l.y2}`
        "
        class="reference-path"
        :marker-end="`url(#${arrowId})`"
      />
      <g
        v-for="(o, i) in objects"
        :key="o.id"
        @click="inspectObject(o.id)"
        @keydown.enter="inspectObject(o.id)"
        @keydown.space.prevent="inspectObject(o.id)"
        role="button"
        tabindex="0"
        :aria-label="'查看对象 ' + o.id"
      >
        <rect
          x="340"
          :y="32 + i * 108"
          width="218"
          height="90"
          rx="9"
          class="object-box"
        />
        <text x="355" :y="53 + i * 108" class="svg-label">
          {{ o.id }}{{ preview ? " · 预计创建" : "" }}
        </text>
        <text
          v-for="([name, value], j) in Object.entries(o.fields)"
          :key="name"
          x="355"
          :y="77 + i * 108 + j * 22"
          :class="{ 'field-changed': fieldChanged(o.id, name, value) }"
        >
          {{ name }} : {{ preview ? "待执行" : value }}
        </text>
      </g>
    </svg>
    <div v-if="state.cells" class="array-stage">
      <span>逻辑位置 · 左到右编号</span>
      <div class="array-cells">
        <button
          v-for="(v, i) in state.cells"
          :key="i"
          :class="{ active: !preview && state.active?.includes(i) }"
          @click="
            selected = '下标 ' + i + ' 的元素：' + (preview ? '待执行' : v)
          "
        >
          <small>{{ i }}</small
          ><strong>{{ preview ? "?" : v }}</strong>
        </button>
        <p v-if="!state.cells.length">空结构</p>
      </div>
    </div>
    <div v-if="state.tasks?.length && !preview" class="task-timeline">
      <div v-for="(t, i) in state.tasks" :key="i">
        <span>{{ i + 1 }}</span
        >{{ t }}
      </div>
    </div>
    <p v-if="selected" class="state-inspector" role="status">{{ selected }}</p>
    <p class="state-caption">
      此图解释本课示例的关系与顺序。它不表示物理地址、对象实际尺寸或引擎优化后的布局。
    </p>
  </div>
</template>
