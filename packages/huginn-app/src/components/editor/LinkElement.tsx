import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { useContextMenu } from "@stores/contextMenuStore";
import { clsx } from "clsx";
import { useContext, type ReactNode } from "react";

export default function LinkElement(props: { children?: ReactNode; url?: string; noWrapping?: boolean }) {
   const { openUrl } = useOpen();
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);

   return (
      <span
         onContextMenu={(e) => (context.options?.disableContextMenu ? undefined : open({ message: context.message, url: props.url }, e))}
         className={clsx("relative inline-block cursor-pointer underline", props.noWrapping && "h-max w-full")}
         onClick={() => (props.url && !props.noWrapping ? openUrl(props.url) : undefined)}
         title={props.url}
      >
         <div className={clsx("text inline-block w-full", props.noWrapping && "overflow-clip text-ellipsis whitespace-nowrap")}>
            {props.children}
            {!props.noWrapping && <div className="hover:bg-text/20 absolute inset-0 -mx-0.5 rounded-xs" />}
         </div>
      </span>
   );
}
