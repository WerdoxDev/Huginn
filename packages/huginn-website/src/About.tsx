import { Icon } from "@iconify/react";

import { useTheme } from "./scripts/useChangeTheme";

export default function About() {
   const { currentTheme } = useTheme();

   return (
      <div className="mt-32 flex h-full items-center justify-center md:mt-20">
         <div className="flex w-full flex-col px-4 md:max-w-5xl">
            <div className="flex items-center justify-center md:justify-start">
               <img src={`/logo/${currentTheme.logoOutline}`} className="size-16 object-contain transition-all hover:-rotate-12 active:rotate-6" />
               <p className="text-text ml-2 text-4xl font-bold">About Huginn</p>
            </div>

            <div className="bg-text/50 my-6 h-0.5 w-auto" />

            <h3 className="text-lg md:text-xl">
               <span className="font-bold">Huginn</span> is a chat app with a <span className="text-[#82ccdd]">Norse</span> twist! Inspired by one of{" "}
               <span className="text-[#b8e994]">Odin</span>'s ravens, <span className="text-accent">Huginn</span> brings a bit of
               <span className="text-error">Viking</span> flair to your everyday conversations. It's an <span className="text-[#b8e994]">open-source</span>,
               <span className="text-[#00a7e3]">highly customizable</span> platform that's as easy to use as it is fast. Whether you're discussing the latest
               news or planning your next raid <span className="text-text">(or, you know, a group project)</span>, Huginn offers a
               <span className="text-error">fun</span> and <span className="text-[#82ccdd]">unique</span> way to <span className="text-[#00a7e3]">connect</span>{" "}
               with others.
            </h3>

            <div className="mt-6 flex flex-col gap-2.5 md:flex-row md:gap-5">
               <a
                  href="https://github.com/WerdoxDev"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-tertiary hover:bg-tertiary/50 flex items-center gap-x-3 rounded-lg p-2 pr-4 transition-all"
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
                  className="bg-tertiary hover:bg-tertiary/50 flex items-center gap-x-3 rounded-lg p-2 pr-4 transition-all"
               >
                  <img src="https://github.com/void-ev.png" className="size-14 rounded-md shadow-lg hover:shadow-2xl" />
                  <div>
                     Mahziyar Farahmandian
                     <br />
                     (Void)
                  </div>
               </a>
            </div>

            <div className="mt-6 mb-6 flex justify-around md:mb-0 md:justify-start md:gap-5">
               <a
                  href="https://www.instagram.com/werdox.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary/50 rounded-md p-2.5 transition-all"
               >
                  <Icon icon="ri:instagram-fill" className="size-7" />
               </a>

               <a
                  href="https://x.com/Matin90365857"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary/50 rounded-md p-2.5 transition-all"
               >
                  <Icon icon="mdi:twitter" className="size-7" />
               </a>

               <a
                  href="https://discord.gg/cad9P5dm3y"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary/50 rounded-md p-2.5 transition-all"
               >
                  <Icon icon="ic:baseline-discord" className="size-7" />
               </a>

               <a
                  href="https://github.com/WerdoxDev/Huginn"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-primary/50 rounded-md p-2.5 transition-all"
               >
                  <Icon icon="bi:github" className="size-7" />
               </a>
            </div>
         </div>
      </div>
   );
}
