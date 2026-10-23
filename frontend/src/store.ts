import { defineStore } from "pinia";
import { ref } from "vue";
import { api, refreshCsrf } from "./api";
export const useCoach = defineStore("coach", () => {
  const user = ref<{ id: number; username: string; role: string } | null>(null),
    authOpen = ref(false),
    toast = ref(""),
    ready = ref(false);
  let timer: ReturnType<typeof setTimeout>;
  async function init() {
    try {
      await refreshCsrf();
      user.value = await api("/auth/me");
    } catch {
    } finally {
      ready.value = true;
    }
  }
  async function login(username: string, password: string) {
    user.value = await api("/auth/login", "POST", { username, password });
    await refreshCsrf();
    authOpen.value = false;
    notify("学习空间已连接");
  }
  async function logout() {
    await api("/auth/logout", "POST");
    user.value = null;
    await refreshCsrf();
    notify("已退出学习空间");
  }
  function requireUser() {
    if (user.value) return true;
    authOpen.value = true;
    return false;
  }
  function notify(message: string) {
    toast.value = message;
    clearTimeout(timer);
    timer = setTimeout(() => (toast.value = ""), 4000);
  }
  return {
    user,
    authOpen,
    toast,
    ready,
    init,
    login,
    logout,
    requireUser,
    notify,
  };
});
