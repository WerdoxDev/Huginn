import { screen, desktopCapturer } from "electron";
import native from "native-addon";

import { isLinux } from "./utils";

type DisplayInfo = {
   bounds: { x: number; y: number; width: number; height: number };
   id: number;
   name: string;
   scaleFactor: number;
};

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
      if (isLinux) return;

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

   public async getAllDisplays(): Promise<DisplayInfo[]> {
      if (isLinux) {
         const displays = await native.getAllDisplaysLINUX();
         return displays.map((x) => ({
            bounds: { x: x.x, y: x.y, width: x.width, height: x.height },
            id: x.id,
            name: x.name,
            scaleFactor: x.scaleFactor,
         }));
      }

      return screen.getAllDisplays().map((x) => ({
         bounds: x.bounds,
         id: x.id,
         name: x.label,
         scaleFactor: x.scaleFactor,
      }));
   }
}
