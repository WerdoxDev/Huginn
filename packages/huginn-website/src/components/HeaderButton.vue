<script setup lang="ts">

const buttonProps = defineProps<{
    link: string,
    text: string,
}>()

</script>

<template>
    <a :href="buttonProps.link" class="font-bold transition-all hover:text-[#D99A6C]">{{ buttonProps.text }}</a>
</template>