<script setup lang="ts">
import { Icon } from "@iconify/vue";
import CustomList from "./components/CustomList.vue";
import { computed, onMounted, ref } from "vue";
import { APIGetReleasesResult } from "@huginn/shared";

type VersionKind = "none" | "release" | "nightly";
type PlatformKind = "windows" | "mac" | "linux";

const versionKind = ref<VersionKind>(); // 1 = Release, 2 = Dev
const platformKind = ref<PlatformKind>("windows"); // 0 = Windows, 1 = Mac, 2 = Linux
const isAnyVersionAvailable = ref(false);

const versionTexts = ref<Record<string, { version: string; date: string; prerelease?: string; buildId?: string }>>({});

const buttonVersionText = computed(() => {
   if (platformKind.value === "windows") {
      if (versionKind.value === "release") {
         return versionTexts.value?.release.version;
      } else if (versionKind.value === "nightly") {
         return `${versionTexts.value?.nightly?.version} ${versionTexts.value?.nightly?.prerelease}`;
      }
   }
});
const dateText = computed(() => {
   if (platformKind.value === "windows") {
      if (versionKind.value === "release") {
         return versionTexts.value?.release.date;
      } else if (versionKind.value === "nightly") {
         return versionTexts.value?.nightly.date;
      }
   }
});

const latestInfo = ref<APIGetReleasesResult>();

onMounted(async () => {
   console.log(import.meta.env.VITE_SERVER_ADDRESS, "hi");
   try {
      const data = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/api/releases`);
      latestInfo.value = await data.json();
   } catch {
      console.error("Something went wrong fetching releases.");
   }

   if (latestInfo.value && latestInfo.value.nightly) {
      const nightlySplit = latestInfo.value?.nightly.version.split("-");

      if (nightlySplit) {
         const nightlyDate = new Date(latestInfo.value.nightly.date);

         // Pure version number without 'v' at the beginning
         const version = nightlySplit[0].slice(1);

         const nightlyPrereleaseSplit = nightlySplit[1].split(".");

         // Prerelease identifier with first character in uppercase
         const prerelease = nightlyPrereleaseSplit[0].charAt(0).toUpperCase() + nightlyPrereleaseSplit[0].slice(1);

         // Prerelease build identifier
         const buildId = nightlyPrereleaseSplit[1];

         const date = getFormattedDate(nightlyDate);

         versionTexts.value.nightly = { version, prerelease, buildId, date };
      }
   }

   if (latestInfo.value && latestInfo.value.release) {
      const releaseDate = new Date(latestInfo.value.release.date);
      const version = latestInfo.value.release.version.slice(1);
      const date = getFormattedDate(releaseDate);

      versionTexts.value.release = { version, date };
   }

   updateVersionAvailabilities();
});

function getFormattedDate(date: Date) {
   return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`;
}

function download(platform: PlatformKind, version: VersionKind) {
   let downloadLink = getDownloadLink(platform, version);
   window.open(downloadLink);
}

function getDownloadLink(platform: PlatformKind, version: VersionKind): string | undefined {
   if (platform === "windows") {
      // Selected Windows

      if (version === "release") {
         // Selected Release version
         return latestInfo.value?.release?.windowsSetupUrl;
      } else if (version === "nightly") {
         // Selected Dev version
         return latestInfo.value?.nightly?.windowsSetupUrl;
      }
   }

   return undefined;
}

function isVersionAvailable(version: VersionKind): boolean {
   if (!platformKind.value) {
      return false;
   }

   const downloadLink = getDownloadLink(platformKind.value, version);
   return !!downloadLink;
}

function updateVersionAvailabilities() {
   for (let i: number = 0; i < 2; i++) {
      const version = i + 1 === 1 ? "release" : "nightly";
      let versionAvailable: boolean = isVersionAvailable(version);

      if (versionAvailable) {
         versionKind.value = version;
         isAnyVersionAvailable.value = true;
         break;
      }
   }
}
</script>

<template>
   <div class="mt-16 flex h-full w-full items-center justify-center">
      <div class="hidden w-full max-w-5xl flex-col md:flex">
         <h1 class="mb-6 text-4xl font-bold">Download Huginn</h1>
         <h3 class="text-lg">Thank you for downloading Huginn</h3>
         <h3 class="text-lg">Please choose your version</h3>

         <div class="my-10 h-0.5 w-[30rem] bg-[#EBEBD3]/50" />

         <div class="text-lg">
            <div class="flex flex-row" v-if="latestInfo && platformKind && versionKind">
               <span>Download <span class="font-bold">Huginn</span> for</span>

               <CustomList
                  class="w-36"
                  @changed="
                     selected => {
                        platformKind = selected;
                        updateVersionAvailabilities();
                     }
                  "
                  :default="platformKind"
                  :options="[
                     { text: 'Windows', icon: 'mingcute:windows-fill', disabled: false, hidden: false },
                     { text: 'Mac', icon: 'ic:baseline-apple', disabled: true, hidden: false },
                     { text: 'Linux', icon: 'mdi:linux', disabled: true, hidden: false },
                  ]"
               />

               running

               <CustomList
                  class="w-32"
                  @changed="
                     selected => {
                        versionKind = selected;
                     }
                  "
                  :default="versionKind"
                  :options="[
                     { text: 'None', icon: 'nimbus:forbidden', disabled: false, hidden: isAnyVersionAvailable },
                     {
                        text: 'Release',
                        icon: 'material-symbols:new-releases',
                        disabled: !isVersionAvailable('release'),
                        hidden: false,
                     },
                     { text: 'Nightly', icon: 'ph:moon-fill', disabled: !isVersionAvailable('nightly'), hidden: false },
                  ]"
               />
            </div>

            <div class="mt-6 flex items-center" v-if="latestInfo && platformKind && versionKind">
               <button
                  @click="download(platformKind!, versionKind!)"
                  class="flex w-max flex-row items-center gap-x-2 rounded-md bg-[#7b563c] px-4 py-2 transition-all hover:bg-[#7b563c]/50"
                  :class="{ 'bg-[#7b563c]/50': versionKind === 'none' }"
                  :disabled="versionKind === 'none'"
               >
                  <Icon icon="mingcute:download-3-fill" />
                  {{ versionKind !== "none" ? "Download Huginn " + buttonVersionText : "Select a Version" }}
               </button>

               <div
                  class="ml-4 flex h-full w-fit items-center rounded-md bg-[#76FF7A]/30 px-4 py-2"
                  :class="{ hidden: versionKind === 'none' }"
               >
                  <Icon icon="clarity:date-solid" class="mr-2" />
                  {{ dateText }}
               </div>

               <div
                  class="ml-4 flex h-full w-fit items-center rounded-md bg-[#00A7E0]/30 px-4 py-2"
                  :class="{ hidden: versionKind !== 'nightly' }"
               >
                  <Icon icon="mdi:wrench" class="mr-2" />
                  Build {{ versionTexts?.nightly?.buildId?.toUpperCase() }}
               </div>
            </div>
         </div>
      </div>

      <div class="flex flex-col items-center justify-center gap-12 px-6 md:hidden">
         <Icon icon="clarity:sad-face-solid" class="size-20" />
         <div class="text-center text-2xl">Unfortunately <span class="font-bold">Huginn</span> is not available for your device.</div>
         <RouterLink to="/" class="flex items-center text-[#D99A6C] underline">
            <Icon icon="lets-icons:back" class="mr-1" />Back to Homepage
         </RouterLink>
      </div>
   </div>
</template>
