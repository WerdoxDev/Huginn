import type { CSSProperties } from "react";

type RadialMaskCutout = {
   radius: string;
   x: string;
   y: string;
};

export function createRadialMask(cutouts: RadialMaskCutout[]) {
   return cutouts.map(({ radius, x, y }) => `radial-gradient(circle ${radius} at ${x} ${y}, transparent calc(100% - 1px), black 100%)`).join(", ");
}

export function createMaskStyle(maskImage: string, hasMultipleCutouts = false): CSSProperties {
   return {
      maskImage,
      maskComposite: hasMultipleCutouts ? "intersect" : undefined,
      WebkitMaskImage: maskImage,
      WebkitMaskComposite: hasMultipleCutouts ? "source-in" : undefined,
   };
}

export function createRadialMaskStyle(cutouts: RadialMaskCutout[]): CSSProperties {
   return createMaskStyle(createRadialMask(cutouts), cutouts.length > 1);
}
