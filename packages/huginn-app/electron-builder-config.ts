import type { Configuration } from "electron-builder";

export default {
   productName: "Huginn",
   appId: "dev.huginn.desktop",
   electronLanguages: ["en-US"],
   compression: "maximum",
   win: {
      target: { target: "nsis", arch: ["x64"] },
      icon: "electron-assets/icon.ico",
      publish: {
         provider: "generic",
         url: "https://midgard.huginn.dev/api/update/${os}",
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
      "node_modules/sharp/**/*",
      "node_modules/@img/**/*",
      "node_modules/native-addon/**/*",
      ".electron/**/*",
   ],
   directories: {
      output: "dist/electron",
   },
   icon: "electron-assets/icon.ico",
   extraResources: ["electron-assets"],
} as Configuration;
