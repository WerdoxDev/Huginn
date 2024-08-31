<script setup lang="ts">

const buttonProps = defineProps<{
    link: string,
    text: string,
}>()

</script>

<template>
    <a :href="buttonProps.link" class="font-bold transition-all hover:text-[#00A7E3]">{{ buttonProps.text }}</a>
</template>