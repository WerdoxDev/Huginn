<script setup lang="ts">
import type { APIRelease } from "@huginn/shared";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import { Icon } from "@iconify/vue/dist/iconify.js";
import moment from "moment";

import PlatformItem from "./PlatformItem.vue";

const props = defineProps<APIRelease & { latest?: boolean }>();
</script>

<template>
   <Transition name="version-card" appear>
      <div
         class="group w-full rounded-lg border border-b-2 border-text/50 bg-secondary p-4 shadow-md hover:shadow-lg md:max-w-md"
         :class="latest ? 'border-b-success/70' : 'border-b-warning/70'"
      >
         <div class="flex items-center">
            <div class="text-xl font-semibold">{{ version }}</div>
            <div :class="latest ? 'border-success/70 text-success' : 'border-warning/70 text-warning'" class="ml-2 rounded-lg border px-2 py-0.5">
               {{ latest ? "latest" : "old" }}
            </div>
            <div class="ml-auto hidden self-start text-text/70 md:block">
               {{ moment(date).format("Do MMM YYYY") }}
            </div>
            <div class="ml-auto self-start text-text/70 md:hidden">
               {{ moment(date).format("DD.MM.YYYY") }}
            </div>
         </div>

         <div class="mt-3">
            {{ description }}
            <span v-if="!description" class="italic">This release has no description</span>
         </div>
         <div class="mt-3 flex items-end justify-between">
            <div class="flex shrink-0 items-center justify-center gap-x-2">
               <Icon icon="mingcute:windows-fill" class="size-6" :class="windowsSetupUrl ? 'text-white' : 'text-white/50'" />
               <Icon icon="mingcute:apple-fill" class="size-6" :class="macosSetupUrl ? 'text-white' : 'text-white/50'" />
               <Icon icon="mingcute:linux-fill" class="size-6" :class="linuxSetupUrl ? 'text-white' : 'text-white/50'" />
            </div>
            <Popover class="relative" v-slot="{ open }">
               <PopoverButton
                  class="ml-auto flex w-fit cursor-pointer items-center justify-center gap-x-2 rounded-md border border-success/50 bg-background/100 px-4 py-2 text-white outline-none transition-all hover:border-success hover:bg-background/50"
               >
                  <Icon icon="mingcute:download-3-fill" class="size-5" />
                  <span>Download</span>
                  <Icon icon="mingcute:down-fill" class="size-5 transition-all" :class="open ? '-scale-100' : ''" />
               </PopoverButton>
               <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="translate-y-1 opacity-0"
                  enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="translate-y-0 opacity-100"
                  leave-to-class="translate-y-1 opacity-0"
               >
                  <PopoverPanel class="absolute left-0 right-0 top-12 z-10 flex flex-col gap-y-1 rounded-lg bg-tertiary p-2 shadow-md">
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
