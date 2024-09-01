<script setup lang="ts">
import HeaderButton from './components/HeaderButton.vue';
import { Icon } from '@iconify/vue/dist/iconify.js';

import { Icon } from '@iconify/vue/dist/iconify.js';
import HeaderButton from './components/HeaderButton.vue';
import Feature from './components/Feature.vue';
</script>

<template>
  <!-- Header -->
  <div
    class="w-full py-4 px-20 top-0 flex justify-center items-center fixed bg-black/30 backdrop-blur-md border-b border-[#EBEBD3]">
    <RouterLink to="/" class="flex items-center">
      <img src="/huginn-logo.png" class="size-10" />
      <div class="text-2xl font-bold pl-3">HUGINN</div>
    </RouterLink>

    <div class="flex  space-x-8 ml-auto">
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

  <div class="flex flex-col h-full">
    <RouterView />

    <!-- Footer -->
    <div class="py-3 px-12 bg-gradient-to-t bg-[#262626] border-t border-[#1f1f1f] flex flex-row shrink-0">
      <div class="ml-7">Huginn made by <a href="https://github.com/WerdoxDev" target="_blank"
          class="underline text-[#D99A6C]">Matin
          Tat</a>
        / Website made by <a href="https://github.com/VoiD-ev" target="_blank" class="underline text-[#D99A6C]">Mahziyar
          Farahmandian</a>
      </div>

      <div class="ml-auto mr-7 space-x-5 flex items-center">
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
