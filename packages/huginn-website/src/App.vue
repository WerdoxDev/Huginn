<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import { Analytics } from "@vercel/analytics/vue";
import { onMounted, ref } from "vue";
import HeaderButton from "./components/HeaderButton.vue";
import ThemeChanger from "./components/ThemeChanger.vue";
import { currentTheme, loadTheme } from "./scripts/useChangeTheme";

const isMenuOpen = ref(false);

onMounted(() => {
   loadTheme()
})

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
      class="fixed top-0 z-30 flex w-full items-center md:justify-center border-b border-text bg-black/30 px-5 md:px-20 py-4 backdrop-blur-md">
      <RouterLink to="/" class="flex items-center transition-opacity duration-[250ms]"
         :class="{ 'opacity-0': isMenuOpen }">
         <img :src="`/logo/${currentTheme.logoOutline}`" class="size-10" />
         <div class="pl-3 text-2xl font-bold">HUGINN</div>
      </RouterLink>

      <button class="md:hidden ml-auto" @click="toggleMenu">
         <Icon icon="material-symbols:menu" class="size-8" />
      </button>

      <div class="ml-auto hidden md:flex space-x-8">
         <HeaderButton link="/" text="Home" />
         <HeaderButton link="/docs" text="Docs" />
         <HeaderButton link="/about" text="About" />
         <HeaderButton link="/download" text="Download" />

         <div class="w-0.5 bg-text/30" />

         <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
            <Icon icon="bi:github" class="size-6 transition-all hover:shadow-md" />
         </a>
      </div>
   </div>

   <!-- Menu -->
   <Transition name="opacity-fade">
      <div class="fixed inset-0 bg-black/25" v-if="isMenuOpen" @click="toggleMenu"></div>
   </Transition>

   <Transition name="slide-in-out">
      <div class="fixed right-0 w-4/5 h-full bg-tertiary shadow-xl" v-if="isMenuOpen">
         <div class="m-5 flex">
            <RouterLink to="/" class="flex items-center">
               <img :src="`/logo/${currentTheme.logo}`" class="size-10" />
               <div class="pl-3 text-2xl font-bold">HUGINN</div>
            </RouterLink>

            <button class="md:hidden ml-auto" @click="toggleMenu">
               <Icon icon="mdi:close" class="size-8" />
            </button>
         </div>

         <div class="flex flex-col gap-2.5 text-lg mt-10 ml-10">
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

      <ThemeChanger class="sticky bottom-5 ml-auto mr-5 mb-5" />

      <!-- Footer -->
      <div
         class="relative flex shrink-0 flex-col md:flex-row border-t border-tertiary bg-secondary bg-gradient-to-t px-5 md:px-12 py-3">
         <div class="hidden md:block ml-7">
            Huginn made by <a href="https://github.com/WerdoxDev" target="_blank" class="text-accent underline">Matin
               Tat</a> /
            Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-accent underline">Mahziyar
               Farahmandian</a>
         </div>

         <div class="md:hidden text-sm">
            Huginn made by <a href="https://github.com/WerdoxDev" target="_blank" class="text-accent underline">Matin
               Tat</a>
         </div>
         <div class="md:hidden text-sm mt-1">Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-accent underline">Mahziyar
               Farahmandian</a>
         </div>

         <div class="md:ml-auto md:mr-7 mt-4 md:mt-0 flex items-center space-x-7 md:space-x-5">
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

<style>
.opacity-fade-enter-from,
.opacity-fade-leave-to {
   opacity: 0;
}

.opacity-fade-enter-active,
.opacity-fade-leave-active {
   transition-property: opacity;
   transition-duration: 250ms;
   transition-timing-function: ease;
}

.slide-in-out-enter-from,
.slide-in-out-leave-to {
   translate: 100% 0;
}

.slide-in-out-enter-active,
.slide-in-out-leave-active {
   transition-property: translate;
   transition-duration: 250ms;
   transition-timing-function: ease;
}
</style>
