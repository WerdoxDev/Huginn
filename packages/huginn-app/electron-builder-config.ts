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
         url: process.env.DEV_UPDATE_PUBLISHER_URL || "https://midgard.huginn.dev/api/update/${os}",
         useMultipleRangeRequest: false,
      },
   },

   npmRebuild: false,
   artifactName: "${productName}_${version}_${arch}-setup.${ext}",
   files: [
      "dist/**/*",
      "!dist/electron",
      "!node_modules",
      "node_modules/application-loopback/**/*",
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
