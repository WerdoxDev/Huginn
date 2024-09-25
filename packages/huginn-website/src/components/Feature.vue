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
            <div v-if="isVisible" class="bg-[#262626] rounded-2xl h-full w-full p-6">

                <div class="space-y-4">
                    <div class="flex flex-row items-center space-x-2">
                        <Icon :icon="featureProps.icon" class="size-8 text-[#D99A6C]" />
                        <div class="text-xl md:text-2xl font-bold">{{ featureProps.header }}</div>
                    </div>

                    <div class="text-lg">{{ featureProps.text }}</div>
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