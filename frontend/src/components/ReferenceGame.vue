<script setup lang="ts">
import { computed, ref } from "vue";
import StateStage from "./StateStage.vue";
import type { State } from "../curriculum";
const mode = ref<"shared" | "copy">("shared"),
  target = ref<"shared" | "copy">("copy"),
  ran = ref(false),
  value = ref(9),
  attempts = ref(0);
const state = computed<State>(() => ({
  vars: { a: "→ o0", b: mode.value === "shared" ? "→ o0" : "→ o1" },
  objects: [
    {
      id: "o0",
      fields: {
        value: ran.value && mode.value === "shared" ? String(value.value) : "1",
      },
    },
    ...(mode.value === "copy"
      ? [{ id: "o1", fields: { value: ran.value ? String(value.value) : "1" } }]
      : []),
  ],
}));
const success = computed(() => ran.value && mode.value === target.value);
function choose(v: "shared" | "copy") {
  mode.value = v;
  ran.value = false;
}
function next() {
  target.value = target.value === "copy" ? "shared" : "copy";
  ran.value = false;
  attempts.value = 0;
}
</script>
<template>
  <section class="reference-game">
    <div>
      <span class="tag">动手关卡 · 引用实验</span>
      <h2>
        {{
          target === "copy"
            ? "让 b 改变，a 保持原样"
            : "让一次修改，通过两个变量都能看见"
        }}
      </h2>
      <p>
        初始 a.value = 1。选择 b 的创建方式，再执行 b.value 的修改。{{
          target === "copy"
            ? "目标：a.value 仍为 1，b.value 为新值。"
            : "目标：a.value 与 b.value 都是新值。"
        }}
      </p>
    </div>
    <div class="reference-game-layout">
      <div>
        <h3>你准备怎样创建 b？</h3>
        <button
          :class="{ chosen: mode === 'shared' }"
          @click="choose('shared')"
        >
          复制 a 的引用<code
            >Java: Box b = a;<br />JS: const b = a;</code
          ></button
        ><button :class="{ chosen: mode === 'copy' }" @click="choose('copy')">
          创建一个独立对象<code
            >Java: Box b = new Box(a.value);<br />JS: const b = { value: a.value
            };</code
          ></button
        ><label
          >准备写入的值<select v-model.number="value" @change="ran = false">
            <option :value="9">9</option>
            <option :value="42">42</option>
          </select></label
        ><button
          class="button primary"
          @click="
            ran = true;
            attempts++;
          "
        >
          执行 b.value = {{ value }}
        </button>
      </div>
      <StateStage :state="state" />
    </div>
    <p
      v-if="ran"
      role="status"
      :class="success ? 'success-text' : 'warning-text'"
    >
      {{ success ? "目标达成。" : "还没有达到目标。"
      }}{{
        mode === "shared"
          ? "a 和 b 关联同一个对象，改字段会从两个入口看到。"
          : "a 和 b 关联两个独立对象，改 b 的字段不影响 a。"
      }}尝试次数：{{ attempts }}。
    </p>
    <button v-if="success" class="button secondary" @click="next">
      换一个目标</button
    ><small
      >此关卡使用明确的对象关系模型，只复制这个整数属性，不表示任意对象的深复制。</small
    >
  </section>
</template>
