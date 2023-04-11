import { createInput } from '@formkit/vue';
import { FormkitAutocomplete } from '#components';

export const autocomplete = createInput(FormkitAutocomplete, {
  props: ['asNumber', 'options', 'filterMinLength']
});
