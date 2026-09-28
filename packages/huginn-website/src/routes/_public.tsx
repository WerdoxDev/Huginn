import HeaderButton from "@components/HeaderButton";
import ThemeChanger from "@components/ThemeChanger";
import { HuginnIcon } from "@huginn/frontend-shared";
import { useTheme } from "@stores/themeStore";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { type MouseEvent, useState } from "react";

export const Route = createFileRoute("/_public")({
   component: PublicComponent,
});

function PublicComponent() {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const { themeType } = useTheme();

   const toggleMenu = () => {
      setIsMenuOpen((prev) => !prev);
   };

   const closeMenu = (event?: MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      setIsMenuOpen(false);
   };

   return (
      <div className="bg-surface text-text flex min-h-screen flex-col overflow-hidden">
         <Analytics />
         <div className="border-text bg-surface-deep fixed top-0 z-30 flex w-full items-center border-b px-5 py-4 backdrop-blur-md lg:justify-center lg:pr-10 lg:pl-20">
            <Link to="/" className={`flex items-center transition-opacity duration-250 ${isMenuOpen ? "opacity-0" : ""}`}>
               <HuginnIcon themeType={themeType} className="size-10" outlined />
               <div className="pl-3 text-2xl font-bold">Huginn</div>
            </Link>

            <button className="ml-auto lg:hidden" onClick={toggleMenu} type="button">
               <IconMaterialSymbolsMenu className="size-8" />
            </button>

            <div className="ml-auto hidden gap-x-10 lg:flex">
               <HeaderButton link="/" text="Home" />
               <HeaderButton link="https://huginn.dev/docs" text="Docs" anchor />
               <HeaderButton link="/about" text="About" />
               <HeaderButton link="/download" text="Download" />

               <div className="bg-text/30 w-0.5" />

               <a href="https://github.com/WerdoxDev/Huginn" target="_blank" rel="noreferrer">
                  <IconBiGithub className="size-8 transition-all hover:shadow-md" />
               </a>
            </div>
         </div>

         <div
            className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-250 ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={toggleMenu}
         />

         <div
            className={`bg-surface-deep fixed right-0 z-50 h-full w-4/5 shadow-xl transition-transform duration-250 ${
               isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
         >
            <div className="m-5 flex">
               <Link to="/" className="flex items-center">
                  <HuginnIcon themeType={themeType} className="size-10" outlined />
                  <div className="pl-3 text-2xl font-bold">HUGINN</div>
               </Link>

               <button className="ml-auto lg:hidden" onClick={toggleMenu} type="button">
                  <IconMdiClose className="size-8" />
               </button>
            </div>

            <div className="mt-10 ml-10 flex flex-col gap-y-7">
               <HeaderButton link="/" text="Home" onClick={closeMenu} />
               <HeaderButton link="https://huginn.dev/docs" text="Docs" anchor onClick={closeMenu} />
               <HeaderButton link="/about" text="About" onClick={closeMenu} />
               <HeaderButton link="/download" text="Download" onClick={closeMenu} />
            </div>
         </div>

         <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />

            <ThemeChanger className="fixed right-5 bottom-5 z-20" />

            <div className="border-surface-deep bg-surface-alt relative flex shrink-0 flex-col border-t bg-linear-to-t px-5 py-3 lg:flex-row lg:px-12">
               <div className="ml-7 hidden lg:block">
                  Huginn made by{" "}
                  <a href="https://github.com/WerdoxDev" target="_blank" rel="noreferrer" className="text-primary-500 underline">
                     Matin Tat
                  </a>{" "}
                  / Website made by{" "}
                  <a href="https://github.com/VoiD-ev" target="_blank" rel="noreferrer" className="text-primary-500 underline">
                     Mahziyar Farahmandian
                  </a>
               </div>

               <div className="text-sm lg:hidden">
                  Huginn made by{" "}
                  <a href="https://github.com/WerdoxDev" target="_blank" rel="noreferrer" className="text-primary-500 underline">
                     Matin Tat
                  </a>
               </div>
               <div className="mt-1 text-sm lg:hidden">
                  Website made by{" "}
                  <a href="https://github.com/VoiD-ev" target="_blank" rel="noreferrer" className="text-primary-500 underline">
                     Mahziyar Farahmandian
                  </a>
               </div>

               <div className="mt-4 flex items-center space-x-7 lg:mt-0 lg:mr-7 lg:ml-auto lg:space-x-5">
                  <a href="https://www.instagram.com/werdox.dev/" target="_blank" rel="noreferrer">
                     <IconRiInstagramFill className="size-6" />
                  </a>

                  <a href="https://x.com/Matin90365857" target="_blank" rel="noreferrer">
                     <IconMdiTwitter className="size-6" />
                  </a>

                  <a href="https://discord.gg/cad9P5dm3y" target="_blank" rel="noreferrer">
                     <IconIcBaselineDiscord className="size-6" />
                  </a>

                  <a href="https://github.com/WerdoxDev/Huginn" target="_blank" rel="noreferrer">
                     <IconBiGithub className="size-6" />
                  </a>
               </div>
            </div>
         </div>
      </div>
   );
}
