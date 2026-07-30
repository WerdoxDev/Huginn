import { screen, desktopCapturer } from "electron";

export class ScreenManager {
   private idMap: Map<string, string>;

   public constructor() {
      this.idMap = new Map<string, string>();

      screen.on("display-added", this.refreshScreenSourceMap.bind(this));
      screen.on("display-removed", this.refreshScreenSourceMap.bind(this));
      screen.on("display-metrics-changed", this.refreshScreenSourceMap.bind(this));

      void this.refreshScreenSourceMap();
   }

   private async refreshScreenSourceMap() {
      const sources = await desktopCapturer.getSources({
         types: ["screen"],
         thumbnailSize: { width: 0, height: 0 }, // skips bitmap capture, this is what makes getSources slow
         fetchWindowIcons: false,
      });

      this.idMap.clear();
      for (const source of sources) {
         if (source.display_id) this.idMap.set(source.display_id, source.id);
      }
   }

   public getDisplaySourceId(displayId: number): string | undefined {
      return this.idMap.get(displayId.toString());
   }
}
