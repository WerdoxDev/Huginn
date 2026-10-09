import Feature from "@components/Feature";
import { useIsMobile } from "@hooks/useIsMobile";
import { HuginnButton, HuginnIcon } from "@huginn/frontend-shared";
import { Rive } from "@rive-app/canvas";
import { useTheme } from "@stores/themeStore";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_public/")({
   component: IndexComponent,
});

function getPlatformIcon() {
   if (typeof navigator === "undefined") return IconMingcuteDownload3Fill;

   const userAgent = navigator.userAgent;
   if (/Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(userAgent)) return IconMingcuteAppleFill;
   if (/Windows/i.test(userAgent)) return IconMingcuteWindowsFill;
   if (/Linux|X11|CrOS/i.test(userAgent)) return IconMingcuteLinuxFill;
   return IconMingcuteDownload3Fill;
}

function IndexComponent() {
   const [onlineCount, setOnlineCount] = useState("0");
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const { themeType } = useTheme();
   const isMobile = useIsMobile();
   const PlatformIcon = getPlatformIcon();

   useEffect(() => {
      console.log(themeType);
   }, [themeType]);

   useEffect(() => {
      let isActive = true;

      const loadCount = async () => {
         try {
            const countData = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/api/online-users`);
            const data = await countData.json();
            if (isActive) {
               setOnlineCount(data.count.toLocaleString());
            }
         } catch (error) {
            console.error("Something went wrong fetching user count!", error);
         }
      };

      loadCount();

      return () => {
         isActive = false;
      };
   }, []);

   useEffect(() => {
      if (!canvasRef.current) return;

      const riveInstance = new Rive({
         src: "/huginn-website-intro.riv",
         canvas: canvasRef.current,
         autoplay: true,
         isTouchScrollEnabled: true,
         stateMachines: "Main",
         onLoad: () => {
            riveInstance.resizeDrawingSurfaceToCanvas();
         },
      });

      const handleResize = () => {
         riveInstance.resizeDrawingSurfaceToCanvas();
      };

      window.addEventListener("resize", handleResize);

      return () => {
         window.removeEventListener("resize", handleResize);
         const maybeCleanup = riveInstance as Rive & { cleanup?: () => void };
         if (typeof maybeCleanup.cleanup === "function") {
            maybeCleanup.cleanup();
         }
      };
   }, []);

   return (
      <>
         <div className="relative flex min-h-dvh w-full items-center justify-center pt-28 pb-24">
            <div className="flex flex-col items-center lg:flex-row lg:space-x-7">
               <div className="w-full px-4 lg:w-96 lg:px-0">
                  <div className="flex flex-col items-center justify-center lg:flex-row lg:justify-start">
                     <HuginnIcon className="size-24 object-contain transition-all hover:-rotate-12 active:rotate-6 lg:size-20" themeType={themeType} outlined />
                     <p className="text-text mt-4 text-5xl font-extrabold lg:mt-0 lg:ml-4">Huginn</p>
                  </div>

                  <div className="border-primary-500 bg-surface-deep mx-auto mt-8 flex w-fit flex-row items-center gap-x-2 rounded-md border px-4 py-2 pr-6 shadow-md transition-all hover:shadow-lg">
                     <IconMingcuteGroup3Fill className="text-primary-500 size-10" />
                     <p className="text-center text-xl font-bold lg:text-left">
                        <span className="text-primary-500 font-bold">{onlineCount}</span> warriors online!
                     </p>
                  </div>

                  <p className="mx-2 mt-8 text-center text-2xl lg:mx-0 lg:text-left">A fast, customizable chat app with a touch of Norse mythology.</p>

                  <div className="mt-8 flex w-full flex-col gap-y-2">
                     <Link to="/download" className="hidden w-full lg:block">
                        <HuginnButton color="primary" className="flex h-12 w-full items-center justify-center gap-x-2 px-5">
                           <div className="text-xl font-bold">DOWNLOAD HUGINN</div>
                           <PlatformIcon className="size-6" />
                        </HuginnButton>
                     </Link>

                     <a href="https://huginn.dev/app" className="w-full">
                        <HuginnButton color={isMobile ? "primary" : "surface-alt"} className="flex h-12 w-full items-center justify-center gap-x-2 px-5">
                           <div className="text-xl">OPEN IN BROWSER</div>
                           <IconMingcuteChromeFill className="size-6" />
                        </HuginnButton>
                     </a>
                  </div>
               </div>

               <div className="bg-surface-alt mx-4 mt-6 h-max w-[calc(100%-2rem)] rounded-2xl p-1 lg:mx-0 lg:mt-0 lg:w-auto">
                  <canvas ref={canvasRef} className="block h-auto w-full lg:w-140" width={500} height={320} id="intro" />
               </div>
            </div>

            <div className="absolute inset-x-0 bottom-10 flex justify-center">
               <IconMingcuteArrowDownFill className="text-primary-500 size-10 animate-bounce" />
            </div>
         </div>

         <div className="mb-12 flex items-center justify-center px-4 lg:mb-40 lg:px-0">
            <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:gap-16">
               <Feature
                  icon={IconRaphaelOpensource}
                  header="Open Source and Free"
                  text="Huginn is made to be open-source. Everything you see is available to use under the  GNU GPLv3 license. Contribution is always welcome and encouraged"
               />
               <Feature
                  icon={IconMingcuteLightningFill}
                  header="Fast, Secure, and Lightweight"
                  text="Huginn leverages the latest technologies to provide a fast, lightweight and secure app all with a very tiny bundle size!"
               />
               <Feature
                  icon={IconMingcutePaint2Fill}
                  header="Customizable and Fun"
                  text="Make Huginn your own with easy customization options, designed for both simplicity and a fun, engaging chat experience."
               />
               <Feature
                  icon={IconEosIconsApi}
                  header="Extensive API"
                  text="Huginn's API is so simple to use that anyone with basic node knowledge can do cool stuff with it!"
               />
            </div>
         </div>
      </>
   );
}
