import HuginnButton from "@components/button/HuginnButton";
import DialogBody from "@components/DialogBody";
import LoadingIcon from "@components/LoadingIcon";
import MemberSince from "@components/MemberSince";
import ProfileBadges from "@components/ProfileBadges";
import RoamingHuginnIcon from "@components/RoamingHuginnIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useUser, useUserProfile } from "@hooks/api-hooks/userHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useCreateRelationship } from "@hooks/mutations/useCreateRelationship";
import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Suspense, useMemo } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";

function ProfileContent({ userId }: { userId: string }) {
   const profile = useUserProfile(userId);
   const user = useUser(profile.userId);
   const client = useClient();
   const { updateModals } = useModals();
   const { data: relationships } = useQuery(getRelationshipsOptions(client!));

   const createDM = useCreateDMChannel("create-dm-channel_other");
   const createRelationship = useCreateRelationship();
   const removeRelationship = useRemoveRelationship();

   const bannerColor = user.bannerColor;
   const isSelf = client?.currentUser?.id === userId;

   const relationship = useMemo(() => relationships?.find((r) => r.userId === userId), [relationships, userId]);

   const friendTooltip = useMemo(() => {
      switch (relationship?.type) {
         case RelationshipType.FRIEND:
            return "Remove Friend";
         case RelationshipType.PENDING_OUTGOING:
            return "Cancel Friend Request";
         case RelationshipType.PENDING_INCOMING:
            return "Accept Friend Request";
         default:
            return "Add Friend";
      }
   }, [relationship]);

   function handleMessage() {
      updateModals({ userProfile: { isOpen: false } });
      createDM.mutate({ recipients: [userId] });
   }

   function handleFriendAction() {
      if (relationship?.type === RelationshipType.FRIEND || relationship?.type === RelationshipType.PENDING_OUTGOING) {
         removeRelationship.mutate(userId);
      } else {
         createRelationship.mutate({ userId });
      }
   }

   return (
      <div className="bg-surface-alt border-primary-500 relative mb-2 flex flex-col overflow-hidden rounded-lg border-2">
         <div className={clsx("relative", bannerColor ? "h-20" : "h-0")} style={{ backgroundColor: bannerColor || undefined }} />
         <RoamingHuginnIcon />
         <div className={clsx("flex items-start gap-x-4 px-4", bannerColor ? "h-26 py-0" : "py-4")}>
            <div className={clsx("group relative z-10 shrink-0", bannerColor ? "-mt-3" : "mt-0")}>
               <div className="bg-surface-alt border-surface-alt rounded-full border-4">
                  <UserAvatar userId={user?.id} avatarHash={user?.avatar} size="5rem" statusSize="1.25rem" className="" />
               </div>
            </div>
            <div className="relative flex flex-col pt-2">
               <div className="truncate text-lg font-semibold text-white">{user?.displayName}</div>
               <div className="text-text truncate text-sm">{user?.username}</div>
               {user && <ProfileBadges badges={profile.badges} />}
            </div>
            <div className={clsx("ml-auto flex h-full shrink-0 flex-col gap-y-1 pt-3")}>
               <MemberSince userId={user?.id} />
            </div>
         </div>
         <div className="flex items-center gap-x-2 px-4 pb-4">
            <HuginnButton
               color="primary"
               className="flex h-8 w-36 items-center justify-center gap-x-2 text-sm font-medium"
               onClick={handleMessage}
               disabled={createDM.isPending}
            >
               {isSelf ? <IconMingcuteEdit2Fill className="size-4" /> : <IconMingcuteMessage1Fill className="size-4" />}
               {isSelf ? "Edit Profile" : "Send Message"}
            </HuginnButton>
            {!isSelf && (
               <Tooltip>
                  <Tooltip.Trigger
                     className="bg-surface hover:bg-surface/80 flex size-8 shrink-0 items-center justify-center rounded-md text-white transition-colors disabled:cursor-not-allowed"
                     onClick={handleFriendAction}
                     disabled={createRelationship.isPending || removeRelationship.isPending}
                  >
                     {relationship?.type === RelationshipType.FRIEND ? (
                        <IconMingcuteUserXFill className="size-4" />
                     ) : relationship?.type === RelationshipType.PENDING_INCOMING ? (
                        <IconMingcuteUserFollow2Fill className="size-4" />
                     ) : relationship?.type === RelationshipType.PENDING_OUTGOING ? (
                        <IconMingcuteUserXFill className="size-4" />
                     ) : (
                        <IconMingcuteUserAdd2Fill className="size-4" />
                     )}
                  </Tooltip.Trigger>
                  <Tooltip.Content>{friendTooltip}</Tooltip.Content>
               </Tooltip>
            )}
         </div>
         <div className="bg-surface mx-2 h-0.5" />
         <div className="p-10">
            <div className="text-white/80 italic">More stuff later...</div>
         </div>
      </div>
   );
}

export default function UserProfileModal() {
   const { userProfile: modal } = useModals();

   return (
      <HuginnDialogPanel className="w-full max-w-md overflow-hidden" headless>
         <Suspense
            fallback={
               <div className="bg-surface-alt flex h-48 items-center justify-center rounded-lg">
                  <LoadingIcon className="size-10" />
               </div>
            }
         >
            <DialogBody className="p-0!">{modal.isOpen && <ProfileContent userId={modal.userId} />}</DialogBody>
         </Suspense>
      </HuginnDialogPanel>
   );
}
