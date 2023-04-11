<template>
  <button
    v-bind="attrs"
    :class="classes.button"
    :disabled="isLoading || loading || !!attrs.disabled"
  >
    <div class="flex items-center gap-2">
      <slot></slot>
    </div>
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const props = defineProps({
  variant: { type: String as PropType<ButtonVariant>, default: 'primary' },
  size: { type: String as PropType<ButtonSize>, default: 'md' },
  loading: { type: Boolean, default: false }
});

const attrsSource = useAttrs();

const isLoading = ref(false);
const clickWithLoading = async (e: MouseEvent) => {
  isLoading.value = true;

  if (attrsSource?.onClick) {
    // @ts-ignore
    await attrsSource.onClick(e);
  }
  isLoading.value = false;
};

const attrs: Record<string, unknown> = { ...attrsSource, onClick: clickWithLoading };

const classes = computed(() => {
  let button =
    'inline-flex justify-center items-center border font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-normal-200 disabled:text-normal-500 ';

  switch (props.variant) {
    case 'primary':
      button += 'border-transparent bg-primary-600 text-white shadow-sm hover:bg-primary-700';
      break;
    case 'secondary':
      button += 'border-transparent bg-primary-100 text-primary-700 hover:bg-primary-200';
      break;
    case 'tertiary':
      button += 'border-normal-300 bg-white text-normal-700 shadow-sm hover:bg-normal-50';
      break;
    case 'danger':
      button += 'border-transparent bg-danger-600 text-white shadow-sm hover:bg-danger-700';
      break;
  }

  let icon = '';

  switch (props.size) {
    case 'xs':
      button += ' rounded text-xs px-2.5 py-1.5';
      icon += ' -ml-0.5 mr-2 h-4 w-4';
      break;
    case 'sm':
      button += ' rounded-md text-sm px-3 py-2';
      icon += ' -ml-0.5 mr-2 h-4 w-4';
      break;
    case 'md':
      button += ' rounded-md text-sm px-4 py-2';
      icon += ' -ml-1 mr-2 h-5 w-5';
      break;
    case 'lg':
      button += ' rounded-md text-base px-4 py-2';
      icon += ' -ml-1 mr-3 h-5 w-5';
      break;
    case 'xl':
      button += ' rounded-md text-base px-6 py-3';
      icon += ' -ml-1 mr-3 h-5 w-5';
      break;
  }

  return { button, icon };
});
</script>
<script lang="ts">
export default {
  inheritAttrs: false
};
</script>
