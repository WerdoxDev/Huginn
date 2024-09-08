<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Icon } from "@iconify/vue/dist/iconify.js";
import { Rive } from "@rive-app/canvas";
import Feature from "./components/Feature.vue";

const onlineCount = ref("");

onMounted(async () => {
   try {
      const countData = await fetch("https://asgard.huginn.dev/api/online-users");
      onlineCount.value = (await countData.json()).count.toLocaleString();
   } catch (e) {
      console.error("Something went wrong fetching user count!");
   }

   const rive = new Rive({
      src: "/huginn-website-intro.riv",
      canvas: document.getElementById("intro") as HTMLCanvasElement,
      autoplay: true,
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
   <div class="mt-32 md:mt-52 flex w-full items-center justify-center">
      <div class="flex flex-col md:flex-row md:space-x-7">
         <div class="w-full px-4 md:px-0 md:w-96">
            <div class="flex items-center justify-center md:justify-start flex-col md:flex-row">
               <img src="/huginn-logo.svg"
                  class="size-20 object-contain transition-all hover:-rotate-12 active:rotate-6" />
               <p class="ml-4 text-5xl font-extrabold text-[#EBEBD3]">Huginn</p>
            </div>

            <p class="mt-6 mx-2 md:mx-0 text-center md:text-left text-2xl">A fast, customizable chat app with a touch of
               Norse mythology.</p>

            <div class="mt-6 flex flex-row justify-center md:justify-start items-center space-x-2">
               <div class="size-2 rounded-full bg-green-400" />
               <p class="text-sm md:text-xs font-bold">CHATTING</p>
            </div>

            <div>
               <p class="text-3xl md:text-2xl text-center md:text-left">{{ onlineCount }}</p>
            </div>

            <div class="flex w-full flex-row space-x-2 pt-10">
               <RouterLink to="/download"
                  class="flex h-12 w-full items-center justify-center space-x-2 rounded-md bg-[#7B563C] px-5 text-xl transition-all hover:bg-[#7b563c]/50">
                  <div class="font-bold">DOWNLOAD HUGINN</div>
                  <Icon icon="mingcute:windows-fill" class="size-6" />
               </RouterLink>

               <a href="https://app.Huginn.dev/"
                  class="hidden md:flex size-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-[#464646] bg-[#262626] transition-all hover:bg-[#1f1f1f]">
                  <Icon icon="mingcute:chrome-fill" class="size-8" />
               </a>
            </div>
         </div>

         <div class="rounded-2xl bg-[#262626] mx-4 md:mx-0 mt-6 md:mt-0 p-1">
            <canvas class="w-full md:w-[35rem]" width="500" height="320" id="intro"></canvas>
         </div>
      </div>
   </div>

   <!-- Features -->
   <div class="mb-12 md:mb-40 mt-24 md:mt-52 px-6 md:px-0 flex items-center justify-center">
      <div class="flex flex-col md:grid md:grid-cols-2 md:grid-rows-2 gap-10 md:gap-16">
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
