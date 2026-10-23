import { ref } from "vue";
import type { Language } from "./books";
function initial(): Language {
  try {
    return localStorage.getItem("trace-learning-language") === "java"
      ? "java"
      : "javascript";
  } catch {
    return "javascript";
  }
}
export const learningLanguage = ref<Language>(initial());
export function chooseLanguage(value: Language) {
  learningLanguage.value = value;
  try {
    localStorage.setItem("trace-learning-language", value);
  } catch {
    /* Session-only choice still works. */
  }
}
