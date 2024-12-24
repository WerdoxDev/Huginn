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

    <div v-element-visibility="onElementVisible" class="w-full md:w-[38rem] md:h-64">
        <Transition name="fade">
            <div v-if="isVisible"
                class="group bg-secondary rounded-2xl shadow-md h-full w-full p-6 border-2 border-text/20 border-b-4 border-b-primary transition-all hover:bg-tertiary/70 hover:shadow-xl hover:border-text/50 hover:border-b-accent hover:-translate-y-2 hover:scale-105">

                <div class="">
                    <div class="flex flex-row items-center rounded-2xl space-x-5">
                        <div class="group-hover:bg-accent/20 transition-all p-3 bg-accent/10 rounded-xl">
                            <Icon :icon="featureProps.icon" class="size-10 text-accent" />
                        </div>
                        <div class="text-xl md:text-2xl font-bold text-accent">{{ featureProps.header }}</div>
                    </div>

                    <div class="text-lg mt-6">{{ featureProps.text }}</div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style>
.fade-enter-from {
    opacity: 0;
    translate: 0 100px;
}

.fade-enter-active {
    transition-property: all;
    transition-duration: 500ms;
    transition-timing-function: ease;
}

.fade-enter-to {
    opacity: 1;
    translate: 0 0;
}
</style>