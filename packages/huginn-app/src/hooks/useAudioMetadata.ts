import { toDataUrl } from "@huginnjs/shared";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { useEffect, useState, type RefObject } from "react";

export function useAudioCoverImage(ref: RefObject<HTMLAudioElement | null>) {
   const [coverImage, setCoverImage] = useState<string | null>(null);
   useEffect(() => {

      async function getMetadata() {
         const url = ref.current?.src;
         if (!url) return;
         const input = new Input({ source: new UrlSource(url), formats: ALL_FORMATS });
         const tags = await input.getMetadataTags();
         const coverImage = tags.images?.find(x => x.kind === "coverFront");
         if (!coverImage) return;
         setCoverImage(toDataUrl(coverImage?.data, "image/jpeg"));
      }

      void getMetadata();

   }, [])

   return coverImage;
}
