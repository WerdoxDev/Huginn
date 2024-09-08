<script setup lang="ts">

import { Icon } from '@iconify/vue/dist/iconify.js';
import CustomList from "./components/CustomList.vue";
import { computed, onMounted, ref } from 'vue';

const versionId = ref(0) // 0 = Release, 1 = Dev
const platformId = ref(0) // 0 = Windows, 1 = Mac, 2 = Linux

const buttonVersionText = computed(() => {
    if (platformId.value === 0) {

        if (versionId.value === 0) {
            return latestInfo.value?.release.version
        }
        else if (versionId.value === 1) {
            return latestInfo.value?.dev.version
        }
    }
})

const latestInfo = ref<{
    release: {
        version: string,
        windowsSetupUrl: string
    },
    dev: {
        version: string,
        windowsSetupUrl: string
    }
} | undefined>()

onMounted(async () => {

    try {
        const data = await fetch("http://87.170.239.147:61184/api/releases")
        latestInfo.value = await data.json()
    }
    catch {
        console.error("Something went wrong fetching releases.")
    }

})

function download(platform: number, version: number) {
    if (platform === 0) { // Selected Windows

        if (version === 0) { // Selected Release version
            window.open(latestInfo.value?.release.windowsSetupUrl)
        }
        else if (version === 1) { // Selected Dev version
            window.open(latestInfo.value?.dev.windowsSetupUrl)
        }
    }
}

</script>

<template>
    <div class="flex justify-center items-center h-full mt-16 w-full">
        <div class="hidden md:flex flex-col max-w-5xl w-full">
            <h1 class="text-4xl font-bold mb-6">Download Huginn</h1>
            <h3 class="text-lg">Thank you for downloading Huginn</h3>
            <h3 class="text-lg">Please choose your version</h3>

            <div class="my-10 h-0.5 w-[30rem] bg-[#EBEBD3]/50" />

            <div class="text-lg">

                <div class="flex flex-row">

                    <span>Download <span class="font-bold">Huginn</span> for</span>

                    <CustomList class="w-36" @changed="(id) => { platformId = id }" :options="[
                        { id: 0, text: 'Windows', icon: 'mingcute:windows-fill', disabled: false },
                        { id: 1, text: 'Mac', icon: 'ic:baseline-apple', disabled: true },
                        { id: 2, text: 'Linux', icon: 'mdi:linux', disabled: true },
                    ]" />

                    running

                    <CustomList class="w-32" @changed="(id) => { versionId = id }" :options="[
                        { id: 0, text: 'Release', icon: 'material-symbols:new-releases', disabled: false },
                        { id: 1, text: 'Dev', icon: 'fluent:window-dev-tools-16-filled', disabled: false },
                    ]" />

                </div>

                <button @click="download(platformId, versionId)"
                    class="flex flex-row items-center rounded-md w-max mt-6 px-4 py-2 gap-x-2 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50">
                    <Icon icon="mingcute:download-3-fill" />
                    Download Huginn {{ buttonVersionText }}
                </button>

            </div>
        </div>

        <div class="flex flex-col justify-center items-center gap-12 px-6 md:hidden">
            <Icon icon="clarity:sad-face-solid" class="size-20" />
            <div class="text-center text-2xl">Unfortunately <span class="font-bold">Huginn</span> is not available for
                your device.</div>
            <RouterLink to="/" class="text-[#D99A6C] underline items-center flex">
                <Icon icon="lets-icons:back" class="mr-1" />Back to Homepage
            </RouterLink>
        </div>
    </div>
</template>