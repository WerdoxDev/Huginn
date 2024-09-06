<script setup lang="ts">

import { Icon } from '@iconify/vue/dist/iconify.js';
import Feature from './components/Feature.vue';
import { RouterLink } from 'vue-router';
import { Rive } from '@rive-app/canvas';
import { onMounted } from 'vue';



onMounted(() => {
    const rive = new Rive({
        src: "/public/huginn-website-intro.riv",
        canvas: document.getElementById("intro") as HTMLCanvasElement,
        autoplay: true,
        stateMachines: "State Machine 1",
        onLoad: () => { rive.resizeDrawingSurfaceToCanvas() }

    })

    window.addEventListener("resize", () => {
        rive.resizeDrawingSurfaceToCanvas()
    })
})

</script>

<template>

    <!-- Opening Section -->
    <div class="flex justify-center items-center w-full mt-52">
        <div class="flex flex-row space-x-7">

            <div class="w-96">

                <div class="flex items-center">
                    <img src="/huginn-logo.svg"
                        class="size-20 object-contain transition-all hover:-rotate-12 active:rotate-6" />
                    <p class="text-5xl text-[#EBEBD3] font-extrabold ml-4">Huginn</p>
                </div>

                <p class="mt-6 text-2xl">Step through Bifröst and enjoy chatting with your friends using Huginn in
                    Asgard.</p>

                <div class="flex flex-row items-center mt-6 space-x-2">
                    <div class="rounded-full bg-green-400 size-2" />
                    <p class="text-[0.65rem] font-bold">CHATTING</p>
                </div>

                <div>
                    <p class="text-2xl">6,985,420</p>
                </div>

                <div class="flex flex-row pt-10 w-full space-x-2">
                    <RouterLink to="/download"
                        class="flex justify-center items-center text-xl bg-[#7B563C] rounded-md px-5 w-full h-12 space-x-2 transition-all hover:bg-[#7b563c]/50">
                        <div class="font-bold">DOWNLOAD HUGINN</div>
                        <Icon icon="mingcute:windows-fill" class="size-6" />
                    </RouterLink>

                    <a href="https://app.Huginn.dev/"
                        class="bg-[#262626] border-2 border-[#464646] size-12 rounded-md flex flex-shrink-0 justify-center items-center transition-all hover:bg-[#1f1f1f]">
                        <Icon icon="mingcute:chrome-fill" class="size-8" />
                    </a>
                </div>

            </div>

            <div class="bg-[#262626] p-1 rounded-2xl">
                <canvas class="w-[35rem]" width="500" height="320" id="intro"></canvas>
            </div>

        </div>
    </div>

    <!-- Features -->
    <div class="flex justify-center items-center mt-52 mb-40">
        <div class="grid grid-cols-2 grid-rows-2 gap-16">
            <Feature icon="raphael:opensource" header="Open Source"
                text="Huginn is made to be open-source. Everything you see is available to use under the  GNU GPLv3 license. Contribution is always welcome and encouraged" />
            <Feature icon="eos-icons:api" header="Extensive API"
                text="Huginn's API is so simple to use that anyone with basic node knowledge can do cool stuff with it!" />
            <Feature icon="mdi:clock" header="Soon..." text="" />
            <Feature icon="mdi:clock" header="Soon..." text="" />
        </div>
    </div>

</template>