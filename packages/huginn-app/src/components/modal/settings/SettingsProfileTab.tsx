import HuginnButton from "@components/button/HuginnButton";
import HuginnLabel from "@components/HuginnLabel";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useFileDialog } from "@hooks/useFileDialog";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useOAuth } from "@hooks/useOAuth";
import { UserFlags, snowflake } from "@huginn/shared";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { animate, createScope, createTimeline, splitText, stagger, type Scope } from "animejs";
import clsx from "clsx";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SettingsTabProps } from "@/types";

type EditingField = "username" | "displayName" | "email" | "password";

export default function SettingsProfileTab(_props: SettingsTabProps) {
   const client = useClient();
   const { user, setUser, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const isOAuth = useIsOAuth();
   const { openFileDialog } = useFileDialog("image/*");

   const startOAuth = useOAuth();

   const { data: originalAvatar } = useQuery(getUserAvatarOptions(user?.id, user?.avatar, client));
   const [avatarData, setAvatarData] = useState<string | null | undefined>(() => originalAvatar);

   // const { validate } = useUniqueUsernameMessage(user?.username);

   const mutation = usePatchUser(undefined, () => {
      updateModals({ imageCrop: { isOpen: false } });
      return false;
   });

   useEffect(() => {
      if (originalAvatar) {
         setAvatarData(originalAvatar);
      }
   }, [originalAvatar]);

   useEffect(() => {
      const unlisten = client?.gateway.listen("user_update", (e) => {
         setAvatarData(e.avatar);
      });

      return () => {
         unlisten?.();
      };
   }, []);

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
               // setAvatarData(data);
            },
         },
      });
   }

   function handleDeleteAvatar() {
      if (avatarData) {
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
            <div className="bg-surface-alt relative mb-2 flex items-center gap-x-4 overflow-hidden rounded-lg p-4">
               {/* <div className="bg-primary-500/10 pointer-events-none absolute -top-6 -right-6 size-28 rounded-full blur-2xl" /> */}
               {/* <div className="bg-primary-700/15 pointer-events-none absolute -right-5 bottom-0 size-16 rounded-full blur-2xl" /> */}
               <div className="group relative shrink-0">
                  <div className="size-20 overflow-hidden rounded-full">
                     {avatarData ? (
                        <img alt="user-avatar" className="size-20 object-cover" src={avatarData} />
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
                  {avatarData && (
                     <button
                        className="hover:bg-negative-600 absolute bottom-0.5 left-1/2 -translate-x-1/2 cursor-pointer rounded-md px-1.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={handleDeleteAvatar}
                     >
                        <IconMingcuteDelete3Fill className="size-3 text-white" />
                     </button>
                  )}
               </div>
               <div className="flex flex-col">
                  <div className="truncate text-lg font-semibold text-white">{user?.displayName}</div>
                  <div className="text-text truncate text-sm">{user?.username}</div>
                  {user && <ProfileBadges flags={UserFlags.STAFF} />}
               </div>
               <div className="relative z-10 ml-auto shrink-0">{user?.id && <MemberSince userId={user.id} />}</div>
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

const flagBadges = [
   { flag: UserFlags.STAFF, label: "Staff", color: "bg-primary-700", Icon: IconMingcuteSettings5Fill },
   { flag: UserFlags.BUG_HUNTER, label: "Bug Hunter", color: "bg-positive-700", Icon: IconMingcuteBugFill },
   { flag: UserFlags.EARLY_HUGINN_SUPPORTER, label: "Early Supporter", color: "bg-caution-600", Icon: IconMingcuteGame2Fill },
] as const;

function ProfileBadges({ flags }: { flags: number }) {
   const activeBadges = flagBadges.filter((b) => (flags & b.flag) !== 0);
   if (activeBadges.length === 0) return null;

   return (
      <div className="mt-2 flex gap-x-2">
         {activeBadges.map((badge) => (
            <div key={badge.flag} title={badge.label} className={clsx(badge.color, "flex items-center gap-x-1.5 rounded-md px-2 py-1 shadow-lg")}>
               <badge.Icon className="size-4 text-white" />
               <span className="text-xs font-bold text-white">{badge.label}</span>
            </div>
         ))}
      </div>
   );
}

function MemberSince({ userId }: { userId: string }) {
   const sinceText = useRef<HTMLDivElement>(null);
   const daysText = useRef<HTMLDivElement>(null);
   const root = useRef<HTMLDivElement>(null);
   const scope = useRef<Scope>(null);

   const created = useMemo(() => {
      const ts = snowflake.getTimestamp(userId);
      return new Date(ts);
   }, [userId]);

   const daysSince = useMemo(() => {
      return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
   }, [created]);

   const formatted = useMemo(() => {
      return moment(created).format("D MMMM YYYY");
   }, [created]);

   useEffect(() => {
      if (!sinceText.current) return;

      scope.current = createScope({ root }).add(() => {
         if (!sinceText.current || !daysText.current) return;
         const { chars: sinceChars } = splitText(sinceText.current, { chars: { wrap: "clip" } });
         const { chars: daysChars } = splitText(daysText.current, { chars: { wrap: "clip" } });
         const timeline = createTimeline({ loop: true, loopDelay: 2000, delay: 1000 });
         timeline
            .label("start")
            .add(
               sinceChars,
               {
                  y: ["0rem", "-0.1rem", "0rem"],
                  loop: 1,
                  loopDelay: 50,
               },
               stagger(150, { from: "center" }),
            )
            .add(
               daysChars,
               {
                  delay: 1000,
                  y: ["0rem", "-0.1rem", "0rem"],
                  loop: 1,
                  loopDelay: 50,
               },
               stagger(150, { from: "center" }),
            );
      });

      return () => {
         scope.current?.revert();
      };
   }, []);

   return (
      <div className="flex flex-col items-end" ref={root}>
         <div className="text-text/40 text-tiny font-semibold uppercase">"Huginning" since</div>
         <div className="text-text text-sm font-medium" ref={sinceText}>
            {formatted}
         </div>
         <div className="mt-1 flex items-center gap-x-1">
            <div className="bg-positive-400 size-1.5 animate-pulse rounded-full" />
            <span className="text-positive-400 text-xs font-bold" ref={daysText}>
               {daysSince} days strong
            </span>
         </div>
      </div>
   );
}
