import { useCallback } from "react";

interface FileDialogResult {
   dataUrl: string;
   mimeType: string;
}

export function useFileDialog(accept: string = "image/*") {
   const openFileDialog = useCallback(async (): Promise<FileDialogResult | null> => {
      return new Promise((resolve) => {
         const input = document.createElement("input");
         input.type = "file";
         input.accept = accept;

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
