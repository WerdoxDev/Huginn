import type { Configuration } from "electron-builder";

export default {
   productName: "Huginn",
   appId: "dev.huginn.desktop",
   electronLanguages: ["en-US"],
   compression: "store",
   win: {
      target: { target: "nsis", arch: ["x64"] },
      icon: "assets/icon.ico",
   },
   artifactName: "${productName}_${version}_${arch}-setup.${ext}",
   files: ["dist/**/*", "!dist/electron", "!node_modules/**/*", ".electron/**/*"],
   directories: {
      output: "dist/electron",
   },
   icon: "assets/icon.ico",
   extraResources: ["assets", { from: "../../node_modules/application-loopback/bin", to: "bin" }],
   asarUnpack: ["bin"]
} as Configuration;
