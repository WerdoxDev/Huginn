import HuginnInput from "@components/input/HuginnInput";
import HuginnSlider from "@components/input/HuginnSlider";
import HuginnPopover from "@components/popover/HuginnPopover";
import { useIsMobile } from "@hooks/useIsMobile";
import { usePopover } from "@stores/popoverStore";
import clsx from "clsx";
import { type MouseEvent, type PointerEvent, useEffect, useId, useState } from "react";

type HsvColor = {
   hue: number;
   saturation: number;
   value: number;
};

export default function ColorPicker(props: {
   color?: string | null;
   label: string;
   onChange?: (color: string) => void;
   disabled?: boolean;
   className?: string;
   isSelected?: boolean;
}) {
   const id = useId();
   const { open, close, popover } = usePopover("color_picker");
   const isOpen = !!popover?.isOpen && popover.data?.id === id;

   function handleClick(event: MouseEvent<HTMLButtonElement>) {
      if (isOpen) {
         event.preventDefault();
         event.stopPropagation();
         close();
         return;
      }

      open(event, { id, color: props.color, label: props.label, onChange: props.onChange });
   }

   return (
      <button
         type="button"
         className={clsx(
            "bg-surface-alt relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md p-1.5 transition-transform enabled:cursor-pointer enabled:hover:scale-110",
            props.className,

            // isOpen ? "border-white/50" : "border-white/20",
         )}
         disabled={props.disabled}
         onClick={handleClick}
      >
         {props.color ? (
            <div className="size-full rounded-sm" style={{ backgroundColor: props.color || "white" }} />
         ) : (
            <div className="box-exact font-bold text-white">?</div>
         )}
      </button>
   );
}

const DEFAULT_HSV: HsvColor = { hue: 0, saturation: 100, value: 100 };

export function ColorPickerPanel() {
   const { popover, setData } = usePopover("color_picker");
   const isMobile = useIsMobile();
   const data = popover?.data;
   const [draft, setDraft] = useState(data?.color);
   const [hsv, setHsv] = useState<HsvColor>(() => (data?.color ? (cssColorToHsv(data?.color) ?? DEFAULT_HSV) : DEFAULT_HSV));
   const isDraftValid = draft ? !!cssColorToHsv(draft) : true;

   useEffect(() => {
      if (!data) return;
      setDraft(data.color);
      setHsv(data.color ? (cssColorToHsv(data.color) ?? DEFAULT_HSV) : DEFAULT_HSV);
   }, [data?.id, data?.color]);

   function publishColor(color: string, nextHsv: HsvColor) {
      if (!data) return;
      setHsv(nextHsv);
      data.onChange?.(color);
      setData({ ...data, color });
   }

   function applyHsv(nextHsv: HsvColor) {
      publishColor(hsvToHex(nextHsv), nextHsv);
   }

   function handleSaturationValueChange(event: PointerEvent<HTMLDivElement>) {
      if (event.type === "pointermove" && event.buttons !== 1) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      const bounds = event.currentTarget.getBoundingClientRect();
      const saturation = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      const value = 100 - Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
      // applyHsv({ ...(hsv || { hue: 0, saturation: 0, value: 0 }), saturation, value });
      applyHsv(hsv ? { ...hsv, saturation, value } : { hue: 0, saturation, value });
   }

   function handleLiteralChange(value: string) {
      setDraft(value);
      const nextHsv = cssColorToHsv(value);
      if (nextHsv) publishColor(value, nextHsv);
   }

   return (
      <HuginnPopover.Panel className={clsx("p-3", isMobile ? "w-full px-5" : "w-60")}>
         <div
            className="relative h-32 cursor-crosshair touch-none overflow-hidden rounded-md"
            style={{
               backgroundColor: hsv ? `hsl(${hsv.hue} 100% 50%)` : undefined,
               backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgba(255, 255, 255, 0))",
            }}
            onPointerDown={handleSaturationValueChange}
            onPointerMove={handleSaturationValueChange}
            onTouchStart={(e) => e.stopPropagation()}
         >
            {data?.color && (
               <span
                  className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${hsv?.saturation}%`, top: `${100 - (hsv?.value || 0)}%` }}
               />
            )}
         </div>
         <HuginnSlider
            className="mt-2"
            minValue={0}
            maxValue={360}
            step={1}
            value={hsv?.hue}
            // defaultValue={hsv.hue}

            onChange={(hue) => applyHsv(hsv ? { ...hsv, hue } : { hue, saturation: 100, value: 100 })}
         >
            <HuginnSlider.Input
               backgroundClassName="bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
               fillClassName="bg-transparent"
            />
         </HuginnSlider>
         <HuginnInput
            className="mt-2 w-full"
            message={{
               status: isDraftValid ? "none" : "error",
               text: isDraftValid ? "" : "Enter a valid CSS color.",
            }}
            placeholder="Hex, red, rgb(…), hsl(…)"
            value={draft ?? ""}
            onChange={(event) => handleLiteralChange(event.currentTarget.value)}
         >
            <HuginnInput.Wrapper className="bg-surface!">
               <HuginnInput.Input className="h-auto px-2 py-1.5 text-sm" />
            </HuginnInput.Wrapper>
         </HuginnInput>
      </HuginnPopover.Panel>
   );
}

function cssColorToHsv(color: string): HsvColor | null {
   const value = color.trim();
   if (!value || typeof CSS === "undefined" || !CSS.supports("color", value) || typeof document === "undefined") return null;

   const canvas = document.createElement("canvas");
   canvas.width = 1;
   canvas.height = 1;
   const context = canvas.getContext("2d", { willReadFrequently: true });
   if (!context) return null;

   context.fillStyle = value;
   context.fillRect(0, 0, 1, 1);
   const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
   return rgbToHsv(red, green, blue);
}

function rgbToHsv(red: number, green: number, blue: number): HsvColor {
   const r = red / 255;
   const g = green / 255;
   const b = blue / 255;
   const max = Math.max(r, g, b);
   const min = Math.min(r, g, b);
   const delta = max - min;
   let hue = 0;

   if (delta) {
      if (max === r) hue = 60 * (((g - b) / delta) % 6);
      else if (max === g) hue = 60 * ((b - r) / delta + 2);
      else hue = 60 * ((r - g) / delta + 4);
   }

   return {
      hue: Math.round(hue < 0 ? hue + 360 : hue),
      saturation: Math.round(max ? (delta / max) * 100 : 0),
      value: Math.round(max * 100),
   };
}

function hsvToHex({ hue, saturation, value }: HsvColor) {
   const chroma = (value / 100) * (saturation / 100);
   const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
   const match = value / 100 - chroma;
   const [r, g, b] =
      hue < 60
         ? [chroma, x, 0]
         : hue < 120
           ? [x, chroma, 0]
           : hue < 180
             ? [0, chroma, x]
             : hue < 240
               ? [0, x, chroma]
               : hue < 300
                 ? [x, 0, chroma]
                 : [chroma, 0, x];

   return `#${[r, g, b]
      .map((channel) =>
         Math.round((channel + match) * 255)
            .toString(16)
            .padStart(2, "0"),
      )
      .join("")}`;
}
