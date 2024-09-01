<script setup lang="ts">
<<<<<<< HEAD
import { router } from '../main';

=======
>>>>>>> master

const buttonProps = defineProps<{
    link: string,
    text: string,
}>()

</script>

<template>
<<<<<<< HEAD
    <RouterLink :to="buttonProps.link" class="font-bold transition-all hover:text-[#D99A6C]"
        :class="{ 'text-[#D99A6C] underline underline-offset-4': router.currentRoute.value.path === buttonProps.link }">
        {{ buttonProps.text }}
    </RouterLink>
=======
    <a :href="buttonProps.link" class="font-bold transition-all hover:text-[#D99A6C]">{{ buttonProps.text }}</a>
>>>>>>> master
</template>