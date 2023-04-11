import { de, en } from '@formkit/i18n';
import { generateClasses } from '@formkit/themes';
import { DefaultConfigOptions } from '@formkit/vue';
import { button } from '~/inputs/button';
import number from '~/inputs/number';
import { numberSuffix } from '~/inputs/numberSuffix';
import { textSuffix } from '~/inputs/textSuffix';
import { autocomplete } from './inputs/autocomplete';
import { buttonSelect } from './inputs/buttonSelect';
import { asNumberPlugin } from './inputs/plugins';

const config: DefaultConfigOptions = {
  locales: { de, en },
  props: {
    incompleteMessage: false,
    validationVisibility: 'submit'
  },
  inputs: {
    button,
    buttonSelect,
    autocomplete,
    number,
    numberSuffix,
    textSuffix
  },
  plugins: [asNumberPlugin],
  config: {
    classes: generateClasses({
      global: {
        fieldset: 'max-w-md border border-normal-400 rounded px-2 pb-1',
        help: 'mt-2 text-sm text-normal-500',
        inner: 'formkit-disabled:cursor-not-allowed formkit-disabled:pointer-events-none',
        input: 'formkit-disabled:bg-normal-200 formkit-disabled:text-normal-500',
        label: 'text-sm text-normal-600',
        legend: 'font-bold text-sm',
        loaderIcon: 'inline-flex items-center w-4 text-normal-600 animate-spin',
        message: 'text-danger-500 mb-1 text-xs',
        messages: 'list-none p-0 mt-1 mb-0',
        outer: '',
        prefixIcon:
          'w-10 flex self-stretch grow-0 shrink-0 rounded-tl rounded-bl border-r border-normal-400 bg-white bg-gradient-to-b from-transparent to-normal-200 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto',
        suffixIcon:
          'w-7 pr-3 flex self-stretch grow-0 shrink-0 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto'
      },
      'family:button': {
        input: 'formkit-button-style'
      },
      'family:text': {
        inner:
          'w-full flex items-center bg-white border border-normal-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 formkit-disabled:bg-normal-200',
        input: 'formkit-input-style',
        suffix: 'mr-3 text-normal-500 text-xs sm:text-sm'
      },
      range: {
        label: 'mb-2',
        inner: '$reset flex items-center',
        input:
          '$reset flex-grow h-2 bg-normal-200 accent-primary-600 rounded-lg appearance-none cursor-pointer outline-none'
      },
      select: {
        inner:
          'w-full border border-normal-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
        input:
          'block w-full px-3 border-none sm:text-sm placeholder-normal-400 data-[placeholder="true"]:text-normal-400'
      },
      checkbox: {
        wrapper: 'flex items-center gap-2',
        input: 'rounded border-normal-300 text-primary-600 focus:ring-primary-500'
      },
      'family:toggle': {
        inner: 'relative cursor-pointer',
        input: 'sr-only peer',
        toggle:
          "w-11 h-6 bg-normal-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-normal-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-normal-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-normal-600 peer-checked:bg-primary-600"
      },
      scrollSelect: {
        inner: 'w-full border border-normal-300 bg-white rounded-md',
        input: ' sm:text-sm'
      }
    })
  }
};

export default config;
