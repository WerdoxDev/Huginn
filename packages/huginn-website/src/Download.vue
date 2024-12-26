<script setup lang="ts">
import type { APIGetAllReleasesResult, APIGetLatestReleaseResult } from "@huginn/shared";
import { onMounted, ref } from "vue";
import VersionCard from "./components/VersionCard.vue";

export type FlavourType = "nightly" | "release";
const latestRelease = ref<APIGetLatestReleaseResult>(undefined);
const allReleases = ref<APIGetAllReleasesResult>([]);
const loading = ref(false);
const loading2 = ref(false);
const showingOlder = ref(false);

onMounted(async () => {
   loading.value = true;
   const url = new URL("/api/latest-release", import.meta.env.VITE_SERVER_ADDRESS).toString();
   latestRelease.value = await (await fetch(url)).json();
   loading.value = false;
})

async function loadOrHideOlder() {
   if (showingOlder.value) {
      allReleases.value = [];
      showingOlder.value = false;
      return;
   }

   loading2.value = true;

   const url = new URL("/api/all-releases", import.meta.env.VITE_SERVER_ADDRESS).toString();
   allReleases.value = (await (await fetch(url)).json() as APIGetAllReleasesResult).filter(x => x.version !== latestRelease.value?.version);

   loading2.value = false;
   showingOlder.value = true;
}
</script>

<template>
   <div class="flex flex-col mt-32 md:mt-52 w-full">
      <div class="flex flex-col mb-10">
         <div class="text-5xl font-extrabold text-center w-full">Download Huginn</div>
         <div class="text-xl mt-7 text-center w-full">Please choose your version</div>
      </div>

   </div>
   <div class="flex flex-col gap-y-5 items-center px-4 mb-auto pb-32">
      <div v-if="loading" class="text-xl font-bold animate-pulse">Loading...</div>

      <VersionCard v-if="latestRelease" :version="latestRelease.version" :date="latestRelease.date" latest
         :url="latestRelease.url" :windows-setup-url="latestRelease.windowsSetupUrl"
         :macos-setup-url="latestRelease.macosSetupUrl" :linux-setup-url="latestRelease.linuxSetupUrl" />

      <button class="hover:underline text-accent text-lg" @click="loadOrHideOlder" v-if="!loading2 && !loading">{{
         showingOlder
            ? "Hide older versions" : "Load older versions" }}</button>

      <div v-if="loading2" class="text-xl font-bold animate-pulse">Loading...</div>

      <VersionCard v-for="release in allReleases" :version="release.version" :date="release.date" :url="release.url"
         :windows-setup-url="release.windowsSetupUrl" :macos-setup-url="release.macosSetupUrl"
         :linux-setup-url="release.linuxSetupUrl" />

      <div v-if="showingOlder && allReleases.length === 0" class="text-lg">No more releases...</div>
   </div>
</template>
