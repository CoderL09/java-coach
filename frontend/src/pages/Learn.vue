<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Search,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
} from "lucide-vue-next";
import { books, readyTopics, courseLink, type Language } from "../books";
import { learningLanguage, chooseLanguage } from "../learningLanguage";
const query = ref(""),
  chapter = ref("all");
const roadmap = ref(false);
const book = computed(() => books[learningLanguage.value]);
const available = computed(() => readyTopics(learningLanguage.value).length);
const total = computed(() =>
  book.value.chapters.reduce((n, c) => n + c.topics.length, 0),
);
const shown = computed(() =>
  book.value.chapters
    .map((c) => ({
      ...c,
      topics: c.topics.filter(
        (t) =>
          (roadmap.value || !!t.courseId) &&
          (!query.value ||
            t.title.toLowerCase().includes(query.value.toLowerCase())),
      ),
    }))
    .filter(
      (c) =>
        c.topics.length &&
        (query.value || chapter.value === "all" || c.id === chapter.value),
    ),
);
function select(language: Language) {
  chooseLanguage(language);
  chapter.value = "all";
  query.value = "";
}
</script>
<template>
  <main id="main" class="book-page">
    <header class="book-cover">
      <div>
        <div class="book-language" role="group" aria-label="选择学习语言">
          <button
            v-for="lang in ['java', 'javascript'] as const"
            :key="lang"
            :aria-pressed="learningLanguage === lang"
            :class="{ active: learningLanguage === lang }"
            @click="select(lang)"
          >
            {{ lang === "java" ? "Java" : "JavaScript" }}
          </button>
        </div>
        <h1>{{ book.title }}</h1>
        <p>{{ book.subtitle }}</p>
        <div class="book-availability">
          <BookOpen :size="16" /><span
            >{{ book.chapters.length }} 篇 · {{ total }} 个知识点</span
          ><span>{{ available }} 节已有完整课程</span>
        </div>
      </div>
      <RouterLink
        :to="
          courseLink(
            learningLanguage === 'java'
              ? 'java-start-first'
              : 'javascript-fundamentals-first',
            learningLanguage,
          )
        "
        class="book-start"
        ><span>从一个值开始</span
        ><code>{{
          learningLanguage === "java"
            ? "int total = 3 * 8;"
            : "const total = 3 * 8;"
        }}</code
        ><span>写下第一行，看见它的变化<ArrowUpRight :size="19" /></span
      ></RouterLink>
    </header>
    <div class="book-layout">
      <aside class="book-spine">
        <h2>{{ roadmap ? "完整学习路线" : "可学习的篇章" }}</h2>
        <button
          class="book-roadmap-toggle text-button"
          @click="
            roadmap = !roadmap;
            chapter = 'all';
            query = '';
          "
        >
          {{ roadmap ? "返回正文教程" : "查看完整学习路线" }}
        </button>
        <nav aria-label="教材篇章">
          <button
            :class="{ active: chapter === 'all' }"
            @click="
              chapter = 'all';
              query = '';
            "
          >
            浏览全书<ChevronRight :size="14" /></button
          ><button
            v-for="(c, i) in book.chapters"
            v-show="roadmap || c.topics.some((t) => t.courseId)"
            :key="c.id"
            :class="{ active: chapter === c.id }"
            @click="
              chapter = c.id;
              query = '';
            "
          >
            <span class="spine-index">{{ String(i + 1).padStart(2, "0") }}</span
            ><span>{{ c.title.replace(/^[^·]+· /, "") }}</span
            ><small>{{ c.topics.length }}</small>
          </button>
        </nav>
        <a
          :href="book.source"
          target="_blank"
          rel="noopener noreferrer"
          class="book-source"
          >{{
            learningLanguage === "java"
              ? "Java 官方学习参考"
              : "目录参考 javascript.info"
          }}<ArrowUpRight :size="12"
        /></a>
      </aside>
      <div class="book-contents">
        <div class="book-search-row">
          <label
            ><Search :size="17" /><input
              v-model="query"
              aria-label="搜索知识目录"
              placeholder="搜索本书知识点，例如字符串、this、递归" /></label
          ><span>选择知识点开始学习</span>
        </div>
        <section v-for="c in shown" :key="c.id" class="book-chapter">
          <header>
            <h2>{{ c.title }}</h2>
            <p>{{ c.description }}</p>
          </header>
          <div class="book-topics">
            <template v-for="t in c.topics" :key="t.id"
              ><RouterLink
                v-if="t.courseId"
                :to="courseLink(t.courseId, learningLanguage)"
                class="book-topic ready"
                ><span><Check :size="14" />{{ t.title }}</span
                ><span>开始学习<ArrowUpRight :size="15" /></span
              ></RouterLink>
              <div
                v-else
                class="book-topic pending"
                :aria-label="t.title + '，正文待编写'"
              >
                <span>{{ t.title }}</span
                ><span>正文待编写</span>
              </div></template
            >
          </div>
        </section>
        <div v-if="!shown.length" class="book-no-results">
          <Search :size="25" />
          <h2>本书没有匹配的知识点</h2>
          <p>试试更短的关键词，或切换另一门语言。</p>
        </div>
        <p class="book-status-note">
          {{
            roadmap
              ? "这是完整规划。尚未编写的章节不计入可学习正文。"
              : "这里的每个入口都有正文与可运行示例。完整规划可在左侧单独查看。"
          }}
        </p>
      </div>
    </div>
  </main>
</template>
