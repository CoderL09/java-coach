import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import "./style.css";
import "./runtime.css";
import "./learning.css";
import "./explanation.css";
import "./theme.css";
import "./books.css";
import "./workbench.css";
import "./memory-flat.css";
import "./content.css";
import "./theme";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/read/:id", component: () => import("./pages/Article.vue") },
    { path: "/projects/:id?", component: () => import("./pages/Projects.vue") },
    { path: "/learn/:id", component: () => import("./pages/Course.vue") },
    {
      path: "/runtime",
      redirect: (to) => ({ path: "/lab", query: { ...to.query } }),
    },
    { path: "/", component: () => import("./pages/Learn.vue") },
    { path: "/lab/:kind?", component: () => import("./pages/Workbench.vue") },
    { path: "/practice", component: () => import("./pages/Exercises.vue") },
    {
      path: "/practice/reverse",
      component: () => import("./pages/Practice.vue"),
    },
    { path: "/records", component: () => import("./pages/Records.vue") },
    { path: "/admin/:section?", component: () => import("./pages/Admin.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
createApp(App).use(createPinia()).use(router).mount("#app");
