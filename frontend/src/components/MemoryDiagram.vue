<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  useId,
} from "vue";
import type { RuntimeFrame } from "../runtime";
import { displayValue } from "../runtime";
import type { Language } from "../books";
const props = defineProps<{
  frame?: RuntimeFrame;
  previous?: RuntimeFrame;
  language: Language;
  source: string;
  preview: boolean;
  teaching?: boolean;
}>();
const world = ref<HTMLElement>(),
  expanded = ref(false),
  selected = ref("");
const edges = ref<{ path: string; label: string }[]>([]),
  bounds = ref({ width: 1, height: 1 });
const marker = "memory-arrow-" + useId();
let observer: ResizeObserver | undefined;
const short = (s: string) =>
  s.replace(/java\.lang\./g, "").replace(/Main\$/g, "");
const refTo = (v: unknown): string | undefined =>
  typeof v === "object" && v && "ref" in v
    ? String((v as { ref: string }).ref)
    : undefined;
const label = (id: string) => "对象 " + id.replace(/^o/, "");
const value = (v: unknown, t = "") =>
  refTo(v) ? label(refTo(v)!) : displayValue(v, t);
const frames = computed(() =>
  props.preview
    ? []
    : (props.frame?.stack || []).map((f) => ({
        ...f,
        locals: f.locals.filter(
          (l) =>
            expanded.value ||
            !(
              props.language === "java" &&
              l.name === "args" &&
              l.type === "java.lang.String[]"
            ),
        ),
      })),
);
const objects = computed(() => {
  if (props.preview) return [];
  const heap = props.frame?.heap || [];
  if (expanded.value) return heap;
  const ids = new Set<string>();
  const visit = (v: unknown) => {
    const id = refTo(v);
    if (!id || ids.has(id)) return;
    ids.add(id);
    const o = heap.find((x) => x.id === id);
    if (o) Object.values(o.fields).forEach(visit);
  };
  frames.value.forEach((f) => f.locals.forEach((l) => visit(l.value)));
  props.frame?.statics.forEach((l) => visit(l.value));
  return heap.filter((o) => ids.has(o.id));
});
const classes = computed(() =>
  props.preview ? [] : props.frame?.classes || [],
);
const methodName = (s: string) =>
  short(s)
    .replace(/\.\<init\>$/, " 构造方法")
    .replace(/\.\<clinit\>$/, " 类初始化");
