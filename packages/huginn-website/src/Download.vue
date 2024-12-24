<script setup lang="ts">
import type { APIGetLatestReleasesResult } from "@huginn/shared";
import { onMounted, ref } from "vue";
import VersionCard from "./components/VersionCard.vue";

export type FlavourType = "nightly" | "release";
const releases = ref<APIGetLatestReleasesResult | undefined>(undefined);

onMounted(async () => {
   const url = new URL("/api/latest-releases", import.meta.env.VITE_SERVER_ADDRESS).toString();
   releases.value = await (await fetch(url)).json();
})
</script>

<template>
   <div class="flex justify-center w-full h-full">
      <div class="flex flex-col h-full justify-center w-full">
         <div class="flex flex-col items-center mt-10 mb-10">
            <div class="text-5xl font-extrabold text-center w-full mt-10 md:mt-0">Download Huginn</div>
            <div class="text-xl mt-7 text-center w-full">Please choose your version</div>
            <!-- <div class="bg-text w-full h-0.5 mt-4 "></div> -->
         </div>

         <div class="flex flex-col gap-y-5 justify-center items-center px-4">
            <VersionCard v-if="releases?.release" :version="releases.release.version" :date="releases.release.date"
               :url="releases.release.url" :windows-setup-url="releases.release.windowsSetupUrl"
               :macos-setup-url="releases.release.macosSetupUrl" :linux-setup-url="releases.release.linuxSetupUrl" />

            <VersionCard v-if="releases?.nightly" :version="releases.nightly.version" :date="releases.nightly.date"
               :url="releases.nightly.url" :windows-setup-url="releases.nightly.windowsSetupUrl"
               :macos-setup-url="releases.nightly.macosSetupUrl" :linux-setup-url="releases.nightly.linuxSetupUrl" />
         </div>
      </div>
   </div>
</template>
