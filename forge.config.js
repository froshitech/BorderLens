const path = require('path');
const fs = require('fs-extra');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    icon: './assets/icon.ico',
    asar: {
      unpack: '**/node_modules/{sharp,@img}/**/*',
    },
    extraResource: [
      './public',
    ],
  },
  hooks: {
    packageAfterCopy: async (forgeConfig, buildPath) => {
      const modulesToCopy = ['sharp', '@img', 'detect-libc', 'semver'];
      for (const mod of modulesToCopy) {
        const src = path.resolve(__dirname, 'node_modules', mod);
        const dest = path.resolve(buildPath, 'node_modules', mod);
        if (await fs.pathExists(src)) {
          await fs.copy(src, dest, { dereference: true });
        }
      }
    },
    packageAfterPrune: async (forgeConfig, buildPath) => {
      const modulesToCopy = ['sharp', '@img', 'detect-libc', 'semver'];
      for (const mod of modulesToCopy) {
        const src = path.resolve(__dirname, 'node_modules', mod);
        const dest = path.resolve(buildPath, 'node_modules', mod);
        if (await fs.pathExists(src)) {
          await fs.copy(src, dest, { dereference: true });
        }
      }
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'borderlens',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
