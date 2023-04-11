<template>
  <HeadlessCombobox v-model="selectedOption" as="div" by="value" :nullable="true">
    <div class="relative">
      <HeadlessComboboxInput
        class="w-full rounded-md border border-normal-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm formkit-disabled:bg-normal-200 formkit-disabled:text-normal-500"
        :display-value="(option: any) => option?.label "
        :placeholder="props.context.attrs.placeholder"
        @change="query = $event.target.value"
      />
      <HeadlessComboboxButton
        class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
      >
      </HeadlessComboboxButton>

      <HeadlessComboboxOptions
        v-if="filteredOptions.length > 0"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
      >
        <HeadlessComboboxOption
          v-for="option in filteredOptions"
          :key="option.value"
          v-slot="{ active, selected }"
          :value="option"
          as="template"
        >
          <li
            :class="[
              'relative cursor-default select-none py-2 pl-3 pr-9',
              active ? 'bg-primary-600 text-white' : 'text-normal-900'
            ]"
          >
            <span :class="['block truncate', selected && 'font-semibold']">
              {{ option.label }}
            </span>

            <span
              v-if="selected"
              :class="[
                'absolute inset-y-0 right-0 flex items-center pr-4',
                active ? 'text-white' : 'text-primary-600'
              ]"
            >
            </span>
          </li>
        </HeadlessComboboxOption>
      </HeadlessComboboxOptions>
    </div>
  </HeadlessCombobox>
</template>

<script setup lang="ts">
import { FormKitFrameworkContext } from '@formkit/core';

type Option = {
  label: string;
  value: any;
};

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true
  }
});

const options = props.context.options ?? [];

const selectedOption = ref<Option | undefined>(
  options.find((option) => option.value === props.context._value)
);

watch(selectedOption, (value) => {
  props.context.node.input(value?.value);
});

const query = ref('');
const filteredOptions = computed(() => {
  if (query.value.length < Number(props.context.filterMinLength ?? 0)) return [];

  return query.value === ''
    ? options
    : options.filter((item) => {
        return item.label.toLowerCase().includes(query.value.toLowerCase());
      });
});
</script>
