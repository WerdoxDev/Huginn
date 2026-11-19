import { useExpressions } from "@hooks/useExpressions";
import { resolveExpression, type ExpressionKind } from "@huginnjs/shared";
import clsx from "clsx";

import type { ContextMenuExpression } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function ExpressionSaveButton(props: { media: ContextMenuExpression; kind: ExpressionKind }) {
   const expressions = useExpressions(props.kind);
   const reference = resolveExpression(props.media);
   const saved = expressions.find(props.media);
   const label = `${saved ? "Remove from" : "Add to"} ${props.kind === "gifs" ? "GIFs" : "Stickers"}`;
   console.log(props.media);

   return (
      <Tooltip>
         <Tooltip.Trigger
            type="button"
            disabled={expressions.isPending}
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-md bg-black/80 text-white opacity-0 transition-[colors,opacity] group-hover/expression:opacity-100 hover:bg-black focus-visible:opacity-100 disabled:cursor-wait"
            onClick={(event) => {
               event.stopPropagation();
               if (saved) void expressions.remove(saved).catch(() => {});
               else if (reference) void expressions.add(reference).catch(() => {});
               else void expressions.downloadAndUpload(props.media).catch(() => {});
            }}
         >
            <IconMingcuteStarFill className={clsx("size-5", saved && "text-caution-300")} />
         </Tooltip.Trigger>
         <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip>
   );
}
