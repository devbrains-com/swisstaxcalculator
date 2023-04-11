<template>
  <HeadlessRadioGroup
    :default-value="props.context._value"
    @update:model-value="
      async (value) => {
        await props.context.node.input(value, true);
        clickHandler();
      }
    "
  >
    <div :class="divClasses">
      <HeadlessRadioGroupOption
        v-for="child in props.context.options"
        :key="child.value"
        v-slot="{ checked, active }"
        as="template"
        :value="child.value"
      >
        <div :class="classes(checked, active)">
          <HeadlessRadioGroupLabel as="span" :class="labelClass ?? 'whitespace-nowrap'">{{
            child.label
          }}</HeadlessRadioGroupLabel>
          <span
            v-if="borderStyle"
            :class="[
              active ? 'border' : 'border-2',
              checked ? 'border-primary-500' : 'border-transparent',
              'pointer-events-none absolute -inset-px rounded-md'
            ]"
            aria-hidden="true"
          />
        </div>
      </HeadlessRadioGroupOption>
    </div>
  </HeadlessRadioGroup>
</template>

<script setup lang="ts">
import { FormKitFrameworkContext } from '@formkit/core';

const props = defineProps({
  context: {
    type: Object as PropType<FormKitFrameworkContext>,
    required: true
  }
});

const borderStyle = props.context.attrs['selected-style'] === 'border';

const orientation = props.context.attrs.orientation ?? 'grid';

const labelClass = props.context.attrs['option-label-classes'] ?? undefined;

let divClasses = 'grid grid-cols-4 gap-3 sm:grid-cols-6';

switch (orientation) {
  case 'col':
    divClasses = 'flex flex-col gap-3';
    break;
  case 'row':
    divClasses = 'flex flex-wrap gap-3';
    break;
}

const commonClasses =
  'cursor-pointer focus:outline-none border rounded-md flex items-center justify-center py-3 px-2 text-sm formkit-disabled:bg-normal-200 formkit-disabled:text-normal-500 flex-1';

let classes = (checked: boolean, active: boolean) => [
  commonClasses,
  active ? 'ring-2 ring-offset-2 ring-primary-500' : '',
  checked
    ? 'bg-primary-100 border-primary-500 text-primary-800'
    : 'bg-white border-normal-300 hover:bg-normal-50'
];

const stepOnClick = props.context.attrs['step-next'] === true;
const clickHandler = stepOnClick
  ? () => {
      setTimeout(() => {
        // @ts-ignore
        props.context.node.parent?.context?.handlers.incrementStep(
          1,
          props.context.node.parent.context
        )();
      }, 0);
    }
  : () => {};

if (borderStyle) {
  classes = (checked: boolean, active: boolean) => [
    commonClasses,
    checked ? 'border-transparent' : 'border-normal-300',
    active ? 'border-primary-500 ring-2 ring-primary-500' : '',
    'relative bg-white border rounded-md focus:outline-none'
  ];
}
</script>
