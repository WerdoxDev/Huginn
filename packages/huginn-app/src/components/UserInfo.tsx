import type { PresenceStatus } from "@huginn/shared";

import { DropdownMenu } from "@components/dropdown/DropdownMenu";
import { useEditSettings } from "@hooks/mutations/useEditSettings";
import { useLogout } from "@hooks/useLogout";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { PRESENCE_STATUS_MAP } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { usePresence, usePresenceStore } from "@stores/presenceStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";

import type { AppUser } from "@/types";

import UserActionButton from "./button/UserActionButton";
import UserProfilePreview from "./profile/UserProfilePreview";
import UserAvatar from "./UserAvatar";

export default function UserInfo(props: { user: AppUser }) {
   const { updateModals } = useModals();
   const client = useClient();
   const logout = useLogout();
   const { voiceState: localVoiceState } = useVoiceStore();
   const { toggleDeafen, toggleMute } = useVoiceUtils();
   const presence = usePresence(props.user.id);
   const { thisPresence } = usePresenceStore();
   const editSettingsMutation = useEditSettings();

   const logoutMutation = useMutation({
      async mutationFn() {
         await logout();
      },
   });

   function openSettings() {
      updateModals({ settings: { isOpen: true } });
   }

   function handleViewProfile() {
      updateModals({ userProfile: { isOpen: true, userId: props.user.id } });
   }

   function setStatus(status: PresenceStatus) {
      client?.gateway.updatePresence({ status, activities: thisPresence.activities });
      editSettingsMutation.mutate({ status });
   }

   return (
      <div className="flex h-16 w-62 shrink-0 items-center lg:w-64">
         <DropdownMenu>
            <DropdownMenu.Trigger asChild>
               <div className="flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white/5 active:bg-white/5">
                  <UserAvatar userId={props.user.id} avatarHash={props.user.avatar} className="mr-3 shrink-0" />

                  <div className="mr-1 flex w-full flex-col items-start gap-y-0.5 overflow-hidden">
                     <div className="text-text w-full truncate text-sm">{props.user.displayName}</div>
                     <div className="text-text/70 w-full truncate text-xs">{props.user.username}</div>
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
                     <UserActionButton tooltip="Settings" onClick={openSettings} innerClassName="group-hover:rotate-60 group-active:rotate-60">
                        <IconMingcuteSettings5Fill className="size-6 transition-all" />
                     </UserActionButton>
                  </div>
               </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="w-64" sideOffset={8}>
               <UserProfilePreview userId={props.user.id} maxWidth={134} />
               <DropdownMenu.Separator />
               <DropdownMenu.Item onClick={handleViewProfile}>View Profile</DropdownMenu.Item>
               <DropdownMenu.Separator />
               <DropdownMenu.Item
                  color="negative"
                  endSlot={<IconMingcuteExitFill className="size-5" />}
                  onClick={() => {
                     logoutMutation.mutate();
                  }}
               >
                  Logout
               </DropdownMenu.Item>
               <DropdownMenu.Separator />
               <DropdownMenu.Item
                  onClick={() => navigator.clipboard.writeText(props.user.id)}
                  endSlot={<IconMingcuteIdcardFill className="size-5" />}
               >
                  Copy User ID
               </DropdownMenu.Item>
               <DropdownMenu.Submenu
                  label={PRESENCE_STATUS_MAP[presence?.status ?? "offline"].text}
                  endSlot={<div className={clsx("size-3 rounded-full", PRESENCE_STATUS_MAP[presence?.status ?? "offline"].color)} />}
               >
                  {Object.entries(PRESENCE_STATUS_MAP).map(([key, value]) => (
                     <DropdownMenu.Item
                        key={key}
                        onClick={() => setStatus(key as PresenceStatus)}
                        endSlot={<div className={clsx("size-3 rounded-full", value.color)} />}
                     >
                        {value.text}
                     </DropdownMenu.Item>
                  ))}
               </DropdownMenu.Submenu>
            </DropdownMenu.Content>
         </DropdownMenu>
      </div>
   );
}
