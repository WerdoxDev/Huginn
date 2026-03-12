<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import { ref } from "vue";

import { type ColorTheme, ceruleanTheme, charcoalTheme, coffeeTheme, eggplantTheme, pineGreenTheme, useChangeTheme } from "../scripts/useChangeTheme";

const isOpen = ref(false);

function toggleMenu() {
   isOpen.value = !isOpen.value;
   console.log(isOpen.value);
}

function chooseTheme(theme: ColorTheme) {
   useChangeTheme(theme.type);
   toggleMenu();
}
</script>

<template>
   <div class="w-fit">
      <button @click="toggleMenu" class="shadow-4xl z-30 rounded-full bg-tertiary p-4 shadow-md transition-all hover:shadow-lg">
         <Icon icon="material-symbols:brush" class="size-7 text-accent" />
      </button>

      <Transition name="menu">
         <div
            v-if="isOpen"
            class="absolute bottom-0 right-20 grid h-44 w-28 grid-cols-2 gap-x-2 rounded-lg bg-tertiary p-3 shadow-2xl outline outline-1 outline-primary md:h-36 md:w-24"
         >
            <button @click="chooseTheme(coffeeTheme)" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8">
               <div class="size-8 rounded-full bg-[#D99A6C] md:size-6"></div>
            </button>

            <button @click="chooseTheme(ceruleanTheme)" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8">
               <div class="size-8 rounded-full bg-[#00A7E3] md:size-6"></div>
            </button>

            <button @click="chooseTheme(pineGreenTheme)" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8">
               <div class="size-8 rounded-full bg-[#02CAB9] md:size-6"></div>
            </button>

            <button @click="chooseTheme(eggplantTheme)" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8">
               <div class="size-8 rounded-full bg-[#DC8B9A] md:size-6"></div>
            </button>

            <button @click="chooseTheme(charcoalTheme)" class="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8">
               <div class="size-8 rounded-full bg-[#9FB1BD] md:size-6"></div>
            </button>
         </div>
      </Transition>
   </div>
</template>

<style>
.menu-enter-from,
.menu-leave-to {
   opacity: 0;
   transform: scale(0.9);
}

.menu-enter-active,
.menu-leave-active {
   transition-property: all;
   transition-duration: 250ms;
   transition-timing-function: ease;
}
</style>
