<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import HeaderButton from "./components/HeaderButton.vue";
import Feature from "./components/Feature.vue";
</script>

<template>
   <!-- Header -->
   <div class="fixed top-0 flex w-full items-center justify-center border-b border-[#EBEBD3] bg-black/30 px-20 py-4 backdrop-blur-md">
      <RouterLink to="/" class="flex items-center">
         <img src="/huginn-logo.png" class="size-10" />
         <div class="pl-3 text-2xl font-bold">HUGINN</div>
      </RouterLink>

      <div class="ml-auto flex space-x-8">
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

   <div class="flex h-full flex-col">
      <RouterView />

      <!-- Footer -->
      <div class="flex shrink-0 flex-row border-t border-[#1f1f1f] bg-[#262626] bg-gradient-to-t px-12 py-3">
         <div class="ml-7">
            Huginn made by <a href="https://github.com/WerdoxDev" target="_blank" class="text-[#D99A6C] underline">Matin Tat</a> /
            Website made by
            <a href="https://github.com/VoiD-ev" target="_blank" class="text-[#D99A6C] underline">Mahziyar Farahmandian</a>
         </div>

         <div class="ml-auto mr-7 flex items-center space-x-5">
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
