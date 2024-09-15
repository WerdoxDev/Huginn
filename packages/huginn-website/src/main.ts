import "./style.css";

import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import About from "./About.vue";
import App from "./App.vue";
import Docs from "./Docs.vue";
import Download from "./Download.vue";
import Home from "./Home.vue";

export const router = createRouter({
   history: createWebHistory(),
   routes: [
      {
         path: "/",
         component: Home,
      },
      {
         path: "/about",
         component: About,
      },
      {
         path: "/download",
         component: Download,
      },
      {
         path: "/docs",
         component: Docs,
      },
   ],
});

createApp(App).use(router).mount("#app");
