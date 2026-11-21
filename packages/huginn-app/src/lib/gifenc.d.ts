declare module "gifenc" {
   export function quantize(rgba: Uint8Array, maxColors: number): number[][];
   export function applyPalette(rgba: Uint8Array, palette: number[][]): Uint8Array;
   export function GIFEncoder(options: { auto: boolean }): {
      writeHeader(): void;
      writeFrame(
         pixels: Uint8Array,
         width: number,
         height: number,
         options: {
            first: boolean;
            palette: number[][];
            transparent: boolean;
            transparentIndex: number;
            dispose: number;
            delay: number;
            repeat: number;
         },
      ): void;
      finish(): void;
      bytes(): Uint8Array<ArrayBuffer>;
   };
}
