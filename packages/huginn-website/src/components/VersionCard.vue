<script setup lang="ts">
import { Icon } from '@iconify/vue/dist/iconify.js';
import { flavourType, platformType } from '../Download.vue';

defineProps<{
    version: string,
    date: string,
    url: string,

    flavour: flavourType,
    platform: platformType,
}>()

</script>

<template>
    <div class="rounded-lg group p-5">
        <div class="flex items-center gap-x-2">
            <div class="bg-accent/30 group-hover:bg-accent/60 transition-all rounded-full p-1">
                <Icon icon="bxs:moon" class="text-text size-7" />
            </div>

            <div class="text-2xl font-semibold">Version {{ version }}</div>
            <div :class="{ 'border-warning text-warning': flavour === 'Nightly', 'border-success text-success': flavour === 'Release' }"
                class="rounded-full text-xs border -py-1 px-2 h-fit w-fit">{{ flavour }}
            </div>
        </div>

        <div class="mt-3">This build was released on {{ date }}</div>
        <a :href="url">
            <div
                class="mt-3 rounded-lg transition-all bg-primary hover:bg-primary/60 py-2 px-4 w-fit ml-auto cursor-pointer">
                Download for {{
                    platform }}</div>
        </a>
    </div>
</template>