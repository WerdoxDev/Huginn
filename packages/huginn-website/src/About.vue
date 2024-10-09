<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
</script>

<template>
    <div class="flex justify-center items-center h-full mt-32 md:mt-20">
        <div class="flex flex-col w-full px-4 md:max-w-5xl">

            <div class="flex items-center justify-center md:justify-start">
                <img src="/huginn-logo.svg"
                    class="size-12 object-contain transition-all hover:-rotate-12 active:rotate-6" />
                <p class="text-4xl text-[#EBEBD3] font-bold ml-2">About Huginn</p>
            </div>

            <div class="my-6 h-0.5 w-auto bg-[#EBEBD3]/50" />

            <h3 class="text-lg md:text-xl">
                <span class="font-bold">Huginn</span> is a chat app with a <span class="text-[#82ccdd]">Norse</span>
                twist!
                Inspired by one of <span class="text-[#b8e994]">Odin</span>'s ravens, <span
                    class="text-[#D99A6C]">Huginn</span> brings a bit of <span class="text-[#fa8072]">Viking</span>
                flair to
                your everyday conversations. It's an <span class="text-[#b8e994]">open-source</span>, <span
                    class="text-[#00a7e3]">highly customizable</span> platform that's as easy to use as it is fast.
                Whether
                you're discussing the latest news or planning your next raid <span class="text-[#ebebd3]">(or, you know,
                    a
                    group project)</span>, Huginn offers a <span class="text-[#fa8072]">fun</span> and <span
                    class="text-[#82ccdd]">unique</span> way to <span class="text-[#00a7e3]">connect</span> with others.
            </h3>

            <div class="flex flex-col md:flex-row gap-2.5 md:gap-5 mt-6">
                <a href="https://github.com/WerdoxDev" target="_blank"
                    class="p-2 pr-4 rounded-lg bg-[#1f1f1f] transition-all hover:bg-[#1f1f1f]/50 flex gap-x-3 items-center">
                    <img src="https://github.com/werdoxdev.png" class="size-14 rounded-md shadow-lg hover:shadow-2xl" />
                    <div>
                        Matin Tat
                        <br />
                        (Werdox)
                    </div>
                </a>
                <a href="https://github.com/VoiD-ev" target="_blank"
                    class="p-2 pr-4 rounded-lg bg-[#1f1f1f] transition-all hover:bg-[#1f1f1f]/50 flex gap-x-3 items-center">
                    <img src="https://github.com/void-ev.png" class="size-14 rounded-md shadow-lg hover:shadow-2xl" />
                    <div>
                        Mahziyar Farahmandian
                        <br />
                        (Void)
                    </div>
                </a>
            </div>


            <div class="flex justify-around md:justify-start md:gap-5 mt-6 mb-6 md:mb-0">
                <a href="https://www.instagram.com/werdox.dev/" target="_blank"
                    class="p-2.5 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50 rounded-md">
                    <Icon icon="ri:instagram-fill" class="size-7" />
                </a>

                <a href="https://x.com/Matin90365857" target="_blank"
                    class="p-2.5 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50 rounded-md">
                    <Icon icon="mdi:twitter" class="size-7" />
                </a>

                <a href="https://discord.gg/cad9P5dm3y" target="_blank"
                    class="p-2.5 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50 rounded-md">
                    <Icon icon="ic:baseline-discord" class="size-7" />
                </a>

                <a href="https://github.com/WerdoxDev/Huginn" target="_blank"
                    class="p-2.5 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50 rounded-md">
                    <Icon icon="bi:github" class="size-7" />
                </a>
            </div>
        </div>
    </div>
</template>