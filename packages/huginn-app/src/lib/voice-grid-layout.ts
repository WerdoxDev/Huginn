const aspectRatio = 16 / 9;
const minTileHeight = 144;
const minTileWidth = minTileHeight * aspectRatio;

export function getVoiceGridLayout(count: number, width: number, height: number, gap = 12) {
   if (count <= 0 || width <= 0 || height <= 0) {
      return { elementWidth: 0, elementHeight: 0 };
   }

   let best = { elementWidth: 0, elementHeight: 0 };

   for (let rows = 1; rows <= count; rows++) {
      const cols = Math.ceil(count / rows);
      const tileWidth = Math.floor(Math.min((width - (cols - 1) * gap) / cols, ((height - (rows - 1) * gap) / rows) * aspectRatio));
      const tileHeight = Math.floor(tileWidth / aspectRatio);

      if (tileWidth >= minTileWidth && tileHeight >= minTileHeight && tileWidth > best.elementWidth) {
         best = { elementWidth: tileWidth, elementHeight: tileHeight };
      }
   }

   if (best.elementWidth > 0) {
      return best;
   }

   // Keep crowded calls readable and let the participant viewport scroll.
   const cols = Math.max(1, Math.floor((width + gap) / (minTileWidth + gap)));
   const tileWidth = Math.floor((width - (cols - 1) * gap) / cols);
   const tileHeight = Math.max(minTileHeight, Math.min(Math.floor(height), Math.floor(tileWidth / aspectRatio)));
   return { elementWidth: Math.min(tileWidth, Math.floor(tileHeight * aspectRatio)), elementHeight: tileHeight };
}
