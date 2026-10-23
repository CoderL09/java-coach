import { ref } from "vue";
export type Theme = "light" | "dark" | "system";
const media = window.matchMedia("(prefers-color-scheme: dark)");
function saved(): Theme {
  try {
    const v = localStorage.getItem("trace-theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
export const theme = ref<Theme>(saved());
export const resolvedTheme = ref<"light" | "dark">("dark");
function apply() {
  resolvedTheme.value =
    theme.value === "system" ? (media.matches ? "dark" : "light") : theme.value;
  document.documentElement.dataset.theme = resolvedTheme.value;
}
export function setTheme(value: Theme) {
  theme.value = value;
  try {
    localStorage.setItem("trace-theme", value);
  } catch {
    /* Browsing without storage still works. */
  }
  apply();
}
media.addEventListener("change", apply);
apply();
