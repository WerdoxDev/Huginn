<script setup lang="ts">
import { router } from '../main';


const buttonProps = defineProps<{
    link: string,
    text: string,
}>()

</script>

<template>
    <RouterLink :to="buttonProps.link" class="font-bold transition-all hover:text-[#D99A6C]"
        :class="{ 'text-[#D99A6C] underline underline-offset-4': router.currentRoute.value.path === buttonProps.link }">
        {{ buttonProps.text }}
    </RouterLink>
</template>