import type { APIRelease } from "@huginn/shared";

import { Popover, Transition } from "@headlessui/react";
import { Icon } from "@iconify/react";
import moment from "moment";
import { Fragment, useEffect, useState } from "react";

import PlatformItem from "./PlatformItem";

type VersionCardProps = APIRelease & { latest?: boolean };

export default function VersionCard({
  version,
  date,
  description,
  latest,
  url,
  windowsSetupUrl,
  macosSetupUrl,
  linuxSetupUrl,
}: VersionCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`group w-full rounded-lg border border-b-2 border-text/50 bg-secondary p-4 shadow-md transition-all duration-[250ms] ease hover:shadow-lg md:max-w-md ${
        latest ? "border-b-success/70" : "border-b-warning/70"
      } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
    >
      <div className="flex items-center">
        <div className="text-xl font-semibold">{version}</div>
        <div
          className={`ml-2 rounded-lg border px-2 py-0.5 ${latest ? "border-success/70 text-success" : "border-warning/70 text-warning"}`}
        >
          {latest ? "latest" : "old"}
        </div>
        <div className="ml-auto hidden self-start text-text/70 md:block">
          {moment(date).format("Do MMM YYYY")}
        </div>
        <div className="ml-auto self-start text-text/70 md:hidden">
          {moment(date).format("DD.MM.YYYY")}
        </div>
      </div>

      <div className="mt-3">
        {description}
        {!description ? <span className="italic">This release has no description</span> : null}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="flex shrink-0 items-center justify-center gap-x-2">
          <Icon
            icon="mingcute:windows-fill"
            className={`size-6 ${windowsSetupUrl ? "text-white" : "text-white/50"}`}
          />
          <Icon
            icon="mingcute:apple-fill"
            className={`size-6 ${macosSetupUrl ? "text-white" : "text-white/50"}`}
          />
          <Icon
            icon="mingcute:linux-fill"
            className={`size-6 ${linuxSetupUrl ? "text-white" : "text-white/50"}`}
          />
        </div>
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button className="ml-auto flex w-fit cursor-pointer items-center justify-center gap-x-2 rounded-md border border-success/50 bg-background/100 px-4 py-2 text-white outline-none transition-all hover:border-success hover:bg-background/50">
                <Icon icon="mingcute:download-3-fill" className="size-5" />
                <span>Download</span>
                <Icon
                  icon="mingcute:down-fill"
                  className={`size-5 transition-all ${open ? "-scale-100" : ""}`}
                />
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition duration-200 ease-out"
                enterFrom="translate-y-1 opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="transition duration-150 ease-in"
                leaveFrom="translate-y-0 opacity-100"
                leaveTo="translate-y-1 opacity-0"
              >
                <Popover.Panel className="absolute left-0 right-0 top-12 z-10 flex flex-col gap-y-1 rounded-lg bg-tertiary p-2 shadow-md">
                  <PlatformItem icon="mingcute:windows-fill" text="Windows" url={windowsSetupUrl} />
                  <PlatformItem icon="mingcute:apple-fill" text="MacOS" url={macosSetupUrl} />
                  <PlatformItem icon="mingcute:linux-fill" text="Linux" url={linuxSetupUrl} />
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
}
