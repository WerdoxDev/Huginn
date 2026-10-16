import type { ReactNode } from "react";

export default function CautionInfo(props: { children: ReactNode }) {
   return (
      <div className="bg-caution-900 flex items-center gap-x-2 rounded-md px-2 py-1">
         <IconMingcuteInformationFill className="text-caution-300 size-6 shrink-0" />
         <div className="text-sm text-white/80">{props.children}</div>
      </div>
   );
}
