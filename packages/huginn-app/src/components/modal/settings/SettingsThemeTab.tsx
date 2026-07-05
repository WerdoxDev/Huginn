import HuginnIcon from "@components/HuginnIcon";
import HuginnLabel from "@components/HuginnLabel";
import { parseOklchToRgb, type ThemeType } from "@huginn/shared";
import { mappedColorThemes, useTheme } from "@stores/themeStore";
import { animate, createDraggable, createScope, Draggable, utils, type Scope } from "animejs";
import clsx from "clsx";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import type { ColorTheme, SettingsTabProps } from "@/types";

const primaryCorners = ["primary-300", "primary-700", "primary-500", "primary-900"] as const;

const themeOptions: { type: ThemeType; label: string; theme: ColorTheme }[] = [
   { type: "pine-green", label: "Pine Green", theme: mappedColorThemes["pine-green"] },
   { type: "cerulean", label: "Cerulean", theme: mappedColorThemes["cerulean"] },
   { type: "plum", label: "Plum", theme: mappedColorThemes["plum"] },
   { type: "coffee", label: "Coffee", theme: mappedColorThemes["coffee"] },
   { type: "violet", label: "Violet", theme: mappedColorThemes["violet"] },
   { type: "rose", label: "Rose", theme: mappedColorThemes["rose"] },
] as const;

