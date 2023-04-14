// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    noVueServer: false // Is set to true in the copyDataModule
  },
  security: {
    corsHandler: {
      origin: (origin: string) => {
        const origins = [
          /https:\/\/[\w-]*.pensly.ch/,
          /https:\/\/pensly.vercel.app/,
          /http:\/\/localhost:\d+/,
          /https:\/\/[\w-]*devbrains-com.vercel.app/
        ];

        return origins.some((_origin) => {
          console.log('origin', _origin);
          if (_origin instanceof RegExp) {
            console.log('is regex match', _origin.test(origin));
            return _origin.test(origin);
          }

          return origin === _origin;
        });
      }
    }
  },
  devServer: {
    port: 3001
  },
  nitro: {
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
  modules: ['@formkit/nuxt', 'nuxt-headlessui', 'nuxt-vitest', 'nuxt-security'],
  build: {
    analyze: true
  },
  app: {
    head: {
      // Font for tailwind ui
      link: [
        { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', crossorigin: 'anonymous' }
      ],
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
