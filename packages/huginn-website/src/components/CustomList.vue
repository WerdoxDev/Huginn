<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const optionsProps = defineProps<{
   options: { text: string; icon: string; disabled: boolean; hidden: boolean }[];
   default: string;
}>();

defineOptions({
   inheritAttrs: false,
});

const selectedOption = ref(optionsProps.options.find(x => x.text.trim().toLowerCase() === optionsProps.default)!);
</script>

<template>
   <Listbox v-model="selectedOption">
      <div class="relative mx-2 select-none">
         <ListboxButton class="flex items-center rounded-md bg-[#262626] px-2 py-1" :class="$attrs.class">
            <Icon :icon="selectedOption.icon" class="mr-1" />
            {{ selectedOption.text }}
            <Icon icon="gridicons:dropdown" class="ml-auto" />
         </ListboxButton>

         <ListboxOptions class="ui-open:bg-[#262626] ui-open:rounded-md ui-open:shadow-lg absolute mt-1 w-full overflow-hidden">
            <ListboxOption
               v-for="option in optionsProps.options"
               :key="option.text"
               :value="option"
               :disabled="option.disabled"
               @click="!option.disabled && $emit('changed', option.text.trim().toLowerCase())"
               class="ui-disabled:cursor-not-allowed ui-disabled:text-[#EBEBD3]/50 hover:ui-disabled:bg-black/30 flex cursor-pointer items-center px-2 py-1 pr-9 hover:bg-black/50"
               :class="{ hidden: option.hidden }"
            >
               <Icon :icon="option.icon" class="mr-1" />
               {{ option.text }}
            </ListboxOption>
         </ListboxOptions>
      </div>
   </Listbox>
</template>
