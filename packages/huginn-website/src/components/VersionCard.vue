<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import type { APIRelease } from "@huginn/shared";
import { Icon } from "@iconify/vue/dist/iconify.js";
import moment from "moment";
import PlatformItem from "./PlatformItem.vue";

const props = defineProps<APIRelease & { latest?: boolean }>();

</script>

<template>
   <Transition name="version-card" appear>
      <div
         class="rounded-lg group p-4 border border-text/50 bg-secondary border-b-2 w-full md:max-w-md shadow-md hover:shadow-lg"
         :class="latest ? 'border-b-success/70' : 'border-b-warning/70'">
         <div class="flex items-center">
            <div class="text-xl font-semibold">{{ version }}</div>
            <div :class="latest ? 'border-success/70 text-success' : 'border-warning/70 text-warning'"
               class="rounded-lg border py-0.5 px-2 ml-2">{{ latest ? "latest" : "old" }}
            </div>
            <div class="hidden md:block ml-auto text-text/70 self-start">{{ moment(date).format("Do MMM YYYY") }}</div>
            <div class="md:hidden ml-auto text-text/70 self-start">{{ moment(date).format("DD.MM.YYYY") }}</div>
         </div>

         <div class="mt-3">{{ description }}
            <span v-if="!description" class="italic">This release has no description</span>
         </div>
         <div class="flex justify-between items-end mt-3">
            <div class="shrink-0 flex justify-center items-center gap-x-2">
               <Icon icon="mingcute:windows-fill" class="size-6"
                  :class="windowsSetupUrl ? 'text-white' : 'text-white/50'" />
               <Icon icon="mingcute:apple-fill" class="size-6"
                  :class="macosSetupUrl ? 'text-white' : 'text-white/50'" />
               <Icon icon="mingcute:linux-fill" class="size-6"
                  :class="linuxSetupUrl ? 'text-white' : 'text-white/50'" />
            </div>
            <Popover class="relative" v-slot="{ open }">
               <PopoverButton
                  class="rounded-md outline-none transition-all bg-background/100 border border-success/50 text-white hover:bg-background/50 hover:border-success py-2 px-4 w-fit ml-auto cursor-pointer flex justify-center items-center gap-x-2">
                  <Icon icon="mingcute:download-3-fill" class="size-5" />
                  <span>Download</span>
                  <Icon icon="mingcute:down-fill" class="size-5 transition-all" :class="open ? '-scale-100' : ''" />
               </PopoverButton>
               <Transition enter-active-class="transition duration-200 ease-out"
                  enter-from-class="translate-y-1 opacity-0" enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition duration-150 ease-in" leave-from-class="translate-y-0 opacity-100"
                  leave-to-class="translate-y-1 opacity-0">
                  <PopoverPanel
                     class="flex flex-col absolute bg-tertiary p-2 right-0 left-0 top-12 rounded-lg z-10 gap-y-1 shadow-md">
                     <PlatformItem icon="mingcute:windows-fill" text="Windows" :url="windowsSetupUrl" />
                     <PlatformItem icon="mingcute:apple-fill" text="MacOS" :url="macosSetupUrl" />
                     <PlatformItem icon="mingcute:linux-fill" text="Linux" :url="linuxSetupUrl" />
                  </PopoverPanel>
               </Transition>
            </Popover>
         </div>
      </div>
   </Transition>
</template>
