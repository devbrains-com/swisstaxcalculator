/* eslint-disable no-console */
import { defineNuxtModule } from '@nuxt/kit';
import { copy } from 'fs-extra';
import { dataParsedBasePath, dataParsedRelativePath } from '../lib/taxes/constants';

export default defineNuxtModule({
  setup(_options, nuxt) {
    if (nuxt.options.dev) return;

    // Set this option to true, to disable the vue server which saves some server package size
    // The page itsself is prerenderer and served as static page by nitro
    nuxt.options.experimental.noVueServer = true;

    nuxt.hook('nitro:build:public-assets', async (nitro) => {
      console.log(`Nitro preset is ${nitro.options.preset}`);
      const isVercel = nitro.options.preset.includes('vercel');
      const srcDir = dataParsedBasePath;
      const destDir = `${
        isVercel ? nitro.options.output.serverDir : nitro.options.output.dir
      }/${dataParsedRelativePath}`;

      // To copy a folder or file, select overwrite accordingly
      try {
        await copy(srcDir, destDir, { overwrite: true });
        console.log(`Successfully copied data from ${srcDir} to ${destDir}`);
      } catch (err) {
        console.error(err);
      }
    });
  }
});
