<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ text: string }>();
const parts = computed(() =>
  props.text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((t) =>
      t.startsWith("**") && t.endsWith("**")
        ? { kind: "strong", text: t.slice(2, -2) }
        : t.startsWith("`") && t.endsWith("`")
          ? { kind: "code", text: t.slice(1, -1) }
          : { kind: "text", text: t },
    ),
);
</script>
<template>
  <template v-for="(p, i) in parts" :key="i"
    ><strong v-if="p.kind === 'strong'">{{ p.text }}</strong
    ><code v-else-if="p.kind === 'code'">{{ p.text }}</code
    ><template v-else>{{ p.text }}</template></template
  >
</template>
