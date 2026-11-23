export type MediaViewerPreview = HTMLCanvasElement | HTMLImageElement;

export type MediaViewerSource = {
   element: HTMLElement;
   boundsElement: HTMLElement;
   rect: { left: number; top: number; width: number; height: number };
   borderRadius: number;
   frame?: { width: number; color: string };
   preview?: MediaViewerPreview;
   overlays: HTMLElement[];
   foreground?: HTMLElement;
};

export function captureMediaViewerSource(mediaElement: HTMLElement, foreground?: HTMLElement | null): MediaViewerSource {
   const element = mediaElement.closest<HTMLElement>("[data-media-preview-source]") ?? mediaElement;
   const boundsElement = element.querySelector<HTMLElement>("[data-media-preview-bounds]") ?? element;
   const { left, top, width, height } = boundsElement.getBoundingClientRect();
   const radius = getComputedStyle(boundsElement).borderTopLeftRadius;
   // rounded-full uses a huge radius; animate the visible radius instead of that raw value.
   const borderRadius = Math.min(
      Math.min(width, height) / 2,
      radius.endsWith("%") ? (parseFloat(radius) / 100) * Math.min(width, height) : parseFloat(radius) || 0,
   );
   const frame = element.hasAttribute("data-media-preview-frame")
      ? { width: Math.max(0, (element.getBoundingClientRect().width - width) / 2), color: getComputedStyle(element).backgroundColor }
      : undefined;
   const media = element.matches("img, video") ? element : element.querySelector("img, video");
   let preview: MediaViewerPreview | undefined;
   const mediaWidth = media instanceof HTMLVideoElement ? media.videoWidth : media instanceof HTMLImageElement ? media.naturalWidth : 0;
   const mediaHeight = media instanceof HTMLVideoElement ? media.videoHeight : media instanceof HTMLImageElement ? media.naturalHeight : 0;
   if (mediaWidth && mediaHeight && (media instanceof HTMLImageElement || (media instanceof HTMLVideoElement && media.readyState >= 2))) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * window.devicePixelRatio));
      canvas.height = Math.max(1, Math.round(height * window.devicePixelRatio));
      const context = canvas.getContext("2d");
      if (context) {
         const scale = Math.min(canvas.width / mediaWidth, canvas.height / mediaHeight);
         const drawWidth = mediaWidth * scale;
         const drawHeight = mediaHeight * scale;
         // Display the captured frame directly; cross-origin media need not expose its pixels.
         context.drawImage(media, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
         preview = canvas;
      }
   }
   if (!preview && media instanceof HTMLVideoElement && media.poster) {
      const poster = new Image();
      poster.src = media.poster;
      preview = poster;
   }
   const overlays = Array.from(element.querySelectorAll<HTMLElement>("[data-media-preview-overlay]"), (overlay) => {
      const clone = overlay.cloneNode(true) as HTMLElement;
      // Hover and focus selectors no longer match once the copy is inside the viewer.
      clone.style.opacity = getComputedStyle(overlay).opacity;
      return clone;
   });
   return { element, boundsElement, rect: { left, top, width, height }, borderRadius, frame, preview, overlays, foreground: foreground ?? undefined };
}

/** Preserve the visible avatar frame, ring, and presence indicator without restarting animated images. */
export function cloneMediaViewerForeground(element: HTMLElement): HTMLElement {
   const clone = element.cloneNode(true) as HTMLElement;
   const images = clone.querySelectorAll("img");
   element.querySelectorAll("img").forEach((image, index) => {
      if (!image.complete || !image.naturalWidth) return;
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0);
      canvas.className = images[index].className;
      canvas.style.cssText = images[index].style.cssText;
      images[index].replaceWith(canvas);
   });
   clone.inert = true;
   clone.setAttribute("aria-hidden", "true");
   return clone;
}
