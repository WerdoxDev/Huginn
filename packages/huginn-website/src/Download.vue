<script setup lang="ts">
import VersionCard from './components/VersionCard.vue';

export type flavourType = "Nightly" | "Release"
export type platformType = "Windows" | "Mac" | "Linux"

</script>

<template>
   <div class="flex justify-center w-full h-full">
      <div class="flex flex-col h-full w-2/4 justify-center">
         <div class="flex flex-col items-center mt-10 mb-12">
            <div class="text-5xl font-extrabold text-center w-full">Download Huginn</div>
            <div class="text-xl font-semibold mt-7 text-center w-full">Please choose your version</div>
            <div class="bg-text w-1/2 h-0.5 mt-4"></div>
         </div>

         <div>
            <VersionCard version="0.0.1" date="2025.1.1" url="http://huginn.dev/" flavour="Nightly" platform="Windows"
               class="border border-text/50 bg-secondary" />
         </div>
      </div>
   </div>
</template>