import type { PresenceStatus } from "@huginnjs/shared";

import { HuginnMenu } from "@components/dropdown/HuginnMenu";
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
import { useState } from "react";

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
   const { session } = usePresenceStore();
   const editSettingsMutation = useEditSettings();
   const [isHovered, setIsHovered] = useState(false);

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
      client?.gateway.updatePresence({ status, activities: session.activities, overallStatus: true });
      editSettingsMutation.mutate({ status });
   }

   return (
      <div className="flex h-19 w-full shrink-0 items-center py-2 pr-2">
         <div className="bg-surface-alt flex h-full w-full items-center justify-center rounded-xl p-1.5">
            <HuginnMenu>
               <HuginnMenu.Trigger asChild>
                  <div
                     className="flex h-full w-full cursor-pointer items-center rounded-lg px-2 outline-none hover:bg-white/5 active:bg-white/5"
                     onMouseEnter={() => setIsHovered(true)}
                     onMouseLeave={() => setIsHovered(false)}
                  >
                     <UserAvatar
                        userId={props.user.id}
                        avatarHash={props.user.avatar}
                        className="mr-3 shrink-0"
                        animatedMode="hover"
                        hovered={isHovered}
                     />

                     <div className="mr-1 flex w-full flex-col items-start gap-y-0.5 overflow-hidden">
                        <div className="text-text w-full truncate text-sm">{props.user.displayName}</div>
                        <div className="text-text/70 w-full truncate text-xs">{props.user.username}</div>
                     </div>
                     <div className="flex shrink-0 items-center gap-x-1">
                        <UserActionButton
                           tooltip="Mute"
                           onClick={toggleMute}
                           hoverColor="surface-alt"
                           activeHoverColor="negative"
                           activeColor="negative"
                           isActive={localVoiceState.isAudioMuted}
                        >
                           {localVoiceState.isAudioMuted ? <IconMingcuteMicOffFill className="size-5" /> : <IconMingcuteMicFill className="size-5" />}
                        </UserActionButton>
                        <UserActionButton
                           tooltip="Deafen"
                           onClick={toggleDeafen}
                           hoverColor="surface-alt"
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
                        <UserActionButton
                           tooltip="Settings"
                           hoverColor="surface-alt"
                           onClick={openSettings}
                           innerClassName="group-hover:rotate-60 group-active:rotate-60"
                        >
                           <IconMingcuteSettings5Fill className="size-6 transition-all" />
                        </UserActionButton>
                     </div>
                  </div>
               </HuginnMenu.Trigger>

               <HuginnMenu.Content className="w-64" sideOffset={8}>
                  <UserProfilePreview userId={props.user.id} textMaxWidth={150} />
                  <HuginnMenu.Separator />
                  <HuginnMenu.Item label="View Profile" onClick={handleViewProfile} />
                  <HuginnMenu.Separator />
                  <HuginnMenu.Item
                     label="Logout"
                     color="negative"
                     endSlot={<IconMingcuteExitFill className="size-5" />}
                     onClick={() => {
                        logoutMutation.mutate();
                     }}
                  />
                  <HuginnMenu.Separator />
                  <HuginnMenu.Item
                     label="Copy User ID"
                     onClick={() => navigator.clipboard.writeText(props.user.id)}
                     endSlot={<IconMingcuteIdcardFill className="size-5" />}
                  />
                  <HuginnMenu.Submenu
                     label={PRESENCE_STATUS_MAP[presence?.status ?? "offline"].text}
                     endSlot={<div className={clsx("size-3 rounded-full", PRESENCE_STATUS_MAP[presence?.status ?? "offline"].color)} />}
                  >
                     {Object.entries(PRESENCE_STATUS_MAP)
                        .filter((x) => x[0] !== "offline")
                        .map(([key, value]) => (
                           <HuginnMenu.Item
                              key={key}
                              label={value.text}
                              onClick={() => setStatus(key as PresenceStatus)}
                              endSlot={<div className={clsx("size-3 rounded-full", value.color)} />}
                           />
                        ))}
                  </HuginnMenu.Submenu>
               </HuginnMenu.Content>
            </HuginnMenu>
         </div>
      </div>
   );
}
