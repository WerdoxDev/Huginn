import type { RenderElementProps } from "slate-react";
import type { LinkElement as SlateLinkElement } from "@/index";
import { useContextMenu } from "@stores/contextMenuStore";
import { MessageContext } from "@contexts/messageProvider";
import { useContext } from "react";
import { useOpen } from "@hooks/useOpen";

export default function LinkElement(props: RenderElementProps) {
   const { openUrl } = useOpen();
   const { url } = props.element as SlateLinkElement;
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);

   return (
      <span
         onContextMenu={(e) => open({ message: context.message, url }, e)}
         {...props.attributes}
         className="relative inline-block cursor-pointer underline"
         onClick={() => (url ? openUrl(url) : undefined)}
         title={url}
      >
         <div>
            {props.children}
            <div className="rounded-xs hover:bg-text/20 absolute inset-0 -mx-0.5" />
         </div>
      </span>
   );
}
