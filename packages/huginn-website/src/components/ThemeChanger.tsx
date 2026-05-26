import { Icon } from "@iconify/react";
import { useState } from "react";

import {
  ceruleanTheme,
  charcoalTheme,
  coffeeTheme,
  eggplantTheme,
  pineGreenTheme,
  type ColorTheme,
  useTheme,
} from "../scripts/useChangeTheme";

type ThemeChangerProps = {
  className?: string;
};

export default function ThemeChanger({ className }: ThemeChangerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setThemeType } = useTheme();

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const chooseTheme = (theme: ColorTheme) => {
    setThemeType(theme.type);
    setIsOpen(false);
  };

  const rootClassName = ["w-fit", className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <button
        onClick={toggleMenu}
        className="shadow-4xl z-30 rounded-full bg-tertiary p-4 shadow-md transition-all hover:shadow-lg"
        type="button"
      >
        <Icon icon="material-symbols:brush" className="size-7 text-accent" />
      </button>

      <div
        className={`absolute bottom-0 right-20 grid h-44 w-28 grid-cols-2 gap-x-2 rounded-lg bg-tertiary p-3 shadow-2xl outline outline-1 outline-primary transition-all duration-[250ms] ease md:h-36 md:w-24 ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        <button
          onClick={() => chooseTheme(coffeeTheme)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8"
          type="button"
        >
          <div className="size-8 rounded-full bg-[#D99A6C] md:size-6"></div>
        </button>

        <button
          onClick={() => chooseTheme(ceruleanTheme)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8"
          type="button"
        >
          <div className="size-8 rounded-full bg-[#00A7E3] md:size-6"></div>
        </button>

        <button
          onClick={() => chooseTheme(pineGreenTheme)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8"
          type="button"
        >
          <div className="size-8 rounded-full bg-[#02CAB9] md:size-6"></div>
        </button>

        <button
          onClick={() => chooseTheme(eggplantTheme)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8"
          type="button"
        >
          <div className="size-8 rounded-full bg-[#DC8B9A] md:size-6"></div>
        </button>

        <button
          onClick={() => chooseTheme(charcoalTheme)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 md:size-8"
          type="button"
        >
          <div className="size-8 rounded-full bg-[#9FB1BD] md:size-6"></div>
        </button>
      </div>
    </div>
  );
}
