<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import {
  Compass,
  Palette,
  Box,
  Code2,
  NotebookPen,
  ArrowUpRight,
  LogOut,
  Shield,
  ChevronRight,
  X,
  LoaderCircle,
  Check,
  Command,
} from "lucide-vue-next";
import { useCoach } from "./store";
import { api } from "./api";
import { theme, setTheme, type Theme } from "./theme";
const s = useCoach(),
  route = useRoute(),
  username = ref("learner"),
  password = ref("trace2026"),
  error = ref(""),
  busy = ref(false),
  register = ref(false);
const items = [
  { to: "/", label: "学习", icon: Compass },
  { to: "/lab", label: "实验室", icon: Box },
  { to: "/practice", label: "练习", icon: Code2 },
  { to: "/projects", label: "项目工坊", icon: Palette },
  { to: "/records", label: "学习记录", icon: NotebookPen },
];
const isAdminRoute = computed(
  () => route.path === "/admin" || route.path.startsWith("/admin/"),
);
const title = computed(() =>
  route.path === "/runtime"
    ? "真实 Java 追踪"
    : route.path.startsWith("/lab")
      ? "编程实验室"
      : route.path === "/records"
        ? "学习记录"
        : route.path.startsWith("/projects")
          ? "项目工坊"
          : route.path.startsWith("/practice")
            ? "独立练习"
            : isAdminRoute.value
              ? "内容管理"
              : "探索与学习",
);
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    if (register.value)
      await api("/auth/register", "POST", {
        username: username.value,
        password: password.value,
      });
    await s.login(username.value, password.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
onMounted(s.init);
let previousFocus: HTMLElement | null = null;
watch(
  () => s.authOpen,
  async (open) => {
    if (open) {
      if (isAdminRoute.value) {
        username.value = "admin";
        password.value = "";
        register.value = false;
      }
      previousFocus = document.activeElement as HTMLElement;
      await nextTick();
      document.querySelector<HTMLInputElement>(".auth-dialog input")?.focus();
    } else previousFocus?.focus();
  },
);
function trap(event: KeyboardEvent) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget as HTMLElement;
  const nodes = [
    ...dialog.querySelectorAll<HTMLElement>(
      "button:not(:disabled),input,a[href],select,textarea",
    ),
  ];
  const first = nodes[0],
    last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
</script>
<template>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <div
    class="app-shell"
    :class="{ 'admin-app-shell': isAdminRoute }"
    :inert="s.authOpen || undefined"
  >
    <aside v-if="!isAdminRoute" class="rail">
      <RouterLink to="/" class="brand" aria-label="TRACE 首页"
        ><svg width="31" height="31" viewBox="0 0 32 32" fill="none">
          <path
            d="M5 24V8h10l-5 8h12L17 24H5Z"
            stroke="currentColor"
            stroke-width="2.3"
            stroke-linejoin="round"
          />
          <path
            d="M22 8h5M25 13h3"
            stroke="currentColor"
            stroke-width="2.3"
          /></svg
      ></RouterLink>
      <div class="rail-rule"></div>
      <nav aria-label="主要导航">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          :class="{
            selected: item.to.startsWith('/lab')
              ? route.path.startsWith('/lab') || route.path === '/runtime'
              : item.to === '/'
                ? route.path === '/' || route.path.startsWith('/learn/')
                : route.path === item.to,
          }"
          ><component :is="item.icon" :size="21" /><span>{{
            item.label
          }}</span></RouterLink
        >
      </nav>
      <div class="rail-bottom">
        <RouterLink
          v-if="s.user?.role === 'ADMIN'"
          to="/admin"
          aria-label="管理端"
          ><Shield :size="20" /></RouterLink
        ><button
          v-if="s.user"
          class="avatar"
          :aria-label="'退出 ' + s.user.username"
          @click="s.logout"
        >
          {{ s.user.username.slice(0, 1).toUpperCase() }}</button
        ><button
          v-else
          class="avatar"
          aria-label="登录学习空间"
          @click="s.authOpen = true"
        >
          访
        </button>
      </div>
    </aside>
    <div class="app-body">
      <header v-if="!isAdminRoute" class="topbar">
        <div class="breadcrumb">
          <RouterLink to="/">知行实验室</RouterLink
          ><ChevronRight :size="13" /><span>{{ title }}</span>
        </div>
        <div class="top-actions">
          <label class="theme-picker"
            ><span class="sr-only">显示主题</span
            ><select
              aria-label="显示主题"
              :value="theme"
              @change="
                setTheme(($event.target as HTMLSelectElement).value as Theme)
              "
            >
              <option value="system">跟随系统</option>
              <option value="light">日间模式</option>
              <option value="dark">夜间模式</option>
            </select></label
          >
          <span class="mode-dot">自主学习模式</span
          ><span class="top-divider"></span
          ><span v-if="s.user" class="username">{{ s.user.username }}</span
          ><button v-else class="text-button" @click="s.authOpen = true">
            连接学习空间<ArrowUpRight :size="14" />
          </button>
        </div>
      </header>
      <RouterView :key="isAdminRoute ? 'admin' : route.path" />
    </div>
  </div>
  <Transition name="toast"
    ><div v-if="s.toast" class="toast" role="status">
      <Check :size="16" />{{ s.toast }}
    </div></Transition
  >
  <div
    v-if="s.authOpen"
    class="modal-backdrop"
    @click.self="s.authOpen = false"
    @keydown.esc="s.authOpen = false"
  >
    <section
      @keydown="trap"
      class="auth-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <button
        class="icon-button close-dialog"
        aria-label="关闭登录"
        @click="s.authOpen = false"
      >
        <X :size="18" />
      </button>
      <div class="auth-symbol"><Command :size="27" /></div>
      <h2 id="auth-title">
        {{ isAdminRoute ? "登录管理工作台" : "连接你的学习空间" }}
      </h2>
      <p>
        {{
          isAdminRoute
            ? "请使用具有管理权限的账号。"
            : "保存错误现场与思考，下次从这里继续。"
        }}
      </p>
      <form @submit.prevent="submit">
        <label
          >用户名<input
            v-model="username"
            autocomplete="username"
            name="username"
            required
            minlength="3"
            maxlength="40" /></label
        ><label
          >密码<input
            v-model="password"
            type="password"
            :autocomplete="register ? 'new-password' : 'current-password'"
            name="password"
            required
            minlength="8"
            maxlength="72"
        /></label>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <button class="button primary full" :disabled="busy">
          <LoaderCircle v-if="busy" class="spin" :size="16" />{{
            register ? "创建账号并进入" : "进入学习空间"
          }}<ArrowUpRight :size="16" />
        </button>
      </form>
      <button
        v-if="!isAdminRoute"
        class="text-button auth-switch"
        @click="
          register = !register;
          error = '';
        "
      >
        {{ register ? "已有账号，去登录" : "创建自己的账号" }}</button
      ><small v-if="!isAdminRoute">本机体验账号 learner / trace2026</small>
    </section>
  </div>
</template>
