/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './inputs/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './formkit.config.{js,ts}',
    './app.vue',
    './node_modules/@formkit/addons/**/*.*'
  ],
  theme: {
    data: {
      sm: 'width="sm"',
      md: 'width="md"',
      lg: 'width="lg"'
    },
    screens: {
      xs: '475px',
      ...defaultTheme.screens
    },
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Arial'],
        numeric: ['Inter var, sans-serif', { fontFeatureSettings: '"calt", "ss01", "frac"' }],
        numerictab: [
          'Inter var, sans-serif',
          { fontFeatureSettings: '"tnum", "calt", "ss01", "frac"' }
        ]
      },
      fontWeight: {},
      colors: {
        offWhite: '#f8f8f8',
        primary: colors.sky,
        accent: colors.teal,
        normal: colors.gray,
        danger: colors.red,
        warn: colors.yellow,
        positive: colors.green,
        chestnut: {
          50: '#fbfaf7',
          100: '#f8f0d9',
          200: '#efdcb0',
          300: '#d8b67c',
          400: '#bc8b4d',
          500: '#9e6a2d',
          600: '#81501d',
          700: '#623c18',
          800: '#422913',
          900: '#2a190d'
        },
        test: {
          50: '#f9f9f7',
          100: '#f1eeee',
          200: '#e1d9dc',
          300: '#c2b6b8',
          400: '#9e8e90',
          500: '#826d6e',
          600: '#6a5253',
          700: '#523e40',
          800: '#392b2d',
          900: '#241c1d'
        }
      },
      width: {
        'screen-xs': '475px',
        'screen-sm': defaultTheme.screens.sm,
        'screen-md': defaultTheme.screens.md,
        'screen-lg': defaultTheme.screens.lg,
        'screen-xl': defaultTheme.screens.xl
      },
      boxShadow: {
        'inner-both-lg':
          'inset 0 3px 2px 0 rgb(0 0 0 / 0.05), inset 0 -3px 2px 0 rgb(0 0 0 / 0.05)',
        'two-sm': '0 3px 6px 0 rgb(0 0 0 / 0.15), 0 2px 4px 0 rgb(0 0 0 / 0.12)',
        'two-md': '0 10px 20px 0 rgb(0 0 0 / 0.15), 0 3px 6px 0 rgb(0 0 0 / 0.10)'
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
        '4xs': '0.4rem',
        '5xs': '0.32rem',
        '6xs': '0.265rem',
        '7xs': '0.12rem'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@formkit/themes/tailwindcss')]
};
