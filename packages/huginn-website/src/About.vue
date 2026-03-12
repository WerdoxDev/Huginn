<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";

import { currentTheme } from "./scripts/useChangeTheme";
</script>

<template>
   <div class="mt-32 flex h-full items-center justify-center md:mt-20">
      <div class="flex w-full flex-col px-4 md:max-w-5xl">
         <div class="flex items-center justify-center md:justify-start">
            <img :src="`/logo/${currentTheme.logoOutline}`" class="size-16 object-contain transition-all hover:-rotate-12 active:rotate-6" />
            <p class="ml-2 text-4xl font-bold text-text">About Huginn</p>
         </div>

         <div class="my-6 h-0.5 w-auto bg-text/50" />

         <h3 class="text-lg md:text-xl">
            <span class="font-bold">Huginn</span> is a chat app with a <span class="text-[#82ccdd]">Norse</span> twist! Inspired by one of
            <span class="text-[#b8e994]">Odin</span>'s ravens, <span class="text-accent">Huginn</span> brings a bit of
            <span class="text-error">Viking</span> flair to your everyday conversations. It's an <span class="text-[#b8e994]">open-source</span>,
            <span class="text-[#00a7e3]">highly customizable</span> platform that's as easy to use as it is fast. Whether you're discussing the latest
            news or planning your next raid <span class="text-text">(or, you know, a group project)</span>, Huginn offers a
            <span class="text-error">fun</span> and <span class="text-[#82ccdd]">unique</span> way to <span class="text-[#00a7e3]">connect</span> with
            others.
         </h3>

         <div class="mt-6 flex flex-col gap-2.5 md:flex-row md:gap-5">
            <a
               href="https://github.com/WerdoxDev"
               target="_blank"
               class="flex items-center gap-x-3 rounded-lg bg-tertiary p-2 pr-4 transition-all hover:bg-tertiary/50"
            >
               <img src="https://github.com/werdoxdev.png" class="size-14 rounded-md shadow-lg hover:shadow-2xl" />
               <div>
                  Matin Tat
                  <br />
                  (Werdox)
               </div>
            </a>
            <a
               href="https://github.com/VoiD-ev"
               target="_blank"
               class="flex items-center gap-x-3 rounded-lg bg-tertiary p-2 pr-4 transition-all hover:bg-tertiary/50"
            >
               <img src="https://github.com/void-ev.png" class="size-14 rounded-md shadow-lg hover:shadow-2xl" />
               <div>
                  Mahziyar Farahmandian
                  <br />
                  (Void)
               </div>
            </a>
         </div>

         <div class="mb-6 mt-6 flex justify-around md:mb-0 md:justify-start md:gap-5">
            <a href="https://www.instagram.com/werdox.dev/" target="_blank" class="rounded-md bg-primary p-2.5 transition-all hover:bg-primary/50">
               <Icon icon="ri:instagram-fill" class="size-7" />
            </a>

            <a href="https://x.com/Matin90365857" target="_blank" class="rounded-md bg-primary p-2.5 transition-all hover:bg-primary/50">
               <Icon icon="mdi:twitter" class="size-7" />
            </a>

            <a href="https://discord.gg/cad9P5dm3y" target="_blank" class="rounded-md bg-primary p-2.5 transition-all hover:bg-primary/50">
               <Icon icon="ic:baseline-discord" class="size-7" />
            </a>

            <a href="https://github.com/WerdoxDev/Huginn" target="_blank" class="rounded-md bg-primary p-2.5 transition-all hover:bg-primary/50">
               <Icon icon="bi:github" class="size-7" />
            </a>
         </div>
      </div>
   </div>
</template>
