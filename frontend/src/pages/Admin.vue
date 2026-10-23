<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  ArrowUpRight,
  Search,
  RotateCw,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  LockKeyhole,
  FileCode2,
  X,
  LoaderCircle,
} from "lucide-vue-next";
import { api, ApiError } from "../api";
import { useCoach } from "../store";
import { setTheme, theme, type Theme } from "../theme";
import "../admin.css";
interface Experiment {
  id: string;
  title: string;
  enabled: boolean;
  version: number;
}
interface Account {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}
interface Overview {
  experiments: Experiment[];
  users: Account[];
  stats: { total: number; errors: number };
}
const s = useCoach(),
  route = useRoute(),
  router = useRouter();
const navigation = [
  {
    id: "overview",
    path: "/admin",
    title: "工作台概览",
    icon: LayoutDashboard,
  },
  {
    id: "experiments",
    path: "/admin/experiments",
    title: "实验管理",
    icon: FlaskConical,
  },
  { id: "accounts", path: "/admin/accounts", title: "账号查看", icon: Users },
];
const section = computed(
  () => navigation.find((n) => n.id === route.params.section) || navigation[0],
);
const data = ref<Overview | null>(null),
  loading = ref(false),
  saving = ref(false),
  error = ref("");
const updated = ref<Date>(),
  query = ref(""),
  status = ref("all"),
  role = ref("all"),
  page = ref(1);
const pending = ref<Experiment | null>(null),
  dialog = ref<HTMLDialogElement>();
