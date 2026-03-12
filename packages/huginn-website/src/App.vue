<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import { Analytics } from "@vercel/analytics/vue";
import { onMounted, ref } from "vue";

import HeaderButton from "./components/HeaderButton.vue";
import ThemeChanger from "./components/ThemeChanger.vue";
import { currentTheme, loadTheme } from "./scripts/useChangeTheme";

const isMenuOpen = ref(false);

onMounted(() => {
   loadTheme();
});

function toggleMenu(event: MouseEvent) {
   isMenuOpen.value = !isMenuOpen.value;
}
function closeMenu(event: MouseEvent) {
   event.stopPropagation();
   isMenuOpen.value = false;
}
</script>

<template>
   <Analytics />
   <!-- Header -->
   <div
      class="fixed top-0 z-30 flex w-full items-center border-b border-text bg-black/30 px-5 py-4 backdrop-blur-md md:justify-center md:pl-20 md:pr-10"
   >
      <RouterLink to="/" class="flex items-center transition-opacity duration-[250ms]" :class="{ 'opacity-0': isMenuOpen }">
         <img :src="`/logo/${currentTheme.logoOutline}`" class="size-10" />
         <div class="pl-3 text-2xl font-bold">HUGINN</div>
      </RouterLink>

      <button class="ml-auto md:hidden" @click="toggleMenu">
         <Icon icon="material-symbols:menu" class="size-8" />
      </button>

      <div class="ml-auto hidden gap-x-10 md:flex">
         <HeaderButton link="/" text="Home" />
         <HeaderButton link="/docs" text="Docs" />
         <HeaderButton link="/about" text="About" />
         <HeaderButton link="/download" text="Download" />

         <div class="w-0.5 bg-text/30" />

         <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
            <Icon icon="bi:github" class="size-8 transition-all hover:shadow-md" />
         </a>
      </div>
   </div>

   <!-- Menu -->
   <Transition name="menu-fade">
      <div class="fixed inset-0 z-40 bg-black/25" v-if="isMenuOpen" @click="toggleMenu"></div>
   </Transition>

   <Transition name="slide-in-out">
      <div class="fixed right-0 z-50 h-full w-4/5 bg-tertiary shadow-xl" v-if="isMenuOpen">
         <div class="m-5 flex">
            <RouterLink to="/" class="flex items-center">
               <img :src="`/logo/${currentTheme.logoOutline}`" class="size-10" />
               <div class="pl-3 text-2xl font-bold">HUGINN</div>
            </RouterLink>

            <button class="ml-auto md:hidden" @click="toggleMenu">
               <Icon icon="mdi:close" class="size-8" />
            </button>
         </div>

         <div class="ml-10 mt-10 flex flex-col gap-y-7">
            <HeaderButton link="/" text="Home" @click="closeMenu" />
            <HeaderButton link="/docs" text="Docs" @click="closeMenu" />
            <HeaderButton link="/about" text="About" @click="closeMenu" />
            <HeaderButton link="/download" text="Download" @click="closeMenu" />
         </div>
      </div>
   </Transition>

   <!-- Router View & Footer -->
   <div class="flex h-full flex-col">
      <RouterView />

      <ThemeChanger class="sticky bottom-5 mb-5 ml-auto mr-5" />

      <!-- Footer -->
      <div class="relative flex shrink-0 flex-col border-t border-tertiary bg-secondary bg-gradient-to-t px-5 py-3 md:flex-row md:px-12">
         <div class="ml-7 hidden md:block">
            Huginn made by
            <a href="https://github.com/WerdoxDev" target="_blank" class="text-accent underline">Matin Tat</a>
            / Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-accent underline">Mahziyar Farahmandian</a>
         </div>

         <div class="text-sm md:hidden">
            Huginn made by
            <a href="https://github.com/WerdoxDev" target="_blank" class="text-accent underline">Matin Tat</a>
         </div>
         <div class="mt-1 text-sm md:hidden">
            Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-accent underline">Mahziyar Farahmandian</a>
         </div>

         <div class="mt-4 flex items-center space-x-7 md:ml-auto md:mr-7 md:mt-0 md:space-x-5">
            <a href="https://www.instagram.com/werdox.dev/" target="_blank">
               <Icon icon="ri:instagram-fill" class="size-6" />
            </a>

            <a href="https://x.com/Matin90365857" target="_blank">
               <Icon icon="mdi:twitter" class="size-6" />
            </a>

            <a href="https://discord.gg/cad9P5dm3y" target="_blank">
               <Icon icon="ic:baseline-discord" class="size-6" />
            </a>

            <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
               <Icon icon="bi:github" class="size-6" />
            </a>
         </div>
      </div>
   </div>
</template>
