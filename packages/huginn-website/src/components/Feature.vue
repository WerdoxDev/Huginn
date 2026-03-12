<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
import { vElementVisibility } from "@vueuse/components";
import { ref } from "vue";

const isVisible = ref(false);

const featureProps = defineProps<{
   header: string;
   text: string;
   icon: string;
}>();

function onElementVisible(state: boolean) {
   if (!state) return;

   isVisible.value = true;
}
</script>

<template>
   <div v-element-visibility="onElementVisible" class="w-full md:h-64 md:w-[38rem]">
      <Transition name="fade">
         <div
            v-if="isVisible"
            class="group h-full w-full rounded-2xl border-2 border-b-4 border-text/20 border-b-primary bg-secondary p-6 shadow-md transition-all hover:-translate-y-2 hover:scale-105 hover:border-text/50 hover:border-b-accent hover:bg-tertiary/70 hover:shadow-xl"
         >
            <div class="">
               <div class="flex flex-row items-center space-x-5 rounded-2xl">
                  <div class="rounded-xl bg-accent/10 p-3 transition-all group-hover:bg-accent/20">
                     <Icon :icon="featureProps.icon" class="size-10 text-accent" />
                  </div>
                  <div class="text-xl font-bold text-accent md:text-2xl">
                     {{ featureProps.header }}
                  </div>
               </div>

               <div class="mt-6 text-lg">{{ featureProps.text }}</div>
            </div>
         </div>
      </Transition>
   </div>
</template>