let generation = 0;
const experiments = computed(() => data.value?.experiments || []);
const published = computed(
  () => experiments.value.filter((e) => e.enabled).length,
);
const totalRecords = computed(() => Number(data.value?.stats.total || 0));
const errorRecords = computed(() => Number(data.value?.stats.errors || 0));
const users = computed(() => data.value?.users || []);
const filteredExperiments = computed(() =>
  experiments.value.filter(
    (e) =>
      (!query.value ||
        (e.title + " " + e.id)
          .toLowerCase()
          .includes(query.value.toLowerCase().trim())) &&
      (status.value === "all" || e.enabled === (status.value === "published")),
  ),
);
const filteredUsers = computed(() =>
  users.value.filter(
    (u) =>
      (!query.value ||
        (u.username + " " + u.id)
          .toLowerCase()
          .includes(query.value.toLowerCase().trim())) &&
      (role.value === "all" || u.role === role.value),
  ),
);
const pages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / 10)),
);
const visibleUsers = computed(() =>
  filteredUsers.value.slice((page.value - 1) * 10, page.value * 10),
);
const updatedLabel = computed(() =>
  updated.value
    ? updated.value.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "尚未读取",
);
const stats = computed(() => [
  {
    name: "已发布实验",
    value: published.value,
    suffix: "/ " + experiments.value.length,
    detail: "公开实验的发布标记",
    icon: FlaskConical,
  },
  {
    name: "学习记录",
    value: totalRecords.value,
    suffix: "",
    detail: "已保存的记录总数",
    icon: FileCode2,
  },
  {
    name: "错误现场",
    value: errorRecords.value,
    suffix: "",
    detail: "保留代码与错误输入",
    icon: AlertTriangle,
  },
  {
    name: "近期账号",
    value: users.value.length,
    suffix: "",
    detail: "最多展示最近 100 个账号",
    icon: Users,
  },
]);
watch(
  () => section.value.id,
  () => {
    query.value = "";
    status.value = "all";
    role.value = "all";
    page.value = 1;
  },
);
watch([query, role], () => (page.value = 1));
watch(pages, (value) => (page.value = Math.min(page.value, value)));
async function load(clearError = true) {
  if (s.user?.role !== "ADMIN") return;
  const token = ++generation;
  loading.value = true;
  if (clearError) error.value = "";
  try {
    const result = await api<Overview>("/admin/overview");
    if (token !== generation || s.user?.role !== "ADMIN") return;
    data.value = result;
    updated.value = new Date();
  } catch (e) {
    if (token === generation)
      error.value = (e as Error).message || "读取失败，请刷新重试。";
  } finally {
    if (token === generation) loading.value = false;
  }
}
watch(
  () => s.user?.id,
  () => {
    generation++;
    data.value = null;
    updated.value = undefined;
    loading.value = false;
    pending.value = null;
    dialog.value?.close();
    if (s.user?.role === "ADMIN") void load();
  },
  { immediate: true },
);
async function askPublish(e: Experiment) {
  if (saving.value) return;
  pending.value = { ...e };
  await nextTick();
  dialog.value?.showModal();
}
function cancelPublish() {
  if (saving.value) return;
  dialog.value?.close();
  pending.value = null;
}
async function publish() {
  if (!pending.value || saving.value || s.user?.role !== "ADMIN") return;
  const experiment = pending.value;
  saving.value = true;
  error.value = "";
  try {
    await api(
      "/admin/experiments/" + encodeURIComponent(experiment.id),
      "PATCH",
      {
        enabled: !experiment.enabled,
        version: experiment.version,
      },
    );
    dialog.value?.close();
    pending.value = null;
    await load();
    s.notify(experiment.enabled ? "实验已停用" : "实验已发布");
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      dialog.value?.close();
      pending.value = null;
      error.value =
        "实验状态已被其他操作更新。列表已刷新，请确认最新状态后重试。";
      await load(false);
    } else error.value = (e as Error).message || "更新失败，请重试。";
  } finally {
    saving.value = false;
  }
}
async function signOut() {
  try {
    await s.logout();
    await router.replace("/admin");
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function date(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
}
onBeforeUnmount(() => {
  generation++;
  dialog.value?.close();
});
</script>
<template>
  <main id="main" class="admin-console">
    <aside class="console-sidebar" aria-label="管理端导航">
      <RouterLink to="/admin" class="console-brand"
        ><span class="console-mark"><FileCode2 :size="23" /></span
        ><span
          ><strong>TRACE</strong><small>管理工作台</small></span
        ></RouterLink
      >
      <div class="console-nav-label">工作空间</div>
      <nav>
        <RouterLink
          v-for="n in navigation"
          :key="n.id"
          :to="n.path"
          :class="{ active: section.id === n.id }"
          :aria-current="section.id === n.id ? 'page' : undefined"
          ><component :is="n.icon" :size="18" /><span>{{ n.title }}</span
          ><span
            v-if="n.id === 'experiments' && data"
            class="console-nav-count"
            >{{ experiments.length }}</span
          ></RouterLink
        >
      </nav>
      <div class="console-sidebar-bottom">
        <RouterLink to="/" class="console-return"
          >打开用户端<ArrowUpRight :size="16"
        /></RouterLink>
        <div class="console-profile">
          <span class="console-avatar">{{
            s.user?.username.slice(0, 1).toUpperCase() || "?"
          }}</span
          ><span
            ><strong>{{ s.user?.username || "未登录" }}</strong
            ><small>{{
              s.user?.role === "ADMIN" ? "管理员" : "需要管理员权限"
            }}</small></span
          >
        </div>
      </div>
    </aside>
    <div class="console-workspace">
      <header class="console-topbar">
        <div class="console-breadcrumb">
          <span>内容管理</span><ChevronRight :size="14" /><strong>{{
            section.title
          }}</strong>
        </div>
        <div class="console-tools">
          <label
            ><span class="sr-only">管理端显示主题</span
            ><select
              :value="theme"
              aria-label="管理端显示主题"
              @change="
                setTheme(($event.target as HTMLSelectElement).value as Theme)
              "
            >
              <option value="system">跟随系统</option>
              <option value="light">日间模式</option>
              <option value="dark">夜间模式</option>
            </select></label
          ><span v-if="s.user?.role === 'ADMIN'" class="console-role"
            ><ShieldCheck :size="14" />管理员</span
          ><button
            v-if="s.user"
            class="console-icon-button"
            aria-label="退出管理端"
            @click="signOut"
          >
            <LogOut :size="17" />
          </button>
        </div>
      </header>
      <div v-if="!s.ready" class="console-access" role="status">
        <LoaderCircle :size="30" />
        <h1>正在验证身份</h1>
      </div>
      <div v-else-if="s.user?.role !== 'ADMIN'" class="console-access">
        <span class="console-access-icon"><LockKeyhole :size="30" /></span>
        <h1>登录管理工作台</h1>
        <p>只有管理员可以查看管理数据和更改实验发布状态。</p>
        <button class="console-button primary" @click="s.authOpen = true">
          {{ s.user ? "切换管理员账号" : "使用管理员账号登录" }}</button
        ><RouterLink to="/">返回用户端</RouterLink>
      </div>
      <div v-else class="console-content">
        <div class="console-heading">
          <div>
            <h1>{{ section.title }}</h1>
            <p>
              {{
                section.id === "overview"
                  ? "查看实验发布状态与已保存的学习记录。"
                  : section.id === "experiments"
                    ? "管理公开实验的发布标记，操作前确认当前版本。"
                    : "查找近期账号，核对账号身份与创建日期。"
              }}
            </p>
          </div>
          <div class="console-refresh">
            <small>{{
              updated ? "更新于 " + updatedLabel : "尚未读取数据"
            }}</small
            ><button
              class="console-button"
              :disabled="loading || saving"
              @click="load()"
            >
              <RotateCw :size="15" />{{ loading ? "读取中…" : "刷新数据" }}
            </button>
          </div>
        </div>
        <p v-if="error" class="console-alert" role="alert">
          <AlertTriangle :size="17" /><span>{{ error }}</span>
        </p>
        <div v-if="!data && loading" class="console-loading" role="status">
          <LoaderCircle :size="24" />正在读取管理数据…
        </div>
        <div v-else-if="!data" class="console-empty">
          <h2>暂时无法读取数据</h2>
          <p>检查连接后，点击“刷新数据”重试。</p>
        </div>
        <template v-else>
          <template v-if="section.id === 'overview'">
            <section class="console-metrics" aria-label="管理概览数据">
              <article v-for="metric in stats" :key="metric.name">
                <div>
                  <span>{{ metric.name }}</span
                  ><component :is="metric.icon" :size="17" />
                </div>
                <strong
                  >{{ metric.value }}<small>{{ metric.suffix }}</small></strong
                >
                <p>{{ metric.detail }}</p>
              </article>
            </section>
            <div class="console-overview-grid">
              <section class="console-panel">
                <header>
                  <div>
                    <h2>实验发布</h2>
                    <p>当前公开实验的发布状态</p>
                  </div>
                  <RouterLink to="/admin/experiments" class="console-text-link"
                    >管理实验<ArrowUpRight :size="15"
                  /></RouterLink>
                </header>
                <div class="console-release-list">
                  <div v-for="e in experiments" :key="e.id">
                    <span class="console-experiment-icon"
                      ><FlaskConical :size="18" /></span
                    ><span class="console-release-name"
                      ><strong>{{ e.title }}</strong
                      ><small>{{ e.id }}</small></span
                    ><span
                      class="console-status"
                      :class="e.enabled ? 'published' : 'disabled'"
                      ><span></span>{{ e.enabled ? "已发布" : "已停用" }}</span
                    >
                  </div>
                  <p v-if="!experiments.length" class="console-empty-text">
                    暂无公开实验。
                  </p>
                </div>
                <footer class="console-panel-footer">
                  <span>{{ published }} 个已发布</span
                  ><span>{{ experiments.length - published }} 个已停用</span>
                </footer>
              </section>
              <section class="console-panel console-permissions">
                <header>
                  <div>
                    <h2>管理权限</h2>
                    <p>当前账号可以执行的操作</p>
                  </div>
                  <ShieldCheck :size="21" />
                </header>
                <ul>
                  <li>
                    <span><Check :size="15" />实验发布状态</span
                    ><strong>可修改</strong>
                  </li>
                  <li>
                    <span><Check :size="15" />账号与角色</span
                    ><strong>可查看</strong>
                  </li>
                  <li>
                    <span>教材、题库正文</span><small>尚未开放编辑</small>
                  </li>
                  <li>
                    <span>账号角色与封禁</span><small>尚未开放修改</small>
                  </li>
                </ul>
                <p class="console-permission-note">
                  账号页只提供查询，不会修改用户权限。
                </p>
              </section>
            </div>
            <section class="console-panel console-record-summary">
              <header>
                <div>
                  <h2>学习记录</h2>
                  <p>依据已保存记录统计</p>
                </div>
                <span class="console-subtle">共 {{ totalRecords }} 条</span>
              </header>
              <div class="console-record-bars">
                <div>
                  <label for="console-errors"
                    >错误现场 <strong>{{ errorRecords }}</strong></label
                  ><meter
                    id="console-errors"
                    :min="0"
                    :max="Math.max(totalRecords, 1)"
                    :value="errorRecords"
                  >
                    {{ errorRecords }}
                  </meter>
                </div>
                <div>
                  <label for="console-other"
                    >其他记录
                    <strong>{{
                      Math.max(0, totalRecords - errorRecords)
                    }}</strong></label
                  ><meter
                    id="console-other"
                    :min="0"
                    :max="Math.max(totalRecords, 1)"
                    :value="Math.max(0, totalRecords - errorRecords)"
                  >
                    {{ Math.max(0, totalRecords - errorRecords) }}
                  </meter>
                </div>
              </div>
            </section>
          </template>
          <section
            v-else-if="section.id === 'experiments'"
            class="console-panel console-data-panel"
          >
            <header>
              <div>
                <h2>公开实验</h2>
                <p>共 {{ experiments.length }} 个实验</p>
              </div>
              <span class="console-read-badge"
                ><ShieldCheck :size="14" />可管理发布状态</span
              >
            </header>
            <div class="console-table-toolbar">
              <label class="console-search"
                ><Search :size="16" /><input
                  v-model="query"
                  type="search"
                  placeholder="搜索实验名称或 ID"
                  aria-label="搜索实验" /></label
              ><label class="console-filter"
                ><span>发布状态</span
                ><select v-model="status" aria-label="筛选发布状态">
                  <option value="all">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="disabled">已停用</option>
                </select></label
              >
            </div>
            <div class="console-table-scroll">
              <table>
                <caption class="sr-only">
                  公开实验发布管理
                </caption>
                <thead>
                  <tr>
                    <th scope="col">实验名称</th>
                    <th scope="col">发布状态</th>
                    <th scope="col">当前版本</th>
                    <th scope="col" class="console-align-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in filteredExperiments" :key="e.id">
                    <td>
                      <div class="console-table-name">
                        <span class="console-experiment-icon"
                          ><FlaskConical :size="18" /></span
                        ><span
                          ><strong>{{ e.title }}</strong
                          ><small>{{ e.id }}</small></span
                        >
                      </div>
                    </td>
                    <td>
                      <span
                        class="console-status"
                        :class="e.enabled ? 'published' : 'disabled'"
                        ><span></span
                        >{{ e.enabled ? "已发布" : "已停用" }}</span
                      >
                    </td>
                    <td>
                      <span class="console-version">v{{ e.version }}</span>
                    </td>
                    <td class="console-align-right">
                      <button
                        class="console-button small"
                        :class="{ warning: e.enabled }"
                        :disabled="saving || loading"
                        :aria-label="(e.enabled ? '停用 ' : '发布 ') + e.title"
                        @click="askPublish(e)"
                      >
                        {{ e.enabled ? "停用" : "发布" }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!filteredExperiments.length" class="console-empty">
              <Search :size="26" />
              <h3>没有匹配的实验</h3>
              <p>换一个关键词，或选择其他发布状态。</p>
              <button
                v-if="query || status !== 'all'"
                class="console-button"
                @click="
                  query = '';
                  status = 'all';
                "
              >
                清除筛选
              </button>
            </div>
            <footer class="console-panel-footer">
              <span
                >显示 {{ filteredExperiments.length }} /
                {{ experiments.length }} 个实验</span
              ><span>修改发布状态不会删除学习记录</span>
            </footer>
          </section>
          <section v-else class="console-panel console-data-panel">
            <header>
              <div>
                <h2>近期账号</h2>
                <p>按创建顺序展示最近 100 个账号</p>
              </div>
              <span class="console-read-badge"
                ><LockKeyhole :size="14" />只读权限</span
              >
            </header>
            <div class="console-table-toolbar">
              <label class="console-search"
                ><Search :size="16" /><input
                  v-model="query"
                  type="search"
                  placeholder="搜索用户名或账号 ID"
                  aria-label="搜索账号" /></label
              ><label class="console-filter"
                ><span>账号角色</span
                ><select v-model="role" aria-label="筛选账号角色">
                  <option value="all">全部角色</option>
                  <option value="ADMIN">管理员</option>
                  <option value="USER">用户</option>
                </select></label
              >
            </div>
            <div class="console-table-scroll">
              <table>
                <caption class="sr-only">
                  账号与角色只读列表
                </caption>
                <thead>
                  <tr>
                    <th scope="col">账号</th>
                    <th scope="col">角色</th>
                    <th scope="col">创建日期</th>
                    <th scope="col" class="console-align-right">账号 ID</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in visibleUsers" :key="u.id">
                    <td>
                      <div class="console-table-name">
                        <span
                          class="console-avatar"
                          :class="{ administrator: u.role === 'ADMIN' }"
                          >{{ u.username.slice(0, 1).toUpperCase() }}</span
                        ><strong>{{ u.username }}</strong>
                      </div>
                    </td>
                    <td>
                      <span
                        class="console-account-role"
                        :class="{ administrator: u.role === 'ADMIN' }"
                        ><ShieldCheck v-if="u.role === 'ADMIN'" :size="13" />{{
                          u.role === "ADMIN"
                            ? "管理员"
                            : u.role === "USER"
                              ? "用户"
                              : u.role
                        }}</span
                      >
                    </td>
                    <td class="console-subtle">{{ date(u.createdAt) }}</td>
                    <td class="console-align-right console-subtle">
                      #{{ u.id }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!filteredUsers.length" class="console-empty">
              <Users :size="26" />
              <h3>没有匹配的账号</h3>
              <p>换一个关键词，或选择其他角色。</p>
              <button
                v-if="query || role !== 'all'"
                class="console-button"
                @click="
                  query = '';
                  role = 'all';
                "
              >
                清除筛选
              </button>
            </div>
            <footer class="console-panel-footer">
              <span>共 {{ filteredUsers.length }} 个匹配账号</span>
              <div class="console-pagination">
                <span>{{ page }} / {{ pages }}</span
                ><button
                  class="console-icon-button"
                  aria-label="上一页账号"
                  :disabled="page <= 1"
                  @click="page--"
                >
                  <ChevronLeft :size="16" /></button
                ><button
                  class="console-icon-button"
                  aria-label="下一页账号"
                  :disabled="page >= pages"
                  @click="page++"
                >
                  <ChevronRight :size="16" />
                </button>
              </div>
            </footer>
          </section>
        </template>
      </div>
    </div>
    <dialog
      ref="dialog"
      class="console-dialog"
      aria-labelledby="console-dialog-title"
      @cancel.prevent="cancelPublish"
      @click="$event.target === dialog && cancelPublish()"
      @close="pending = null"
    >
      <template v-if="pending"
        ><header>
          <span class="console-experiment-icon"
            ><FlaskConical :size="22" /></span
          ><button
            class="console-icon-button"
            aria-label="关闭发布确认"
            :disabled="saving"
            @click="cancelPublish"
          >
            <X :size="18" />
          </button>
        </header>
        <h2 id="console-dialog-title">
          {{ pending.enabled ? "停用这个实验？" : "发布这个实验？" }}
        </h2>
        <p>
          将“{{ pending.title }}”的发布状态设为{{
            pending.enabled ? "停用" : "已发布"
          }}。课程代码与学习记录会保留。
        </p>
        <div class="console-dialog-detail">
          <span>{{ pending.id }}</span
          ><strong>当前版本 v{{ pending.version }}</strong>
        </div>
        <p v-if="error" role="alert" class="console-alert">{{ error }}</p>
        <footer>
          <button
            class="console-button"
            :disabled="saving"
            @click="cancelPublish"
          >
            取消</button
          ><button
            class="console-button primary"
            :disabled="saving"
            @click="publish"
          >
            {{ saving ? "更新中…" : pending.enabled ? "确认停用" : "确认发布" }}
          </button>
        </footer></template
      >
    </dialog>
  </main>
</template>
