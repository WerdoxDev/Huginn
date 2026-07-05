import type { RenderElementProps } from "slate-react";

import { useMaybeUser } from "@hooks/api-hooks/userHooks";

import type { MentionElement } from "@/index";

export default function PreviewMentionElement(props: RenderElementProps) {
   const element = props.element as MentionElement;

   const user = useMaybeUser(element.mentionType === "user" ? element.userId : undefined);

   return (
      <span
         {...props.attributes}
         contentEditable={false}
         className="ring-primary-500 inline-block rounded px-1 align-baseline text-white ring-1 [&>span]:hidden"
      >
         {element.mentionType === "user" && "@" + (user?.displayName ?? "unknown-user")}
         {(element.mentionType === "everyone" || element.mentionType === "owner") && "@" + element.usedText}
         {props.children}
      </span>
   );
}
