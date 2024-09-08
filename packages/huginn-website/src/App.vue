<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import HeaderButton from "./components/HeaderButton.vue";
import { ref } from "vue";

const isMenuOpen = ref(false)

function toggleMenu(event: MouseEvent) {
   isMenuOpen.value = !isMenuOpen.value
}
function closeMenu(event: MouseEvent) {
   event.stopPropagation()
   isMenuOpen.value = false
}

</script>

<template>
   <!-- Header -->
   <div
      class="fixed top-0 flex w-full items-center md:justify-center border-b border-[#EBEBD3] bg-black/30 px-5 md:px-20 py-4 backdrop-blur-md">
      <RouterLink to="/" class="flex items-center" :class="{ 'invisible': isMenuOpen === true }">
         <img src="/huginn-logo.png" class="size-10" />
         <div class="pl-3 text-2xl font-bold">HUGINN</div>
      </RouterLink>

      <div class="ml-auto hidden md:flex space-x-8">
         <HeaderButton link="/" text="Home" />
         <HeaderButton link="/docs" text="Docs" />
         <HeaderButton link="/about" text="About" />
         <HeaderButton link="/download" text="Download" />

         <div class="w-0.5 bg-[#EBEBD3]/30" />

         <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
            <Icon icon="bi:github" class="size-6 transition-all hover:shadow-md" />
         </a>
      </div>
   </div>

   <!-- Menu -->
   <div class="fixed inset-0 bg-black/25" :class="{ 'hidden': isMenuOpen === false }" @click="toggleMenu"></div>

   <div class="fixed right-0 w-4/5 h-full bg-[#1f1f1f] shadow-xl" :class="{ 'hidden': isMenuOpen === false }">
      <RouterLink to="/" class="flex items-center m-5">
         <img src="/huginn-logo.png" class="size-10" />
         <div class="pl-3 text-2xl font-bold">HUGINN</div>
      </RouterLink>

      <div class="flex flex-col gap-2.5 text-lg mt-10 ml-10">
         <HeaderButton link="/" text="Home" @click="closeMenu" />
         <HeaderButton link="/docs" text="Docs" @click="closeMenu" />
         <HeaderButton link="/about" text="About" @click="closeMenu" />
         <HeaderButton link="/download" text="Download" @click="closeMenu" />
      </div>
   </div>

   <button class="md:hidden right-5 top-5 fixed z-10" @click="toggleMenu">
      <Icon :icon="isMenuOpen ? 'mdi:close' : 'material-symbols:menu'" class="size-8" />
   </button>

   <!-- Router View & Footer -->
   <div class="flex h-full flex-col">
      <RouterView />

      <!-- Footer -->
      <div
         class="flex shrink-0 flex-col md:flex-row border-t border-[#1f1f1f] bg-[#262626] bg-gradient-to-t px-5 md:px-12 py-3">
         <div class="hidden md:block ml-7">
            Huginn made by <a href="https://github.com/WerdoxDev" target="_blank" class="text-[#D99A6C] underline">Matin
               Tat</a> /
            Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-[#D99A6C] underline">Mahziyar
               Farahmandian</a>
         </div>

         <div class="md:hidden text-sm">
            Huginn made by <a href="https://github.com/WerdoxDev" target="_blank" class="text-[#D99A6C] underline">Matin
               Tat</a>
         </div>
         <div class="md:hidden text-sm mt-1">Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-[#D99A6C] underline">Mahziyar
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
