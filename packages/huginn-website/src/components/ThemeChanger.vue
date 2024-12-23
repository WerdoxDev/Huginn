<script setup lang="ts">
import { Icon } from '@iconify/vue/dist/iconify.js';
import { ref } from 'vue';
import { ceruleanTheme, charcoalTheme, coffeeTheme, ColorTheme, currentTheme, eggplantTheme, pineGreenTheme, useChangeTheme } from '../scripts/useChangeTheme';

const isOpen = ref(false)

function toggleMenu() {
    isOpen.value = !isOpen.value
    console.log(isOpen.value)
}

function chooseTheme(theme: ColorTheme) {
    useChangeTheme(theme.type)
    toggleMenu()
}

</script>

<template>
    <div class="w-fit">
        <button @click="toggleMenu" class="rounded-full z-30 p-2 bg-tertiary shadow-4xl ">
            <Icon icon="material-symbols:brush" class="size-7 text-accent" />
        </button>

        <Transition name="menu">
            <div v-if="isOpen"
                class="absolute p-3 gap-x-2 grid grid-cols-2 h-36 w-24 bg-tertiary outline outline-1 outline-primary shadow-2xl rounded-lg right-14 bottom-0">

                <button @click="chooseTheme(coffeeTheme)"
                    class="rounded-full flex items-center justify-center bg-black/30 size-8 shrink-0">
                    <div class="rounded-full size-6 bg-[#D99A6C]"></div>
                </button>

                <button @click="chooseTheme(ceruleanTheme)"
                    class="rounded-full flex items-center justify-center bg-black/30 size-8 shrink-0">
                    <div class="rounded-full size-6 bg-[#00A7E3]"></div>
                </button>

                <button @click="chooseTheme(pineGreenTheme)"
                    class="rounded-full flex items-center justify-center bg-black/30 size-8 shrink-0">
                    <div class="rounded-full size-6 bg-[#02CAB9]"></div>
                </button>

                <button @click="chooseTheme(eggplantTheme)"
                    class="rounded-full flex items-center justify-center bg-black/30 size-8 shrink-0">
                    <div class="rounded-full size-6 bg-[#DC8B9A]"></div>
                </button>

                <button @click="chooseTheme(charcoalTheme)"
                    class="rounded-full flex items-center justify-center bg-black/30 size-8 shrink-0">
                    <div class="rounded-full size-6 bg-[#9FB1BD]"></div>
                </button>
            </div>
        </Transition>
    </div>

</template>

<style>
.menu-enter-from,
.menu-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

.menu-enter-active,
.menu-leave-active {
    transition-property: all;
    transition-duration: 250ms;
    transition-timing-function: ease;
}
</style>