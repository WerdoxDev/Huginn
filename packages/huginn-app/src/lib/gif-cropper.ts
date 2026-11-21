import { SuperImageCropper } from "super-image-cropper";

import gifWorkerUrl from "./gif-encoder.worker?worker&url";

export async function cropGif(options: Parameters<SuperImageCropper["crop"]>[0]) {
   // gif.js creates classic workers. Load Vite's worker as a module and queue
   // the first frame until it is ready, including in the Vite dev server.
   const workerModule = new URL(gifWorkerUrl, window.location.href).href;
   const workerScript = URL.createObjectURL(
      new Blob([`const ready = import(${JSON.stringify(workerModule)}); self.onmessage = event => ready.then(() => self.onmessage(event));`], {
         type: "text/javascript",
      }),
   );
   try {
      return await new SuperImageCropper().crop({ ...options, gifJsOptions: { ...options.gifJsOptions, workerScript } });
   } finally {
      URL.revokeObjectURL(workerScript);
   }
}
