//https://nitro.unjs.io/config
export default defineNitroConfig({
   srcDir: "src",

   errorHandler: "~/error-handler",
   experimental: {
      websocket: true,
      asyncContext: true,
   },
});
