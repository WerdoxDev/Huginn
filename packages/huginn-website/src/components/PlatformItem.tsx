import { Icon } from "@iconify/react";

type PlatformItemProps = {
  url?: string;
  icon: string;
  text: string;
};

export default function PlatformItem({ url, icon, text }: PlatformItemProps) {
  return (
    <a
      href={url}
      className={`flex gap-x-2 rounded-md p-2 hover:bg-secondary ${url ? "cursor-pointer" : "cursor-not-allowed"}`}
      aria-disabled={!url}
    >
      <Icon icon={icon} className={`size-6 ${url ? "text-white" : "text-white/50"}`} />
      <span className={`${url ? "text-white" : "text-white/50"}`}>{text}</span>
    </a>
  );
}
