<script setup lang="ts">
import { computed } from "vue";
import type { RuntimeFrame } from "../runtime";
import { outputAt } from "../runtime";
const props = defineProps<{
  frames: RuntimeFrame[];
  index: number;
  active: boolean;
}>();
const current = computed(() =>
  props.active ? outputAt(props.frames, props.index) : undefined,
);
</script>
<template>
  <section class="step-output" aria-label="当前步骤的输出">
    <header><strong>当前步骤的输出</strong><small>随单步回放</small></header>
    <template v-if="current">
      <pre aria-live="polite">{{ current.stdout || "（尚无输出）" }}</pre>
      <pre v-if="current.stderr" class="stderr">{{ current.stderr }}</pre>
    </template>
    <p v-else>
      {{
        active
          ? "此历史轨迹未记录逐步输出，请重新运行。"
          : "运行后，逐步查看已经产生的输出。"
      }}
    </p>
  </section>
</template>
