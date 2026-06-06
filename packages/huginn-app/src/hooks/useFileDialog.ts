import { useCallback } from "react";

interface FileDialogResult {
   dataUrl: string;
   mimeType: string;
}

const accepts = {
   image: "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,image/svg+xml",
} as const;

export function useFileDialog(accept: keyof typeof accepts) {
   const openFileDialog = useCallback(async (): Promise<FileDialogResult | null> => {
      return new Promise((resolve) => {
         const input = document.createElement("input");
         input.type = "file";
         console.log(accepts[accept]);
         input.accept = accepts[accept];

         input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
               resolve(null);
               return;
            }

            resolve({
               dataUrl: URL.createObjectURL(file),
               mimeType: file.type,
            });
         };

         input.click();
      });
   }, [accept]);

   return { openFileDialog };
}
