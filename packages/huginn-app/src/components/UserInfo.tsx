import { useLogout } from "@hooks/useLogout";
import { useModals } from "@stores/modalsStore";
import { useMutation } from "@tanstack/react-query";
import DropdownMenu from "./dropdown/DowndownMenu";
import UserAvatar from "./UserAvatar";
import UserActionButton from "./button/UserActionButton";
import { useVoiceStore } from "@stores/voiceStore";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import type { AppUser } from "@/types";
export default function UserInfo(props: { user: AppUser }) {
   const { updateModals } = useModals();
   const logout = useLogout();
   const { localVoiceState } = useVoiceStore();
   const { toggleDeafen, toggleMute } = useVoiceUtils();

   const logoutMutation = useMutation({
      async mutationFn() {
         await logout();
      },
   });

   function openSettings() {
      updateModals({ settings: { isOpen: true } });
   }

   return (
      <div className="flex h-16 w-64 shrink-0 items-center">
         <DropdownMenu className="flex w-full items-center justify-center">
            <DropdownMenu.Button as="div" className="flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white/5">
               <UserAvatar userId={props.user.id} avatarHash={props.user.avatar} className="mr-3 shrink-0" />

               <div className="flex w-full flex-col items-start gap-y-0.5">
                  <div className="text-text text-sm">{props.user.displayName}</div>
                  <div className="text-text/70 text-xs">Online</div>
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
                  {/* <Tooltip>
                     <Tooltip.Trigger
                        className="group/setting hover:bg-surface rounded-lg p-1"
                        onClick={openSettings}
                        onPointerDown={(e) => {
                           e.stopPropagation();
                        }}
                     >
                        <IconMingcuteSettings5Fill className="group-hover/setting:rotate-60 size-6 text-white/80 transition-all" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>User Settings</Tooltip.Content>
                  </Tooltip> */}
               </div>
            </DropdownMenu.Button>

            <DropdownMenu.Items className="w-60 [--anchor-gap:8px]" anchor="top">
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
            </DropdownMenu.Items>
         </DropdownMenu>
      </div>
   );
}
