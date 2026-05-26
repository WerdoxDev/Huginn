import { Icon } from "@iconify/react";
import { Link, Outlet } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { useState, type MouseEvent } from "react";

import HeaderButton from "./components/HeaderButton";
import ThemeChanger from "./components/ThemeChanger";
import { useTheme } from "./scripts/useChangeTheme";

export default function App() {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const { currentTheme } = useTheme();

   const toggleMenu = () => {
      setIsMenuOpen((prev) => !prev);
   };

   const closeMenu = (event?: MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      setIsMenuOpen(false);
   };

   return (
      <>
         <Analytics />
         <div className="border-text fixed top-0 z-30 flex w-full items-center border-b bg-black/30 px-5 py-4 backdrop-blur-md md:justify-center md:pr-10 md:pl-20">
            <Link to="/" className={`flex items-center transition-opacity duration-250 ${isMenuOpen ? "opacity-0" : ""}`}>
               <img src={`/logo/${currentTheme.logoOutline}`} className="size-10" />
               <div className="pl-3 text-2xl font-bold">HUGINN</div>
            </Link>

            <button className="ml-auto md:hidden" onClick={toggleMenu} type="button">
               <Icon icon="material-symbols:menu" className="size-8" />
            </button>

            <div className="ml-auto hidden gap-x-10 md:flex">
               <HeaderButton link="/" text="Home" />
               <HeaderButton link="/docs" text="Docs" />
               <HeaderButton link="/about" text="About" />
               <HeaderButton link="/download" text="Download" />

               <div className="bg-text/30 w-0.5" />

               <a href="https://github.com/WerdoxDev/Huginn" target="_blank" rel="noreferrer">
                  <Icon icon="bi:github" className="size-8 transition-all hover:shadow-md" />
               </a>
            </div>
         </div>

         <div
            className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-250 ${
               isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={toggleMenu}
         />

         <div
            className={`bg-tertiary fixed right-0 z-50 h-full w-4/5 shadow-xl transition-transform duration-250 ${
               isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
         >
            <div className="m-5 flex">
               <Link to="/" className="flex items-center">
                  <img src={`/logo/${currentTheme.logoOutline}`} className="size-10" />
                  <div className="pl-3 text-2xl font-bold">HUGINN</div>
               </Link>

               <button className="ml-auto md:hidden" onClick={toggleMenu} type="button">
                  <Icon icon="mdi:close" className="size-8" />
               </button>
            </div>

            <div className="mt-10 ml-10 flex flex-col gap-y-7">
               <HeaderButton link="/" text="Home" onClick={closeMenu} />
               <HeaderButton link="/docs" text="Docs" onClick={closeMenu} />
               <HeaderButton link="/about" text="About" onClick={closeMenu} />
               <HeaderButton link="/download" text="Download" onClick={closeMenu} />
            </div>
         </div>

         <div className="flex h-full flex-col">
            <Outlet />

            <ThemeChanger className="sticky bottom-5 mr-5 mb-5 ml-auto" />

            <div className="border-tertiary bg-secondary relative flex shrink-0 flex-col border-t bg-linear-to-t px-5 py-3 md:flex-row md:px-12">
               <div className="ml-7 hidden md:block">
                  Huginn made by
                  <a href="https://github.com/WerdoxDev" target="_blank" rel="noreferrer" className="text-accent underline">
                     Matin Tat
                  </a>
                  / Website made by
                  <a href="https://github.com/VoiD-ev" target="_blank" rel="noreferrer" className="text-accent underline">
                     Mahziyar Farahmandian
                  </a>
               </div>

               <div className="text-sm md:hidden">
                  Huginn made by
                  <a href="https://github.com/WerdoxDev" target="_blank" rel="noreferrer" className="text-accent underline">
                     Matin Tat
                  </a>
               </div>
               <div className="mt-1 text-sm md:hidden">
                  Website made by
                  <a href="https://github.com/VoiD-ev" target="_blank" rel="noreferrer" className="text-accent underline">
                     Mahziyar Farahmandian
                  </a>
               </div>

               <div className="mt-4 flex items-center space-x-7 md:mt-0 md:mr-7 md:ml-auto md:space-x-5">
                  <a href="https://www.instagram.com/werdox.dev/" target="_blank" rel="noreferrer">
                     <Icon icon="ri:instagram-fill" className="size-6" />
                  </a>

                  <a href="https://x.com/Matin90365857" target="_blank" rel="noreferrer">
                     <Icon icon="mdi:twitter" className="size-6" />
                  </a>

                  <a href="https://discord.gg/cad9P5dm3y" target="_blank" rel="noreferrer">
                     <Icon icon="ic:baseline-discord" className="size-6" />
                  </a>

                  <a href="https://github.com/WerdoxDev/Huginn" target="_blank" rel="noreferrer">
                     <Icon icon="bi:github" className="size-6" />
                  </a>
               </div>
            </div>
         </div>
      </>
   );
}
