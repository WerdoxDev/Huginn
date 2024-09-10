import './style.css'

import { createApp, createRenderer } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import App from './App.vue'
import Home from './Home.vue'
import Download from './Download.vue'
import About from './About.vue'
import Docs from './Docs.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: Home
        },
        {
            path: "/about",
            component: About
        },
        {
            path: "/download",
            component: Download
        },
        {
            path: "/docs",
            component: Docs
        },
    ]
})

createApp(App).use(router).mount('#app')
