import HuginnButton from "@components/button/HuginnButton";
import DialogBody from "@components/DialogBody";
import LoadingIcon from "@components/LoadingIcon";
import MemberSince from "@components/MemberSince";
import { ProfileAboutMe, ProfileActivity } from "@components/profile/ProfileComponents";
import ProfileBadges from "@components/ProfileBadges";
import RoamingHuginnIcon from "@components/RoamingHuginnIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useUser, useUserProfile } from "@hooks/api-hooks/userHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useCreateRelationship } from "@hooks/mutations/useCreateRelationship";
import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { ActivityType, RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions, getUserBannerOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { usePresence } from "@stores/presenceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Suspense, useMemo } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";

function ProfileBanner(props: { userId: string; banner?: string | null; bannerColor?: string | null }) {
   const client = useClient();
   const { data: bannerImage } = useQuery(getUserBannerOptions(props.userId, props.banner, client));

   if (bannerImage) {
      return (
         <div className="relative h-32 w-full overflow-hidden">
            <img src={bannerImage} alt="profile-banner" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
         </div>
      );
   }

   if (props.bannerColor) {
      return (
         <div className="relative h-20 w-full" style={{ backgroundColor: props.bannerColor }}>
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
         </div>
      );
   }

   return null;
}

function ActivityCard(props: { userId: string; accentColor: string }) {
   const presence = usePresence(props.userId);
   const activity = presence?.activities?.[0];

   if (!activity) return null;

   const elapsed = activity.startedAt ? Math.floor((Date.now() - activity.startedAt) / 60000) : undefined;
   const elapsedText = elapsed !== undefined ? (elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`) : undefined;
   const type = activity.type === ActivityType.PLAYING ? "Playing a Game" : "Listening";

   return <ProfileActivity type={type} name={activity.name} iconUrl={activity.iconUrl} elapsedText={elapsedText} accentColor={props.accentColor} />;
}

function ProfileContent(props: { userId: string }) {
   const profile = useUserProfile(props.userId);
   const user = useUser(profile.userId);
   const client = useClient();
   const { updateModals } = useModals();
   const { data: relationships } = useQuery(getRelationshipsOptions(client!));

   const createDM = useCreateDMChannel("create-dm-channel_other");
   const createRelationship = useCreateRelationship();
   const removeRelationship = useRemoveRelationship();
   const presence = usePresence(props.userId);

   const bannerColor = user.bannerColor;
   const hasBanner = !!user.banner || !!bannerColor;
   const accentColor = user.accentColor ?? "";
   const isSelf = client?.currentUser?.id === props.userId;

   const relationship = useMemo(() => relationships?.find((r) => r.userId === props.userId), [relationships, props.userId]);

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

   function handleEditProfile() {
      updateModals({ userProfile: { isOpen: false } });
      updateModals({ settings: { isOpen: true } });
   }

   function handleMessage() {
      updateModals({ userProfile: { isOpen: false } });
      createDM.mutate({ recipients: [props.userId] });
   }

   function handleFriendAction() {
      if (relationship?.type === RelationshipType.FRIEND || relationship?.type === RelationshipType.PENDING_OUTGOING) {
         removeRelationship.mutate(props.userId);
      } else {
         createRelationship.mutate({ userId: props.userId });
      }
   }

   const hasLowerContent = !!user.bio || !!presence?.activities?.[0];

   return (
      <div className="bg-surface-alt relative mb-2 flex flex-col overflow-hidden rounded-lg border-2" style={{ borderColor: accentColor }}>
         <ProfileBanner userId={user?.id} banner={user?.banner} bannerColor={bannerColor} />
         <RoamingHuginnIcon />

         <div className={clsx("flex items-start gap-x-4 px-5 pb-5", hasBanner ? "pt-0" : "pt-5")}>
            <div className="flex flex-col gap-y-2">
               <div className={clsx("relative z-10 shrink-0", hasBanner ? "-mt-11" : "mt-0")}>
                  <div className="border-surface-alt rounded-full border-4">
                     <UserAvatar userId={user?.id} avatarHash={user?.avatar} size="5.5rem" statusSize="1.25rem" />
                  </div>
               </div>
               <div className="relative flex min-w-0 flex-col pl-1">
                  <div className="truncate text-lg font-semibold text-white">{user?.displayName}</div>
                  <div className="text-text truncate text-sm">{user?.username}</div>
                  {/* {user && <ProfileBadges badges={profile.badges} />} */}
               </div>
            </div>
            <div className="ml-auto flex h-full shrink-0 flex-col gap-y-1 pt-3">
               <MemberSince userId={user?.id} />
            </div>
         </div>

         <div className="flex items-center gap-x-2 px-5 pb-5">
            {isSelf ? (
               <HuginnButton
                  color="primary"
                  className="flex h-8 w-36 items-center justify-center gap-x-2 text-sm font-medium"
                  onClick={handleEditProfile}
               >
                  <IconMingcuteEdit2Fill className="size-4" />
                  Edit Profile
               </HuginnButton>
            ) : (
               <>
                  <HuginnButton
                     color="primary"
                     className="flex h-8 w-36 items-center justify-center gap-x-2 text-sm font-medium"
                     onClick={handleMessage}
                     disabled={createDM.isPending}
                  >
                     <IconMingcuteMessage1Fill className="size-4" />
                     Send Message
                  </HuginnButton>
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
               </>
            )}
         </div>

         {hasLowerContent && (
            <>
               <div className="mx-5 h-0.5" style={{ backgroundColor: `${accentColor}33` }} />
               <div className="flex flex-col gap-y-5 p-5">
                  {user.bio && (
                     <ProfileAboutMe accentColor={accentColor}>
                        <div className="text-sm leading-relaxed text-white/80">{user.bio}</div>
                     </ProfileAboutMe>
                  )}
                  <ActivityCard userId={props.userId} accentColor={accentColor} />
               </div>
            </>
         )}
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