function changed(id: string, n: string, v: unknown) {
  const o = props.previous?.heap.find((o) => o.id === id);
  return !!o && JSON.stringify(o.fields[n]) !== JSON.stringify(v);
}
function localChanged(d: number, n: string, v: unknown) {
  const l = props.previous?.stack
    .find((f) => f.depth === d)
    ?.locals.find((l) => l.name === n);
  return !!l && JSON.stringify(l.value) !== JSON.stringify(v);
}
const active = (c: string, m: string) => props.frame?.method === c + "." + m;
function signature(
  c: string,
  m: {
    name: string;
    abstract?: boolean;
    static: boolean;
    parameters: string[];
  },
) {
  const name =
    m.name === "<init>"
      ? short(c)
      : m.name === "<clinit>"
        ? "类初始化"
        : m.name;
  return (
    (m.abstract ? "abstract " : "") +
    (m.static ? "static " : "") +
    name +
    "(" +
    m.parameters.map(short).join(", ") +
    ")"
  );
}
async function measure() {
  await nextTick();
  const el = world.value;
  if (!el) return;
  const origin = el.getBoundingClientRect();
  bounds.value = { width: el.clientWidth, height: el.scrollHeight };
  const targets = new Map(
    [...el.querySelectorAll<HTMLElement>("[data-object]")].map((n) => [
      n.dataset.object,
      n,
    ]),
  );
  const offsets = new Map<string, number>();
  const paths: typeof edges.value = [];
  for (const n of el.querySelectorAll<HTMLElement>("[data-reference]")) {
    const id = n.dataset.reference!,
      t = targets.get(id);
    if (!t) continue;
    const a = n.getBoundingClientRect(),
      b = t.getBoundingClientRect(),
      count = offsets.get(id) || 0;
    offsets.set(id, count + 1);
    const x1 = a.right - origin.left,
      y1 = a.top + a.height / 2 - origin.top,
      x2 = b.left - origin.left,
      y2 = b.top + Math.min(24 + count * 18, b.height - 8) - origin.top;
    paths.push({
      label: (n.getAttribute("aria-label") || "引用") + " 指向 " + label(id),
      path: n.closest(".heap-region")
        ? `M${x1} ${y1} C${Math.max(x1, x2) + 20} ${y1} ${Math.max(x1, x2) + 20} ${y2} ${x2} ${y2}`
        : `M${x1} ${y1} L${x2} ${y2}`,
    });
  }
  edges.value = paths;
}
watch(
  () => [props.frame, props.preview, props.source, expanded.value],
  () => {
    selected.value = "";
    measure();
  },
  { flush: "post" },
);
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (world.value) observer.observe(world.value);
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div class="memory-map-shell">
    <div ref="world" class="memory-world flat-memory">
      <section class="memory-region stack-region" aria-label="栈内存">
        <div class="stack-frames">
          <article
            v-for="(f, i) in frames"
            :key="f.depth"
            class="call-frame"
            :class="{ current: i === 0 }"
          >
            <header>
              <strong>{{ methodName(f.method) }}()</strong
              ><small v-if="i === 0">当前执行</small>
            </header>
            <small v-if="!f.locals.length" class="memory-empty"
              >当前未展示局部变量</small
            >
            <div
              v-for="l in f.locals"
              :key="l.name"
              class="memory-local"
              :class="{ changed: localChanged(f.depth, l.name, l.value) }"
            >
              <span class="local-name"
                ><small>{{ short(l.type) }}</small
                ><code>{{ l.name }}</code></span
              ><button
                class="memory-value"
                :data-reference="refTo(l.value)"
                :aria-label="l.name + ' ' + value(l.value, l.type)"
                @click="
                  selected =
                    short(l.type) +
                    ' ' +
                    l.name +
                    ' = ' +
                    value(l.value, l.type)
                "
              >
                {{ value(l.value, l.type) }}
              </button>
            </div>
            <small class="frame-location"
              >第 {{ f.line }} 行{{
                teaching
                  ? " · 本步状态"
                  : frame?.semantics === "at-location"
                    ? " · 第 " + (f.column || 1) + " 列暂停"
                    : " · 执行前"
              }}</small
            >
          </article>
        </div>
        <p v-if="!preview && !frames.length" class="memory-empty">
          当前没有执行中的用户方法
        </p>
        <h2 class="memory-region-title">
          {{ language === "java" ? "栈内存" : "调用栈与作用域" }}
        </h2>
      </section>
      <section
        class="memory-region heap-region"
        :aria-label="language === 'java' ? '堆内存' : '对象存储'"
      >
        <p v-if="!preview && !objects.length" class="memory-empty">
          当前没有展开的用户对象
        </p>
        <article
          v-for="o in objects"
          :key="o.id"
          class="memory-object"
          :data-object="o.id"
        >
          <div class="object-identity">{{ label(o.id) }}</div>
          <header>
            <strong>{{ short(o.type) }}</strong
            ><small v-if="o.length !== undefined">长度 {{ o.length }}</small>
          </header>
          <div class="object-fields">
            <div
              v-for="(v, n) in o.fields"
              :key="n"
              class="object-field"
              :class="{ changed: changed(o.id, String(n), v) }"
            >
              <small>{{ short(o.fieldTypes?.[n] || "") }}</small
              ><code>{{ n }}</code
              ><button
                :data-reference="refTo(v)"
                :aria-label="
                  label(o.id) + '.' + n + ' ' + value(v, o.fieldTypes?.[n])
                "
                @click="
                  selected = String(n) + ' = ' + value(v, o.fieldTypes?.[n])
                "
              >
                {{ value(v, o.fieldTypes?.[n]) }}
              </button>
            </div>
            <small v-if="!Object.keys(o.fields).length" class="empty-fields">{{
              o.limited || o.unavailable ? "字段未展开" : "没有实例字段"
            }}</small>
          </div>
          <small v-if="o.limited || o.unavailable" class="object-limit"
            >只显示已采集部分</small
          >
        </article>
        <h2 class="memory-region-title">
          {{ language === "java" ? "堆内存" : "对象存储" }}
        </h2>
      </section>
      <section
        class="memory-region class-region"
        :aria-label="language === 'java' ? '方法区' : '已观测函数'"
      >
        <article v-for="c in classes" :key="c.name" class="class-definition">
          <header>
            <strong>{{ short(c.name) }}</strong
            ><small v-if="c.superclass && c.superclass !== 'java.lang.Object'"
              >extends {{ short(c.superclass) }}</small
            >
          </header>
          <div class="class-fields">
            <span v-for="f in c.fields" :key="f.name"
              ><small>{{ f.static ? "static " : "" }}{{ short(f.type) }}</small>
              {{ f.name }}</span
            >
          </div>
          <div class="class-methods">
            <code
              v-for="m in c.methods.filter(
                (m) =>
                  expanded || !m.name.startsWith('<') || active(c.name, m.name),
              )"
              :key="m.name + m.parameters.join(',')"
              :class="{ active: active(c.name, m.name) }"
              >{{ signature(c.name, m) }}</code
            >
          </div>
          <small v-if="c.limited" class="object-limit">类成员未全部展开</small>
        </article>
        <div v-if="frame?.statics.length" class="static-values">
          <strong>静态字段</strong>
          <div v-for="v in frame.statics" :key="v.name">
            <code>{{ short(v.name) }}</code
            ><button :data-reference="refTo(v.value)">
              {{ value(v.value, v.type) }}
            </button>
          </div>
        </div>
        <h2 class="memory-region-title">
          {{ language === "java" ? "方法区" : "已观测函数" }}
        </h2>
      </section>
      <svg
        v-if="!preview"
        class="memory-connections"
        :viewBox="`0 0 ${bounds.width} ${bounds.height}`"
        :width="bounds.width"
        :height="bounds.height"
        role="img"
        aria-label="引用连线"
      >
        <defs>
          <marker
            :id="marker"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <circle cx="3" cy="3" r="2.3" fill="var(--memory-ink)" />
          </marker>
        </defs>
        <path
          v-for="(e, i) in edges"
          :key="i"
          :d="e.path"
          :marker-end="`url(#${marker})`"
        >
          <title>{{ e.label }}</title>
        </path>
      </svg>
      <p v-if="preview" class="memory-unstarted">
        运行代码后，在这里逐步查看内存变化。
      </p>
    </div>
    <div v-if="selected" class="memory-selection" role="status">
      {{ selected
      }}<button @click="selected = ''" aria-label="关闭元素说明">×</button>
    </div>
    <footer class="memory-map-caption">
      <span
        >{{ teaching ? "教学模型" : "已采集运行状态" }} · 对象编号不是物理地址{{
          language === "java" ? " · 仅展开用户对象与类信息" : ""
        }}</span
      ><button
        v-if="!preview"
        @click="expanded = !expanded"
        :aria-pressed="expanded"
      >
        {{ expanded ? "收起细节" : "展开细节" }}
      </button>
    </footer>
  </div>
</template>
