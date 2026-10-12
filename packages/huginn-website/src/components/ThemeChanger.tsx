import type { ThemeType } from "@huginnjs/shared";

import { mappedColorThemes } from "@huginn/frontend-shared";
import { themeStore } from "@stores/themeStore";
import clsx from "clsx";
import { useState } from "react";

export default function ThemeChanger(props: { className?: string }) {
   const [isOpen, setIsOpen] = useState(false);
   const { setTheme } = themeStore.actions;

   const toggleMenu = () => {
      setIsOpen((prev) => !prev);
   };

   function handleChooseTheme(theme: ThemeType) {
      setTheme(theme);
      setIsOpen(false);
   }

   return (
      <div className={clsx("relative w-fit", props.className)}>
         <button
            onClick={toggleMenu}
            className="bg-surface hover:bg-surface-alt flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors outline-none"
            type="button"
            aria-label="Choose theme"
            aria-expanded={isOpen}
         >
            <IconMaterialSymbolsBrush className="text-primary-500 size-6" />
         </button>

         <div
            className={clsx(
               "bg-surface-deep absolute top-full right-0 z-40 mt-3 grid w-max origin-top-right grid-cols-2 gap-3 rounded-lg p-3 shadow-xl transition-all duration-250",
               isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
            )}
         >
            {Object.keys(mappedColorThemes).map((theme) => (
               <button
                  key={theme}
                  onClick={() => handleChooseTheme(theme as ThemeType)}
                  className="flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105"
                  type="button"
               >
                  <div className="size-10 rounded-full" style={{ backgroundColor: mappedColorThemes[theme as ThemeType]["primary-500"] }}></div>
               </button>
            ))}
            {/*<button
               onClick={() => handleChooseTheme("coffee")}
               className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 lg:size-8"
               type="button"
            >
               <div className="size-8 rounded-full bg-[#D99A6C] lg:size-6"></div>
            </button>

            <button
               onClick={() => handleChooseTheme("cerulean")}
               className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 lg:size-8"
               type="button"
            >
               <div className="size-8 rounded-full bg-[#00A7E3] lg:size-6"></div>
            </button>

            <button
               onClick={() => handleChooseTheme("pine-green")}
               className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 lg:size-8"
               type="button"
            >
               <div className="size-8 rounded-full bg-[#02CAB9] lg:size-6"></div>
            </button>

            <button
               onClick={() => handleChooseTheme("plum")}
               className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 lg:size-8"
               type="button"
            >
               <div className="size-8 rounded-full bg-[#DC8B9A] lg:size-6"></div>
            </button>

            <button
               onClick={() => handleChooseTheme("rose")}
               className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 lg:size-8"
               type="button"
            >
               <div className="size-8 rounded-full bg-[#9FB1BD] lg:size-6"></div>
            </button>*/}
         </div>
      </div>
   );
}