export default function SettingsThemeTab(props: SettingsTabProps) {
   const scope = useRef<Scope>(null);
   const dragRef = useRef<HTMLDivElement>(null);
   const iconRef = useRef<HTMLDivElement>(null);
   const bounceRef = useRef<HTMLDivElement>(null);
   const boxRef = useRef<HTMLDivElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const draggable = useRef<Draggable>(null);
   const { themeType } = useTheme();
   const [previewThemeType, setPreviewThemeType] = useState<ThemeType | null>(null);

   const activeTheme = useMemo(() => themeOptions.find((t) => t.type === (previewThemeType ?? themeType))!.theme, [themeType, previewThemeType]);

   // Canvas renders the hovered preview theme, or the current theme
   const canvasTheme = previewThemeType ? themeOptions.find((t) => t.type === previewThemeType)!.theme : activeTheme;

   const canvasTl = useMemo(() => parseOklchToRgb(canvasTheme[primaryCorners[0]]) ?? [], [canvasTheme]);
   const canvasTr = useMemo(() => parseOklchToRgb(canvasTheme[primaryCorners[1]]) ?? [], [canvasTheme]);
   const canvasBl = useMemo(() => parseOklchToRgb(canvasTheme[primaryCorners[2]]) ?? [], [canvasTheme]);
   const canvasBr = useMemo(() => parseOklchToRgb(canvasTheme[primaryCorners[3]]) ?? [], [canvasTheme]);

   // Draggable glow tracks the current theme
   const tl = useMemo(() => parseOklchToRgb(activeTheme[primaryCorners[0]]) ?? [], [activeTheme]);
   const tr = useMemo(() => parseOklchToRgb(activeTheme[primaryCorners[1]]) ?? [], [activeTheme]);
   const bl = useMemo(() => parseOklchToRgb(activeTheme[primaryCorners[2]]) ?? [], [activeTheme]);
   const br = useMemo(() => parseOklchToRgb(activeTheme[primaryCorners[3]]) ?? [], [activeTheme]);

   // Render 2D gradient to canvas (updates on preview hover too)
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
         const ny = y / (h - 1);
         for (let x = 0; x < w; x++) {
            const nx = x / (w - 1);
            const r = utils.lerp(utils.lerp(canvasTl[0], canvasTr[0], nx), utils.lerp(canvasBl[0], canvasBr[0], nx), ny);
            const g = utils.lerp(utils.lerp(canvasTl[1], canvasTr[1], nx), utils.lerp(canvasBl[1], canvasBr[1], nx), ny);
            const b = utils.lerp(utils.lerp(canvasTl[2], canvasTr[2], nx), utils.lerp(canvasBl[2], canvasBr[2], nx), ny);
            const i = (y * w + x) * 4;
            imageData.data[i] = r;
            imageData.data[i + 1] = g;
            imageData.data[i + 2] = b;
            imageData.data[i + 3] = 255;
         }
      }
      ctx.putImageData(imageData, 0, 0);
   }, [canvasTl, canvasTr, canvasBl, canvasBr]);

   const updateColor = useEffectEvent(() => {
      const drag = draggable.current;
      if (!boxRef.current || !drag) return;

      const maxX = boxRef.current.offsetWidth - drag.$target.offsetWidth;
      const maxY = boxRef.current.offsetHeight - drag.$target.offsetHeight;
      const nx = maxX > 0 ? Math.max(0, Math.min(drag.x / maxX, 1)) : 0;
      const ny = maxY > 0 ? Math.max(0, Math.min(drag.y / maxY, 1)) : 0;

      const r = Math.round(utils.lerp(utils.lerp(tl[0], tr[0], nx), utils.lerp(bl[0], br[0], nx), ny));
      const g = Math.round(utils.lerp(utils.lerp(tl[1], tr[1], nx), utils.lerp(bl[1], br[1], nx), ny));
      const b = Math.round(utils.lerp(utils.lerp(tl[2], tr[2], nx), utils.lerp(bl[2], br[2], nx), ny));

      drag.$target.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      drag.$target.style.boxShadow = `0 0 12px 2px rgba(${r}, ${g}, ${b}, 0.4)`;
   });

   // Setup draggable with physics
   useEffect(() => {
      scope.current = createScope().add(() => {
         if (!dragRef.current || !boxRef.current) return;

         let rotation = 0;

         draggable.current = createDraggable(dragRef.current, {
            container: boxRef.current,
            velocityMultiplier: 5,
            containerFriction: 0.6,
            releaseStiffness: 50,
            dragSpeed: 0.5,
            onUpdate: (draggableInstance) => {
               updateColor();
               rotation += draggableInstance.deltaX * 10 + draggableInstance.deltaY * 10;
               if (iconRef.current) iconRef.current.style.transform = `rotate(${rotation}deg)`;
            },
         });
         updateColor();
      });

      return () => scope.current?.revert();
   }, []);

   const displayedLabel =
      (previewThemeType ? themeOptions.find((t) => t.type === previewThemeType) : themeOptions.find((t) => t.type === themeType))?.label ?? "";

   function handleIconClick() {
      if (bounceRef.current) {
         animate(bounceRef.current, {
            scale: [1, 1.2, 1],
            duration: 200,
            ease: "easeInOut",
         });
      }
   }

   useEffect(() => {
      updateColor();
   }, [previewThemeType, themeType]);

   return (
      <div className="flex flex-col items-center">
         <div className="flex flex-col">
            <HuginnLabel>Color Theme</HuginnLabel>
            <div className="flex flex-col items-start gap-y-2">
               <div className="relative flex h-28 w-72 overflow-hidden rounded-md shadow-md select-none" ref={boxRef}>
                  <canvas ref={canvasRef} width={288} height={112} className="pointer-events-none absolute inset-0 size-full rounded-md opacity-50" />
                  <div className="flex size-10 items-center justify-center rounded-full" ref={dragRef} onClick={handleIconClick}>
                     <div ref={iconRef}>
                        <div ref={bounceRef}>
                           <HuginnIcon className="size-7" overrideTheme={previewThemeType ?? themeType} />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex w-72 items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: activeTheme["primary-400"] }}>
                     {displayedLabel}
                  </div>
                  <div className="flex items-center gap-x-2.5">
                     {themeOptions.map((t) => (
                        <button
                           key={t.type}
                           type="button"
                           className={clsx(
                              "size-6 cursor-pointer rounded-full transition-all",
                              themeType === t.type ? "scale-125 shadow-md" : "opacity-50 hover:scale-110 hover:opacity-90",
                           )}
                           style={{ backgroundColor: t.theme["primary-500"] }}
                           onClick={() => props.onChange?.({ theme: t.type })}
                           onMouseEnter={() => setPreviewThemeType(t.type)}
                           onMouseLeave={() => setPreviewThemeType(null)}
                        />
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
