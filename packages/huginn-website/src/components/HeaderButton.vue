<script setup lang="ts">
import { router } from "../main";

const buttonProps = defineProps<{
    link: string;
    text: string;
}>();
</script>

<template>
    <button @click="(e) => $emit('click', e)" class="text-left">
        <RouterLink :to="buttonProps.link" class="font-bold transition-all hover:text-accent"
            :class="{ 'text-accent underline underline-offset-4': router.currentRoute.value.path === buttonProps.link }">
            {{ buttonProps.text }}
        </RouterLink>
    </button>
</template>
