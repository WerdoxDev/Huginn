<script setup lang="ts">
import { Icon } from '@iconify/vue/dist/iconify.js';

const featureProps = defineProps<{
    header: string,
    text: string,
    icon: string,
}>()
</script>

<template>
    <div class="bg-[#262626] rounded-2xl w-full md:w-[38rem] md:h-64 p-6">

        <div class="space-y-4">
            <div class="flex flex-row items-center space-x-2">
                <Icon :icon="featureProps.icon" class="size-8 text-[#D99A6C]" />
                <div class="text-xl md:text-2xl font-bold">{{ featureProps.header }}</div>
            </div>

            <div class="text-lg">{{ featureProps.text }}</div>
        </div>
    </div>

</template>