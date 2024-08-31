<script setup lang="ts">

import { Icon } from '@iconify/vue/dist/iconify.js';
import HeaderButton from './components/HeaderButton.vue';
import Feature from './components/Feature.vue';

</script>

<template>
  <!-- Header -->
  <div
    class="w-full py-4 px-20 top-0 flex justify-center items-center sticky bg-black/30 backdrop-blur-md border-b border-[#EBEBD3]">
    <div class="flex items-center">
      <a href="https://Huginn.dev/"><img src="/huginn-logo.png" class="size-10" /></a>
      <a href="https://Huginn.dev/" class="text-2xl font-bold pl-3">HUGINN</a>
    </div>

    <div class="flex  space-x-8 ml-auto">
      <HeaderButton link="https://Huginn.dev/" text="Home" />
      <HeaderButton link="https://discord.gg/" text="Docs" />
      <HeaderButton link="https://discord.gg/" text="About" />
      <HeaderButton link="https://discord.gg/" text="Download" />

      <div class="w-0.5 bg-[#EBEBD3]/30" />

      <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
        <Icon icon="bi:github" class="size-5" />
      </a>
    </div>
  </div>

  <!-- Opening Section -->
  <div class="flex justify-center items-center w-full my-32">
    <div class="flex flex-row space-x-7">

      <div class="w-96">

        <div class="flex items-center">
          <img src="/huginn-logo-blue.svg" class="size-20 object-contain" />
          <p class="text-5xl text-[#EBEBD3] font-extrabold ml-4">Huginn</p>
        </div>

        <p class="mt-6 text-2xl">Step through Bifröst and enjoy chatting with your friends using Huginn in Asgard.</p>

        <div class="flex flex-row items-center mt-6 space-x-2">
          <div class="rounded-full bg-green-400 size-2" />
          <p class="text-[0.65rem] font-bold">CHATTING</p>
        </div>

        <div>
          <p class="text-2xl">6,985,420</p>
        </div>

        <div class="flex flex-row pt-10 w-full space-x-2">
          <a href="http://huginn.dev/"
            class="flex justify-center items-center text-xl bg-[#7B563C] rounded-md px-5 w-full h-12 space-x-2 transition-all hover:bg-[#7b563c92]">
            <div class="font-bold">DOWNLOAD HUGINN</div>
            <Icon icon="mingcute:windows-fill" class="size-6" />
          </a>

          <a href="https://Huginn.dev/"
            class="bg-[#262626] border-2 border-[#464646] h-12 w-14 rounded-md flex justify-center items-center transition-all hover:bg-[#1f1f1f]">
            <Icon icon="mingcute:chrome-fill" class="size-8" />
          </a>
        </div>

      </div>

      <div class="w-[35rem] h-96 bg-[#1f1f1f]">
      </div>

    </div>
  </div>

  <!-- Features -->
  <div class="flex justify-center items-center mt-60 mb-40">
    <div class="grid grid-cols-2 grid-rows-2 gap-16">
      <Feature icon="raphael:opensource" header="Open Source"
        text="Huginn is made to be open-source. Everything you see is available to use under the  GNU GPLv3 license. Contribution is always welcome and encouraged" />
      <Feature icon="mdi:api" header="Extensive API"
        text="Huginn's API is so simple to use that anyone with basic node knowledge can do cool stuff with it!" />
      <Feature icon="" header="" text="" />
      <Feature icon="" header="" text="" />
    </div>
  </div>

  <!-- Footer -->
  <div class="py-3 px-12 bg-gradient-to-t bg-[#262626] border-t border-[#1f1f1f] flex flex-row">
    <div class="ml-7">Huginn made by <a href="https://github.com/WerdoxDev" target="_blank"
        class="underline text-[#D99A6C]">Matin
        Tat</a>
      / Website made by <a href="https://github.com/VoiD-ev" target="_blank" class="underline text-[#D99A6C]">Mahziyar
        Farahmandian</a>
    </div>

    <div class="ml-auto mr-7 space-x-3 flex items-center">
      <a href="https://www.instagram.com/werdox.dev/" target="_blank">
        <Icon icon="ri:instagram-fill" class="size-5" />
      </a>

      <a href="https://x.com/Matin90365857" target="_blank">
        <Icon icon="mdi:twitter" class="size-5" />
      </a>

      <a href="https://discord.gg/cad9P5dm3y" target="_blank">
        <Icon icon="ic:baseline-discord" class="size-5" />
      </a>

      <a href="https://github.com/WerdoxDev/Huginn" target="_blank">
        <Icon icon="bi:github" class="size-5" />
      </a>
    </div>
  </div>

</template>