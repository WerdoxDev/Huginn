import { Icon } from "@iconify/react";
import { Rive } from "@rive-app/canvas";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import Feature from "./components/Feature";
import { useTheme } from "./scripts/useChangeTheme";

export default function Home() {
  const [onlineCount, setOnlineCount] = useState("0");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { currentTheme } = useTheme();

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
      <div className="mt-32 flex w-full items-center justify-center md:mt-52">
        <div className="flex flex-col md:flex-row md:space-x-7">
          <div className="w-full px-4 md:w-96 md:px-0">
            <div className="flex flex-col items-center justify-center md:flex-row md:justify-start">
              <img
                src={`/logo/${currentTheme.logoOutline}`}
                className="size-24 object-contain transition-all hover:-rotate-12 active:rotate-6 md:size-20"
              />
              <p className="mt-4 text-5xl font-extrabold text-text md:ml-4 md:mt-0">Huginn</p>
            </div>

            <div className="mx-auto mt-8 flex w-fit flex-row items-center gap-x-2 rounded-full border border-primary bg-tertiary/50 px-4 py-2 pr-6 shadow-md transition-all hover:shadow-lg">
              <Icon icon="mingcute:group-3-fill" className="size-10 text-accent" />
              <p className="text-center text-xl font-bold md:text-left">
                <span className="font-bold text-accent">{onlineCount}</span>
                warriors online!
              </p>
            </div>

            <p className="mx-2 mt-8 text-center text-2xl md:mx-0 md:text-left">
              A fast, customizable chat app with a touch of Norse mythology.
            </p>

            <div className="mt-12 flex w-full flex-row space-x-2">
              <Link
                to="/download"
                className="flex h-12 w-full items-center justify-center space-x-2 rounded-md bg-primary px-5 text-xl transition-all hover:bg-primary/50"
              >
                <div className="font-bold">DOWNLOAD HUGINN</div>
                <Icon icon="mingcute:windows-fill" className="size-6" />
              </Link>

              <a
                href="https://huginn.dev/app"
                className="hidden size-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-[#464646] bg-secondary transition-all hover:bg-tertiary md:flex"
              >
                <Icon icon="mingcute:chrome-fill" className="size-8" />
              </a>
            </div>
          </div>

          <div className="mx-4 mt-6 rounded-2xl bg-secondary p-1 md:mx-0 md:mt-0">
            <canvas
              ref={canvasRef}
              className="w-full md:w-[35rem]"
              width={500}
              height={320}
              id="intro"
            />
          </div>
        </div>
      </div>

      <div className="mb-12 mt-24 flex items-center justify-center px-4 md:mb-40 md:mt-52 md:px-0">
        <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-16">
          <Feature
            icon="raphael:opensource"
            header="Open Source and Free"
            text="Huginn is made to be open-source. Everything you see is available to use under the  GNU GPLv3 license. Contribution is always welcome and encouraged"
          />
          <Feature
            icon="mingcute:lightning-fill"
            header="Fast, Secure, and Lightweight"
            text="Huginn leverages the latest technologies to provide a fast, lightweight and secure app all with a very tiny bundle size!"
          />
          <Feature
            icon="mingcute:paint-2-fill"
            header="Customizable and Fun"
            text="Make Huginn your own with easy customization options, designed for both simplicity and a fun, engaging chat experience."
          />
          <Feature
            icon="eos-icons:api"
            header="Extensive API"
            text="Huginn's API is so simple to use that anyone with basic node knowledge can do cool stuff with it!"
          />
        </div>
      </div>
    </>
  );
}
