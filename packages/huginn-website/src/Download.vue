<script setup lang="ts">

import { Icon } from '@iconify/vue/dist/iconify.js';
import CustomList from "./components/CustomList.vue";
import { computed, onMounted, ref } from 'vue';

const versionId = ref(0) // 0 = Release, 1 = Dev
const platformId = ref(0) // 0 = Windows, 1 = Mac, 2 = Linux
const isAnyVersionAvailable = ref(false)

const buttonVersionText = computed(() => {
    if (platformId.value === 0) {

        if (versionId.value === 1) {
            return latestInfo.value?.release.version
        }
        else if (versionId.value === 2) {
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
        const data = await fetch("https://asgard.huginn.dev/api/releases")
        latestInfo.value = await data.json()

        for (let i: number = 0; i < 2; i++) {
            let isVersionAvailable: boolean = getVersionAvailability(i === 1)

            if (isVersionAvailable) {
                versionId.value = i + 1
                isAnyVersionAvailable.value = true
                break
            }
        }
    }
    catch {
        console.error("Something went wrong fetching releases.")
    }

})

function download(platform: number, version: number) {
    let downloadLink = getDownloadLink(platform, version)
    window.open(downloadLink)
}

function getDownloadLink(platform: number, version: number): string | undefined {
    if (platform === 0) { // Selected Windows

        if (version === 1) { // Selected Release version
            return latestInfo.value?.release.windowsSetupUrl
        }
        else if (version === 2) { // Selected Dev version
            return latestInfo.value?.dev.windowsSetupUrl
        }
    }
}

function getVersionAvailability(isDev: boolean): boolean {
    if (isDev) {
        return getDownloadLink(platformId.value, 2) !== undefined
    }
    else {
        return getDownloadLink(platformId.value, 1) !== undefined
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

                <div class="flex flex-row" v-if="latestInfo">

                    <span>Download <span class="font-bold">Huginn</span> for</span>

                    <CustomList class="w-36" @changed="(id) => { platformId = id }" :default-id="platformId" :options="[
                        { id: 0, text: 'Windows', icon: 'mingcute:windows-fill', disabled: false, hidden: false },
                        { id: 1, text: 'Mac', icon: 'ic:baseline-apple', disabled: true, hidden: false },
                        { id: 2, text: 'Linux', icon: 'mdi:linux', disabled: true, hidden: false },
                    ]" />

                    running

                    <CustomList class="w-32" @changed="(id) => { versionId = id }" :default-id="versionId" :options="[
                        { id: 0, text: 'None', icon: 'nimbus:forbidden', disabled: false, hidden: isAnyVersionAvailable },
                        { id: 1, text: 'Release', icon: 'material-symbols:new-releases', disabled: getVersionAvailability(true), hidden: false },
                        { id: 2, text: 'Dev', icon: 'fluent:window-dev-tools-16-filled', disabled: getVersionAvailability(false), hidden: false },
                    ]" />

                </div>

                <button @click="download(platformId, versionId)"
                    class="flex flex-row items-center rounded-md w-max mt-6 px-4 py-2 gap-x-2 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50"
                    :class="{ 'bg-[#7b563c]/50': versionId === 0 }" :disabled="versionId === 0">
                    <Icon icon="mingcute:download-3-fill" />
                    {{ versionId !== 0 ? "Download Huginn " + buttonVersionText : "Select a Version" }}
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