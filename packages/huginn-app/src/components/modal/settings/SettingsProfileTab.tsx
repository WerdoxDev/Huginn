import HuginnButton from "@components/button/HuginnButton";
import HuginnLabel from "@components/HuginnLabel";
import ProfileBadges from "@components/ProfileBadges";
import { useUserProfile } from "@hooks/api-hooks/userHooks";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useEffectSkipMount } from "@hooks/useEffectSkipMount";
import { useFileDialog } from "@hooks/useFileDialog";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useThrottler } from "@hooks/useThrottler";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Suspense, useEffect, useRef, useState } from "react";

import type { SettingsTabProps } from "@/types";

import RoamingHuginnIcon from "../../RoamingHuginnIcon";

type EditingField = "username" | "displayName" | "email" | "password";

export default function SettingsProfileTab(props: SettingsTabProps) {
   const client = useClient();
   const { user, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const isOAuth = useIsOAuth();
   const { openFileDialog } = useFileDialog("image/*");

   const { data: originalAvatar } = useQuery(getUserAvatarOptions(user?.id, user?.avatar, client));
   const [bannerColor, setBannerColor] = useState(() => user?.bannerColor ?? "");
   const lastColorRef = useRef<string>(user?.bannerColor || "#1abc9c");
   const { throttledFunction: updateBannerColorThrottled } = useThrottler(() => mutation.mutate({ bannerColor: bannerColor || null }), 1000);

   const mutation = usePatchUser(undefined, () => {
      updateModals({ imageCrop: { isOpen: false } });
      return false;
   });

   useEffect(() => {
      if (user?.bannerColor !== undefined) {
         setBannerColor(user.bannerColor ?? "");
      }
   }, [user?.bannerColor]);

   useEffectSkipMount(() => {
      if (bannerColor) lastColorRef.current = bannerColor;
      updateBannerColorThrottled();
   }, [bannerColor]);

   function handleToggleBanner() {
      setBannerColor(bannerColor ? "" : lastColorRef.current);
   }

   async function handleEditField(field: EditingField) {
      if (field === "username") updateModals({ changeUsername: { isOpen: true } });
      else if (field === "displayName") updateModals({ changeDisplayName: { isOpen: true } });
      else if (field === "email") updateModals({ changeEmail: { isOpen: true } });
      else if (field === "password") updateModals({ changePassword: { isOpen: true } });
   }

   async function handleEditAvatar() {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            callback: async (data) => {
               await mutation.mutateAsync({ avatar: data });
            },
         },
      });
   }

   function handleDeleteAvatar() {
      if (originalAvatar) {
         updateModals({
            info: {
               isOpen: true,
               status: "info",
               title: "Remove Avatar",
               text: "Are you sure you want to remove your profile picture?",
               isClosable: true,
               action: {
                  cancel: {
                     text: "Cancel",
                     callback: () => {
                        updateModals({ info: { isOpen: false } });
                     },
                  },
                  confirm: {
                     text: "Remove",
                     callback: async () => {
                        await mutation.mutateAsync({ avatar: null });
                        updateModals({ info: { isOpen: false } });
                     },
                  },
               },
            },
         });
      }
   }

   return (
      <div className="flex w-full items-center justify-center gap-x-5">
         <div className="w-full max-w-lg">
            <div className="bg-surface-alt relative mb-2 overflow-hidden rounded-lg">
               <div className={clsx("relative transition-all", bannerColor ? "h-14" : "h-0")} style={{ backgroundColor: bannerColor || undefined }} />
               <RoamingHuginnIcon />
               <div className={clsx("flex items-start gap-x-4 px-4 transition-[padding_height]", bannerColor ? "h-26 py-0" : "py-4")}>
                  <div className={clsx("group relative z-10 shrink-0 transition-[margin]", bannerColor ? "-mt-3" : "mt-0")}>
                     <div className="bg-surface-alt border-surface-alt rounded-full border-4">
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                           {originalAvatar ? (
                              <img alt="user-avatar" className="size-20 object-cover" src={originalAvatar} />
                           ) : (
                              <div className="bg-primary-700 size-20" />
                           )}
                           <button
                              type="button"
                              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={handleEditAvatar}
                           >
                              <IconMingcuteEdit2Fill className="size-5 text-white" />
                           </button>
                        </div>
                     </div>
                     {originalAvatar && (
                        <button
                           className="hover:bg-negative-600 absolute bottom-1 left-1/2 -translate-x-1/2 cursor-pointer rounded-full px-1.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                           onClick={handleDeleteAvatar}
                        >
                           <IconMingcuteDelete3Fill className="size-3 text-white" />
                        </button>
                     )}
                  </div>
                  <div className="relative flex flex-col pt-2">
                     <div className="truncate text-lg font-semibold text-white">{user?.displayName}</div>
                     <div className="text-text truncate text-sm">{user?.username}</div>
                     {user && (
                        <Suspense>
                           <CurrentUserBadges userId={user.id} />
                        </Suspense>
                     )}
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-y-1 pt-2">
                     <div className="mr-3 mb-1 flex items-center gap-x-1.5">
                        <HuginnLabel className="mb-0!">Banner Color</HuginnLabel>
                        <button type="button" className="text-text/50 hover:text-text cursor-pointer transition-colors" onClick={handleToggleBanner}>
                           {bannerColor ? <IconMingcuteEyeLine className="size-3.5" /> : <IconMingcuteEyeCloseLine className="size-3.5" />}
                        </button>
                     </div>
                     <div className="grid grid-cols-5 gap-1.5">
                        {accentPresets.map((color) => (
                           <button
                              key={color}
                              type="button"
                              className="size-5 cursor-pointer rounded-full transition-all hover:scale-110"
                              style={{
                                 backgroundColor: color,
                                 boxShadow:
                                    bannerColor === color ? "0 0 0 2px var(--tcolor-surface-alt), 0 0 0 3.5px rgba(255,255,255,0.8)" : undefined,
                              }}
                              onClick={() => setBannerColor(color)}
                           />
                        ))}
                        <label
                           className="flex size-5 cursor-pointer items-center justify-center rounded-full"
                           style={{ background: "conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
                        >
                           <input
                              type="color"
                              className="invisible absolute size-0"
                              value={bannerColor}
                              onChange={(e) => setBannerColor(e.target.value)}
                           />
                        </label>
                     </div>
                  </div>
               </div>
            </div>
            <div className="bg-surface-alt rounded-lg p-4">
               <div className="flex flex-col">
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Username</HuginnLabel>
                        <div className="text-white">{user?.username}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("username")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full"></div>
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Display Name</HuginnLabel>
                        <div className="text-white">{user?.displayName}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("displayName")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full"></div>
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Email</HuginnLabel>
                        <div className="text-white">{user?.email}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("email")} />
                  </div>
                  {!isOAuth && (
                     <>
                        <div className="bg-surface my-4 h-px w-full"></div>
                        <div className="flex w-full items-center justify-between gap-x-2">
                           <div className="flex w-full flex-col items-start justify-center">
                              <HuginnLabel className="mb-0!">Password</HuginnLabel>
                              <div className="text-white">****</div>
                           </div>
                           <ChangeButton onClick={() => handleEditField("password")} />
                        </div>
                     </>
                  )}
                  <div className="bg-surface my-4 h-px w-full"></div>
                  <div className="text-text/50 text-xs uppercase">
                     Auth method: <span className="font-semibold">{tokenPayload?.authType}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function ChangeButton(props: { onClick?: () => void }) {
   return (
      <HuginnButton className="px-3 py-1.5" color="surface" onClick={props.onClick}>
         Change
      </HuginnButton>
   );
}

function CurrentUserBadges({ userId }: { userId: string }) {
   const profile = useUserProfile(userId);
   return <ProfileBadges badges={profile.badges} />;
}

const accentPresets = ["#00dabd", "#00bbea", "#9b59b6", "#e91e63", "#e74c3c", "#e67e22", "#f1c40f", "#a3804f", "#517889"];
