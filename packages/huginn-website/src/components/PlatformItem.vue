<script setup lang="ts">
import { Icon } from "@iconify/vue/dist/iconify.js";
defineProps<{ url?: string, icon: string, text: string }>();
</script>

<template>
   <a :href="url" class="flex gap-x-2 p-2 rounded-md hover:bg-secondary"
      :class="url ? 'cursor-pointer' : 'cursor-not-allowed'">
      <Icon :icon="icon" class="size-6" :class="url ? 'text-white' : 'text-white/50'" />
      <span :class="url ? 'text-white' : 'text-white/50'">{{ text }}</span>
   </a>
</template>
