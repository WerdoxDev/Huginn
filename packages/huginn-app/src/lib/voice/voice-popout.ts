import { EventEmitter } from "@huginnjs/shared";

import type { MediaSource } from "@/types";

import { router } from "@/router";

import { addHostId, addVoiceMediaTarget } from "../child-window";

type Events = {
   popout_opened: undefined;
   popout_closed: undefined;
   media_popout_opened: { mediaSource: MediaSource };
   media_popout_closed: { mediaSource: MediaSource };
};

export class VoicePopout extends EventEmitter<Events> {
   public popoutWindow: Window | null = null;
   public mediaWindows = new Map<string, Window>();

   public constructor(private readonly hostId: string) {
      super();
   }

   public openVoicePopout() {
      if (this.popoutWindow && !this.popoutWindow.closed) {
         this.popoutWindow.focus();
         return;
      }

      const location = router.buildLocation({ to: "/popout" });
      const href = router.history.createHref(location.href);

      this.popoutWindow = window.open(
         addHostId(href, this.hostId),
         `voice-popout-${this.hostId}`,
         "width=1024,height=720,popup=yes,scrollbars=no,resizable=yes",
      );

      this.emit("popout_opened", undefined);

      if (!this.popoutWindow) return;

      const interval = setInterval(() => {
         if (!this.popoutWindow || this.popoutWindow.closed) {
            clearInterval(interval);
            this.popoutWindow = null;
            this.emit("popout_closed", undefined);
         }
      }, 1000);
   }

   public openMediaPopout(mediaSource: MediaSource): void {
      const producerId = mediaSource.producerId;
      if (!producerId || (mediaSource.kind !== "stream_video" && mediaSource.kind !== "stream_audio" && mediaSource.kind !== "camera")) return;

      const existingWindow = this.mediaWindows.get(producerId);
      if (existingWindow && !existingWindow.closed) {
         this.focusMediaPopout(producerId);
         return;
      }

      const location = router.buildLocation({ to: "/media-popout" });
      const href = router.history.createHref(location.href);
      const hostUrl = addHostId(href, this.hostId);
      const mediaUrl = addVoiceMediaTarget(hostUrl, { userId: mediaSource.userId, producerId });
      const mediaWindow = window.open(
         mediaUrl,
         `voice-media-${this.hostId}-${producerId}`,
         "width=960,height=540,popup=yes,scrollbars=no,resizable=yes",
      );

      if (mediaWindow) this.mediaWindows.set(producerId, mediaWindow);
      this.emit("media_popout_opened", { mediaSource });

      const interval = setInterval(() => {
         if (!mediaWindow || mediaWindow.closed) {
            clearInterval(interval);
            this.mediaWindows.delete(producerId);
            this.emit("media_popout_closed", { mediaSource });
         }
      }, 1000);
   }

   public focusMediaPopout(producerId: string): void {
      const mediaWindow = this.mediaWindows.get(producerId);
      if (!mediaWindow || mediaWindow.closed) return;

      if (window.electronAPI) {
         window.electronAPI.focusMediaPopout(producerId);
         return;
      }

      mediaWindow.focus();
   }
}
