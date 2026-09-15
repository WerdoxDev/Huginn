import type { Configuration } from "electron-builder";

import "dotenv/config";

export default {
   productName: "Huginn",
   appId: "dev.huginn.desktop",
   electronLanguages: ["en-US"],
   compression: "maximum",

   win: {
      target: { target: "nsis", arch: ["x64"] },
      icon: "src/assets/icons/default/outline-thick/outline-thick.ico",
      publish: {
         provider: "generic",
         url: process.env.VITE_PUBLIC_DEV_UPDATE_PUBLISHER_URL || "https://midgard.huginn.dev/api/update/${os}",
         useMultipleRangeRequest: false,
      },
   },

   linux: {
      target: { target: "pacman", arch: ["x64"] },
      icon: "src/assets/icons/default/outline-thick/outline-thick-512.png",
   },

   pacman: {
      artifactName: "${productName}_${version}_${arch}.tar.zst",
      compression: "zstd",
      depends: [
         "gtk3",
         "libnotify",
         "nss",
         "libxss",
         "libxtst",
         "xdg-utils",
         "at-spi2-core",
         "libsecret",
         "wf-recorder",
      ],
   },

   npmRebuild: false,
   artifactName: "${productName}_${version}_${arch}-setup.${ext}",
   files: [
      "dist/**/*",
      "!dist/electron",
      "!node_modules",
      "node_modules/loopback-capture/**/*",
      "node_modules/native-addon/**/*",
      "node_modules/emojibase-data/**/*",
      ".electron/**/*",
   ],
   directories: {
      output: "dist/electron",
   },
   icon: "src/assets/icons/default/outline-thick/outline-thick.ico",
   extraResources: ["electron-assets"],
} as Configuration;
