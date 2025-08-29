import { useLogout } from "@hooks/useLogout";
import { useModals } from "@stores/modalsStore";
import { useMutation } from "@tanstack/react-query";
import UserAvatar from "./UserAvatar";
import UserActionButton from "./button/UserActionButton";
import { useVoiceStore } from "@stores/voiceStore";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import type { AppUser } from "@/types";
import { DropdownMenu } from "./dropdown/DropdownMenu";
import type { PresenceStatus } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { presenceStatuses } from "@lib/utils";
import clsx from "clsx";
import { usePresence, usePresenceStore } from "@stores/presenceStore";
export default function UserInfo(props: { user: AppUser }) {
   const { updateModals } = useModals();
   const client = useClient();
   const logout = useLogout();
   const { localVoiceState } = useVoiceStore();
   const { toggleDeafen, toggleMute } = useVoiceUtils();
   const presence = usePresence(props.user.id);
   const { updatePresence } = usePresenceStore();

   const logoutMutation = useMutation({
      async mutationFn() {
         await logout();
      },
   });

   function openSettings() {
      updateModals({ settings: { isOpen: true } });
   }

   function setStatus(status: PresenceStatus) {
      client?.gateway.updatePresence({ status });
      updatePresence(props.user.id, { status });
   }

   return (
      <div className="flex h-16 w-64 shrink-0 items-center">
         <DropdownMenu className="flex w-full items-center justify-center">
            <DropdownMenu.Button className="flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white/5">
               <UserAvatar userId={props.user.id} avatarHash={props.user.avatar} className="mr-3 shrink-0" />

               <div className="flex w-full flex-col items-start gap-y-0.5">
                  <div className="text-text text-sm">{props.user.displayName}</div>
                  <div className="text-text/70 text-xs">{props.user.username}</div>
               </div>
               <div className="flex shrink-0 items-center gap-x-1">
                  <UserActionButton
                     tooltip="Mute"
                     onClick={toggleMute}
                     hoverColor="surface"
                     activeHoverColor="negative"
                     activeColor="negative"
                     isActive={localVoiceState.isAudioMuted}
                  >
                     {localVoiceState.isAudioMuted ? <IconMingcuteMicOffFill className="size-5" /> : <IconMingcuteMicFill className="size-5" />}
                  </UserActionButton>
                  <UserActionButton
                     tooltip="Deafen"
                     onClick={toggleDeafen}
                     hoverColor="surface"
                     activeHoverColor="negative"
                     activeColor="negative"
                     isActive={localVoiceState.isAudioDeafened}
                  >
                     {localVoiceState.isAudioDeafened ? (
                        <IconMingcuteVolumeOffFill className="size-5" />
                     ) : (
                        <IconMingcuteVolumeFill className="size-5" />
                     )}
                  </UserActionButton>
                  <UserActionButton tooltip="Settings" onClick={openSettings} innerClassName="group-hover:rotate-60">
                     <IconMingcuteSettings5Fill className="size-6 transition-all" />
                  </UserActionButton>
               </div>
            </DropdownMenu.Button>

            <DropdownMenu.Items className="w-60">
               <DropdownMenu.Item
                  label="Logout"
                  color="negative"
                  onClick={() => {
                     logoutMutation.mutate();
                  }}
               >
                  <IconMingcuteExitFill className="size-5" />
               </DropdownMenu.Item>
               <DropdownMenu.Divider />
               <DropdownMenu.Item onClick={() => navigator.clipboard.writeText(props.user.id)} label="Copy User ID">
                  <IconMingcuteIdcardFill className="size-5" />
               </DropdownMenu.Item>
               <DropdownMenu>
                  <DropdownMenu.Item label={presenceStatuses[presence?.status ?? "offline"].text} isNested>
                     <div className={clsx("size-3 rounded-full", presenceStatuses[presence?.status ?? "offline"].color)} />
                  </DropdownMenu.Item>
                  <DropdownMenu.Items>
                     {Object.entries(presenceStatuses).map(([key, value]) => (
                        <DropdownMenu.Item key={key} label={value.text} onClick={() => setStatus(key as PresenceStatus)}>
                           <div className={clsx("size-3 rounded-full", value.color)} />
                        </DropdownMenu.Item>
                     ))}
                  </DropdownMenu.Items>
               </DropdownMenu>
            </DropdownMenu.Items>
         </DropdownMenu>
      </div>
   );
}
