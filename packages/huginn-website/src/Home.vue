<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Icon } from "@iconify/vue/dist/iconify.js";
import { Rive } from "@rive-app/canvas";
import { currentTheme } from "./scripts/useChangeTheme";
import Feature from "./components/Feature.vue";

const onlineCount = ref("");

onMounted(async () => {
   try {
      const countData = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/api/online-users`);
      onlineCount.value = (await countData.json()).count.toLocaleString();
   } catch (e) {
      console.error("Something went wrong fetching user count!");
   }

   const rive = new Rive({
      src: "/huginn-website-intro.riv",
      canvas: document.getElementById("intro") as HTMLCanvasElement,
      autoplay: true,
      isTouchScrollEnabled: true,
      stateMachines: "Main",
      onLoad: () => {
         rive.resizeDrawingSurfaceToCanvas();
      },
   });

   window.addEventListener("resize", () => {
      rive.resizeDrawingSurfaceToCanvas();
   });
});
</script>

<template>
   <!-- Opening Section -->
   <div class="mt-32 flex w-full items-center justify-center md:mt-52">
      <div class="flex flex-col md:flex-row md:space-x-7">
         <div class="w-full px-4 md:w-96 md:px-0">
            <div class="flex flex-col items-center justify-center md:flex-row md:justify-start">
               <img :src="`/logo/${currentTheme.logoOutline}`"
                  class="size-24 md:size-20 object-contain transition-all hover:-rotate-12 active:rotate-6" />
               <p class="text-5xl font-extrabold text-text mt-4 md:mt-0 md:ml-4">Huginn</p>
            </div>

            <div
               class="w-fit flex flex-row items-center mx-auto mt-8 py-2 px-4 pr-6 gap-x-2 bg-tertiary/50 transition-all shadow-md hover:shadow-lg border border-primary rounded-full">
               <Icon icon="mingcute:group-3-fill" class="size-10 text-accent" />
               <p class="text-center md:text-left text-xl font-bold"><span class="font-bold text-accent">100</span>
                  warriors chatting!
               </p>
            </div>

            <p class="mx-2 mt-8 text-center text-2xl md:mx-0 md:text-left">
               A fast, customizable chat app with a touch of Norse mythology.
            </p>

            <div class="flex w-full flex-row space-x-2 mt-12">
               <RouterLink to="/download"
                  class="flex h-12 w-full items-center justify-center space-x-2 rounded-md bg-primary px-5 text-xl transition-all hover:bg-primary/50">
                  <div class="font-bold">DOWNLOAD HUGINN</div>
                  <Icon icon="mingcute:windows-fill" class="size-6" />
               </RouterLink>

               <a href="https://app.Huginn.dev/"
                  class="hidden size-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-[#464646] bg-secondary transition-all hover:bg-tertiary md:flex">
                  <Icon icon="mingcute:chrome-fill" class="size-8" />
               </a>
            </div>
         </div>

         <div class="mx-4 mt-6 rounded-2xl bg-secondary p-1 md:mx-0 md:mt-0">
            <canvas class="w-full md:w-[35rem]" width="500" height="320" id="intro"></canvas>
         </div>
      </div>
   </div>

   <!-- Features -->
   <div class="mb-12 mt-24 flex items-center justify-center px-4 md:mb-40 md:mt-52 md:px-0">
      <div class="flex flex-col gap-10 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-16">
         <Feature icon="raphael:opensource" header="Open Source and Free"
            text="Huginn is made to be open-source. Everything you see is available to use under the  GNU GPLv3 license. Contribution is always welcome and encouraged" />
         <Feature icon="mingcute:lightning-fill" header="Fast, Secure, and Lightweight"
            text="Huginn leverages the latest technologies to provide a fast, lightweight and secure app all with a very tiny bundle size!" />
         <Feature icon="mingcute:paint-2-fill" header="Customizable and Fun"
            text="Make Huginn your own with easy customization options, designed for both simplicity and a fun, engaging chat experience." />
         <Feature icon="eos-icons:api" header="Extensive API"
            text="Huginn's API is so simple to use that anyone with basic node knowledge can do cool stuff with it!" />
      </div>
   </div>
</template>
