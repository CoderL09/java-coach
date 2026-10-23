<script setup lang="ts">
import { computed } from "vue";
import { explanationBlocks } from "../explanation";
import InlineExplanation from "./InlineExplanation.vue";
const props = defineProps<{ text: string }>();
const blocks = computed(() => explanationBlocks(props.text));
</script>
<template>
  <div class="text-explanation">
    <template v-for="(b, i) in blocks" :key="i">
      <pre v-if="b.kind === 'code'"><code>{{b.text}}</code></pre>
      <h3 v-else-if="b.kind === 'heading'">
        <InlineExplanation :text="b.text || ''" />
      </h3>
      <blockquote v-else-if="b.kind === 'quote'">
        <InlineExplanation :text="b.text || ''" />
      </blockquote>
      <ul v-else-if="b.kind === 'list'">
        <li v-for="(item, j) in b.items" :key="j">
          <InlineExplanation :text="item" />
        </li>
      </ul>
      <div v-else-if="b.kind === 'table'" class="explanation-table">
        <table>
          <thead>
            <tr>
              <th v-for="(cell, j) in b.rows?.[0]" :key="j">
                <InlineExplanation :text="cell" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, j) in b.rows?.slice(1)" :key="j">
              <td v-for="(cell, k) in row" :key="k">
                <InlineExplanation :text="cell" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else><InlineExplanation :text="b.text || ''" /></p
    ></template>
  </div>
</template>
