import fs from 'fs-extra';

function copyFilesModule(inlineOptions, nuxt) {
  // You can do whatever you like here..
  // console.log(inlineOptions); // `123`
  // console.log(nuxt); // `true` or `false`
  // nuxt.hook('ready', async (nuxt) => {
  //   console.log('Nuxt is ready');
  // });

  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    console.log('nitro', nitro.options.output.serverDir);

    const srcDir = `./data/parsed/`;
    const destDir = `${nitro.options.output.serverDir}/data/parsed/`;

    // To copy a folder or file, select overwrite accordingly
    try {
      fs.copySync(srcDir, destDir, { overwrite: true });
      console.log('success!');
    } catch (err) {
      console.error(err);
    }
  });
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    noVueServer: false
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
  modules: ['@formkit/nuxt', 'nuxt-headlessui', 'nuxt-vitest', copyFilesModule],
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
