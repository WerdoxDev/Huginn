import type { IconComponent } from "@/types";

type PlatformItemProps = {
   url?: string;
   icon: IconComponent;
   text: string;
};

export default function PlatformItem({ url, icon, text }: PlatformItemProps) {
   const IconComponent = icon;

   return (
      <a href={url} className={`hover:bg-surface-alt flex gap-x-2 rounded-md p-2 ${url ? "cursor-pointer" : "cursor-not-allowed"}`} aria-disabled={!url}>
         <IconComponent className={`size-6 ${url ? "text-white" : "text-white/50"}`} />
         <span className={`${url ? "text-white" : "text-white/50"}`}>{text}</span>
      </a>
   );
}
