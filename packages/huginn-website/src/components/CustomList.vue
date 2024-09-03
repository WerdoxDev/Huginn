<script setup lang="ts">
import { ref, watch } from 'vue'
import {
    Listbox,
    ListboxButton,
    ListboxOptions,
    ListboxOption,
} from '@headlessui/vue'
import { Icon } from '@iconify/vue/dist/iconify.js';

const optionsProp = defineProps<{
    options: { id: number, text: string, icon: string, disabled: boolean }[]
}>()
defineOptions({
    inheritAttrs: false
})

const selectedOption = ref(optionsProp.options[0])

watch(selectedOption, () => { console.log(selectedOption.value) })

</script>

<template>
    <Listbox v-model="selectedOption">

        <div class="relative mx-2 select-none">

            <ListboxButton class="flex items-center py-1 px-2 bg-[#262626] rounded-md" :class="$attrs.class">
                <Icon :icon="selectedOption.icon" class="mr-1" />
                {{ selectedOption.text }}
                <Icon icon="gridicons:dropdown" class="ml-auto" />
            </ListboxButton>

            <ListboxOptions
                class="ui-open:bg-[#262626] ui-open:rounded-md ui-open:shadow-lg absolute w-full mt-1 overflow-hidden">

                <ListboxOption v-for="option in optionsProp.options" :key="option.id" :value="option"
                    :disabled="option.disabled"
                    class="flex items-center py-1 px-2 pr-9 ui-disabled:cursor-not-allowed ui-disabled:text-[#EBEBD3]/50 hover:ui-disabled:bg-black/30 hover:bg-black/50 cursor-pointer">
                    <Icon :icon="option.icon" class="mr-1" />
                    {{ option.text }}
                </ListboxOption>

            </ListboxOptions>

        </div>

    </Listbox>
</template>