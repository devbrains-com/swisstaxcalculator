// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    noVueServer: true
  },
  nitro: {
    sourceMap: false,
    prerender: {
      routes: ['/']
    }
  },
  typescript: {
    shim: false
  },
  components: {
    dirs: [{ path: '~/components' }]
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  modules: ['@formkit/nuxt', 'nuxt-headlessui', 'nuxt-vitest'],
  build: {
    analyze: true
  },
  app: {
    head: {
      // Font for tailwind ui
      link: [{ rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }],
      htmlAttrs: {
        class: 'bg-normal-50 font-light text-normal-900',
        style: 'margin-left: calc(100vw - 100%);'
      },
      bodyAttrs: {
        class: ''
      }
    }
  }
});
