import { useContextMenu } from "@stores/contextMenuStore";
import { MessageContext } from "@contexts/MessageProvider";
import { useContext, type ReactNode } from "react";
import { useOpen } from "@hooks/useOpen";

export default function LinkElement(props: { children?: ReactNode; url?: string }) {
   const { openUrl } = useOpen();
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);

   return (
      <span
         onContextMenu={(e) => open({ message: context.message, url: props.url }, e)}
         className="relative inline-block cursor-pointer underline"
         onClick={() => (props.url ? openUrl(props.url) : undefined)}
         title={props.url}
      >
         <div>
            {props.children}
            <div className="rounded-xs hover:bg-text/20 absolute inset-0 -mx-0.5" />
         </div>
      </span>
   );
}
