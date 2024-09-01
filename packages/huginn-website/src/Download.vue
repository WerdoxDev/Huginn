<script setup lang="ts">
import { Icon } from '@iconify/vue/dist/iconify.js';
import { ref } from 'vue';

const platformSelect = ref<HTMLSelectElement | null>(null)
const versionSelect = ref<HTMLSelectElement | null>(null)

function download() {
    if (platformSelect.value?.value === "windows") {

        if (versionSelect.value?.value === "release") {
            window.open("https://github.com/WerdoxDev/Huginn/releases/download/v0.3.1/Huginn_0.3.1_x64_en-US.msi")
        }
        else if (versionSelect.value?.value === "dev") {
            window.open("https://github.com/WerdoxDev/Huginn/releases/download/v0.3.2-dev/Huginn_0.3.2_x64_en-US.msi")
        }
    }
}

</script>

<template>
    <div class="flex flex-col h-full mt-48 px-64">
        <h1 class="text-4xl font-bold mb-6">Download Huginn</h1>
        <h3 class="text-lg">Thank you for downloading Huginn</h3>
        <h3 class="text-lg">Please choose your version</h3>

        <div class="my-10 h-0.5 w-[30rem] bg-[#EBEBD3]/50" />

        <div class="text-lg">
            <p>
                Download <span class="font-bold">Huginn</span> for

                <select class="mx-1" ref="platformSelect">
                    <option value="windows">Windows</option>
                </select>

                running

                <select class="ml-1" ref="versionSelect">
                    <option value="release">Release</option>
                    <option value="dev">Dev</option>
                </select>
            </p>

            <button @click="download"
                class="flex flex-row items-center rounded-md w-max mt-6 px-4 py-2 gap-x-2 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50">
                <Icon icon="mingcute:download-3-fill" />
                Download Huginn 0.3.2
            </button>

        </div>
    </div>
</template>