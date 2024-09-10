<script setup lang="ts">

import { Icon } from '@iconify/vue/dist/iconify.js';
import CustomList from "./components/CustomList.vue";
import { computed, onMounted, ref } from 'vue';

const versionId = ref(0) // 1 = Release, 2 = Dev
const platformId = ref(0) // 0 = Windows, 1 = Mac, 2 = Linux
const isAnyVersionAvailable = ref(false)



const versionTexts = ref<{
    release: {
        version: string,
        date: string,
    },
    nightly: {
        version: string,
        date: string,
        buildId: string,
    }
}>({
    release: {
        version: "",
        date: "",
    },
    nightly: {
        version: "",
        date: "",
        buildId: "",
    }
})

const buttonVersionText = computed(() => {
    if (platformId.value === 0) {

        if (versionId.value === 1) {
            return versionTexts.value?.release.version
        }
        else if (versionId.value === 2) {
            return versionTexts.value?.nightly.version
        }
    }
})
const dateText = computed(() => {
    if (platformId.value === 0) {

        if (versionId.value === 1) {
            return versionTexts.value?.release.date
        }
        else if (versionId.value === 2) {
            return versionTexts.value?.nightly.date
        }
    }
})

const latestInfo = ref<{
    release: {
        version: string,
        windowsSetupUrl: string,
        date: string
    } | undefined,
    nightly: {
        version: string,
        windowsSetupUrl: string,
        date: string
    } | undefined
} | undefined>()



onMounted(async () => {

    try {
        const data = await fetch("https://asgard.huginn.dev/api/releases")
        latestInfo.value = await data.json()

        // latestInfo.value = {
        //     release: {
        //         version: "v0.3.1",
        //         windowsSetupUrl: "https://github.com/WerdoxDev/Huginn/releases/download/nightly-20240908-e366086/huginn-0.3.3-nightly-20240908a-setup.exe",
        //         date: "2024-09-01T13:04:10.000Z"
        //     },
        //     // release: undefined,
        //     nightly: undefined
        //     // nightly: {
        //     //     version: "v0.3.3-nightly-20240908a",
        //     //     // windowsSetupUrl: "https://github.com/WerdoxDev/Huginn/releases/download/nightly-20240908-e366086/huginn-0.3.3-nightly-20240908a-setup.exe",
        //     //     windowsSetupUrl: "",
        //     //     date: "2024-10-07T22:00:00.000Z"
        //     // }
        // }

        if (latestInfo.value.nightly) {
            const proccessedNightlyVersion = latestInfo.value?.nightly.version.split('-')


            if (versionTexts.value && proccessedNightlyVersion && latestInfo.value) {
                const nightlyDate = new Date(latestInfo.value.nightly.date)
                proccessedNightlyVersion[0] = proccessedNightlyVersion[0].slice(1)
                proccessedNightlyVersion[1] = proccessedNightlyVersion[1].charAt(0).toUpperCase() + proccessedNightlyVersion[1].slice(1)
                versionTexts.value.nightly.version = `${proccessedNightlyVersion[0]} ${proccessedNightlyVersion[1]}`
                versionTexts.value.nightly.date = `${nightlyDate.getDate().toString().padStart(2, "0")}.${nightlyDate.getMonth().toString().padStart(2, "0")}.${nightlyDate.getFullYear()}`
                versionTexts.value.nightly.buildId = latestInfo.value.nightly.version[latestInfo.value.nightly.version.length - 1]
            }
        }

        if (versionTexts.value && latestInfo.value && latestInfo.value.release) {
            const releaseDate = new Date(latestInfo.value.release.date)
            versionTexts.value.release.version = latestInfo.value.release.version.slice(1)
            versionTexts.value.release.date = `${releaseDate.getDate().toString().padStart(2, "0")}.${releaseDate.getMonth().toString().padStart(2, "0")}.${releaseDate.getFullYear()}`
        }

        updateVersionAvailabilities()
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
            return latestInfo.value?.release?.windowsSetupUrl
        }
        else if (version === 2) { // Selected Dev version
            return latestInfo.value?.nightly?.windowsSetupUrl
        }
    }

    return undefined
}

function getVersionAvailability(isNightly: boolean): boolean {
    if (isNightly) {
        const downloadLink = getDownloadLink(platformId.value, 2)
        return downloadLink !== undefined && downloadLink !== "" && latestInfo.value?.nightly !== undefined
    }
    else {
        const downloadLink = getDownloadLink(platformId.value, 1)
        return downloadLink !== undefined && downloadLink !== "" && latestInfo.value?.release !== undefined
    }
}

function updateVersionAvailabilities() {
    for (let i: number = 0; i < 2; i++) {
        let isVersionAvailable: boolean = getVersionAvailability(i === 1)

        if (isVersionAvailable) {
            versionId.value = i + 1
            isAnyVersionAvailable.value = true
            break
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

                <div class="flex flex-row" v-if="latestInfo">

                    <span>Download <span class="font-bold">Huginn</span> for</span>

                    <CustomList class="w-36" @changed="(id) => { platformId = id; updateVersionAvailabilities(); }"
                        :default-id="platformId" :options="[
                            { id: 0, text: 'Windows', icon: 'mingcute:windows-fill', disabled: false, hidden: false },
                            { id: 1, text: 'Mac', icon: 'ic:baseline-apple', disabled: true, hidden: false },
                            { id: 2, text: 'Linux', icon: 'mdi:linux', disabled: true, hidden: false },
                        ]" />

                    running

                    <CustomList class="w-32" @changed="(id) => { versionId = id }" :default-id="versionId" :options="[
                        { id: 0, text: 'None', icon: 'nimbus:forbidden', disabled: false, hidden: isAnyVersionAvailable },
                        { id: 1, text: 'Release', icon: 'material-symbols:new-releases', disabled: !getVersionAvailability(false), hidden: false },
                        { id: 2, text: 'Nightly', icon: 'ph:moon-fill', disabled: !getVersionAvailability(true), hidden: false },
                    ]" />

                </div>

                <div class="flex items-center mt-6">

                    <button @click="download(platformId, versionId)"
                        class="flex flex-row items-center rounded-md w-max px-4 py-2 gap-x-2 bg-[#7b563c] transition-all hover:bg-[#7b563c]/50"
                        :class="{ 'bg-[#7b563c]/50': versionId === 0 }" :disabled="versionId === 0">
                        <Icon icon="mingcute:download-3-fill" />
                        {{ versionId !== 0 ? "Download Huginn " + buttonVersionText : "Select a Version" }}
                    </button>

                    <div class="flex bg-[#76FF7A]/30 rounded-md w-fit h-full px-4 py-2 ml-4 items-center"
                        :class="{ 'hidden': versionId === 0 }">
                        <Icon icon="clarity:date-solid" class="mr-2" />
                        {{ dateText }}
                    </div>

                    <div class="flex bg-[#00A7E0]/30 rounded-md w-fit h-full px-4 py-2 ml-4 items-center"
                        :class="{ 'hidden': versionId !== 2 }">
                        <Icon icon="mdi:wrench" class="mr-2" />
                        Build {{ versionTexts?.nightly.buildId.toUpperCase() }}
                    </div>
                </div>
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