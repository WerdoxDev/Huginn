<<<<<<< HEAD
import './style.css'

import { createApp, createRenderer } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import App from './App.vue'
import Home from './Home.vue'
import Download from './Download.vue'
import About from './About.vue'

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
            component: Home
        },
    ]
})

createApp(App).use(router).mount('#app')
=======
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
>>>>>>> master
