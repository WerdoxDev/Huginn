import { SettingsTabProps } from "@/types";
import AnimatedMessage from "@components/AnimatedMessage";
import HuginnButton from "@components/button/HuginnButton";
import HuginnInput from "@components/input/HuginnInput";
import { useClient } from "@contexts/apiContext";
import { useInputs } from "@hooks/useInputs";
import useUniqueUsernameMessage from "@hooks/useUniqueUsernameMessage";

export default function SettingsProfileTab(props: SettingsTabProps) {
   const client = useClient();
   const { inputsProps, values } = useInputs([
      { name: "username", required: true, default: client.user?.username },
      { name: "displayName", required: true, default: client.user?.displayName },
   ]);

   const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, "username");

   return (
      <div className="flex flex-col h-full">
         <div className="flex gap-x-4 items-start h-full">
            <div className="bg-secondary rounded-md p-4 flex-shrink-0">
               <div className="w-24 h-24 bg-primary rounded-full"></div>
            </div>
            <div className="bg-secondary rounded-md p-4 flex flex-col gap-y-5 w-full">
               <HuginnInput
                  {...inputsProps.username}
                  className="[&_input]:lowercase"
                  onFocus={focused => {
                     onFocusChanged(focused);
                  }}
                  status={{ code: "none", text: "" }}
                  inputProps={{ className: "!bg-background" }}
               >
                  <HuginnInput.Label>Username</HuginnInput.Label>
                  <HuginnInput.After>
                     <AnimatedMessage className="mt-1" {...usernameMessageDetail} />
                  </HuginnInput.After>
               </HuginnInput>
               <HuginnInput
                  {...inputsProps.displayName}
                  status={{ code: "none", text: "" }}
                  inputProps={{ className: "!bg-background" }}
               >
                  <HuginnInput.Label>Display name</HuginnInput.Label>
               </HuginnInput>
            </div>
         </div>
         <div className="flex w-full gap-x-2 justify-end bg-secondary p-4 rounded-md">
            <HuginnButton className="bg-background py-2 disabled:bg-background/50 w-32">Revert</HuginnButton>
            <HuginnButton className="bg-primary py-2 disabled:bg-primary/50 w-32">Save</HuginnButton>
         </div>
      </div>
   );
}
