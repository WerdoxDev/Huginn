import type { ReactNode } from "react";

import { HuginnButton, HuginnIcon } from "@huginn/frontend-shared";
import { useTheme } from "@stores/themeStore";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about")({
   component: AboutComponent,
});

function AboutComponent() {
   const { themeType } = useTheme();

   return (
      <div className="mt-32 flex flex-1 items-center justify-center lg:mt-20">
         <div className="flex w-full flex-col px-4 lg:max-w-5xl">
            <div className="flex items-center justify-center lg:justify-start">
               <HuginnIcon themeType={themeType} className="size-16" outlined />
               {/*<img src={`/logo/${theme.logoOutline}`} className="size-16 object-contain transition-all hover:-rotate-12 active:rotate-6" />*/}
               <p className="text-text ml-2 text-4xl font-bold">About Huginn</p>
            </div>

            <div className="bg-text/50 my-6 h-0.5 w-auto" />

            <h3 className="text-lg lg:text-xl">
               <span className="font-bold">Huginn</span> is a chat app with a <span className="text-[#82ccdd]">Norse</span> twist! Inspired by one of{" "}
               <span className="text-[#b8e994]">Odin</span>'s ravens, <span className="text-primary-500">Huginn</span> brings a bit of{" "}
               <span className="text-negative-500">Viking</span> flair to your everyday conversations. It's an{" "}
               <span className="text-[#b8e994]">open-source</span>, <span className="text-[#00a7e3]">highly customizable</span> platform that's as easy to use
               as it is fast. Whether you're discussing the latest news or planning your next raid{" "}
               <span className="text-text">(or, you know, a group project)</span>, Huginn offers a <span className="text-negative-500">fun</span> and{" "}
               <span className="text-[#82ccdd]">unique</span> way to <span className="text-[#00a7e3]">connect</span> with others.
            </h3>

            <div className="mt-6 flex flex-col gap-2.5 lg:flex-row lg:gap-5">
               <a
                  href="https://github.com/WerdoxDev"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-surface-deep hover:bg-surface-deep/50 flex items-center gap-x-3 rounded-lg p-2 pr-4 transition-all"
               >
                  <img src="https://github.com/werdoxdev.png" className="size-14 rounded-md shadow-lg hover:shadow-2xl" />
                  <div>
                     Matin Tat
                     <br />
                     (Werdox)
                  </div>
               </a>
               <a
                  href="https://github.com/VoiD-ev"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-surface-deep hover:bg-surface-deep/50 flex items-center gap-x-3 rounded-lg p-2 pr-4 transition-all"
               >
                  <img src="https://github.com/void-ev.png" className="size-14 rounded-md shadow-lg hover:shadow-2xl" />
                  <div>
                     Mahziyar Farahmandian
                     <br />
                     (Void)
                  </div>
               </a>
            </div>

            <div className="mt-6 mb-6 flex justify-around lg:mb-0 lg:justify-start lg:gap-2">
               <LinkButton link="https://www.instagram.com/werdox.dev/">
                  <IconRiInstagramFill className="size-7" />
               </LinkButton>

               <LinkButton link="https://x.com/Matin90365857">
                  <IconMdiTwitter className="size-7" />
               </LinkButton>

               <LinkButton link="https://discord.gg/cad9P5dm3y">
                  <IconIcBaselineDiscord className="size-7" />
               </LinkButton>

               <LinkButton link="https://github.com/WerdoxDev/Huginn">
                  <IconBiGithub className="size-7" />
               </LinkButton>
            </div>
         </div>
      </div>
   );
}

function LinkButton(props: { children?: ReactNode; link: string }) {
   return (
      <a href={props.link} target="_blank" rel="noreferrer">
         <HuginnButton className="p-3" color="primary">
            {props.children}
         </HuginnButton>
      </a>
   );
}
