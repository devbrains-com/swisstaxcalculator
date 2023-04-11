import { createInput } from '@formkit/vue';
import { FormkitButtonSelect } from '#components';

export const buttonSelect = createInput(FormkitButtonSelect, {
  props: ['asNumber', 'options']
});
