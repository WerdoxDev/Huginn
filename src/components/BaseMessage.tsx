import { APIMessageUser } from "@shared/api-types";
import { useMemo } from "react";
import { client } from "../lib/api";
import UserIconWithStatus from "./UserIconWithStatus";

export default function BaseMessage(props: { content?: string; author: APIMessageUser }) {
   const isSelf = useMemo(() => props.author.id === client.user?.id, [props.author]);

   return (
      <li className="group rounded-lg p-2 hover:bg-secondary">
         <div className={`flex flex-col gap-y-2 ${!isSelf && "ml-2"}`}>
            <div className="flex w-full items-center rounded-xl">
               <UserIconWithStatus status-size="0.5rem" size="1.75rem" className="mr-2 bg-background" />
               <div className="text-sm text-text">{isSelf ? "You" : props.author.displayName}</div>
            </div>
            <div className="flex flex-col items-start gap-y-0.5">
               <div
                  className={`min-w-0 rounded-bl-md rounded-br-md rounded-tr-md px-2 py-1 text-white ${isSelf ? "bg-primary bg-opacity-50" : "bg-background"}`}
               >
                  {/* <LexicalComposer :initial-config="config">
                  <LexicalPlainTextPlugin>
                     <template #contentEditable>
                        <LexicalContentEditable className="editor-input" />
                     </template>
                  </LexicalPlainTextPlugin>
               </LexicalComposer> */}
                  {props.content}
               </div>
               {/* <!-- <div className="bg-accent1 bg-opacity-50 px-2 py-1 text-white">asd</div> --> */}
               {/* <!-- <div className="rounded-bl-md rounded-br-md bg-accent1 bg-opacity-50 px-2 py-1 text-white">asd</div> --> */}
            </div>
         </div>
      </li>
   );
}
