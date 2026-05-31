import HuginnButton from "@components/button/HuginnButton";
import { ImagePickerDeleteButton, ImagePickerEditButton } from "@components/button/ImagePickerButtons";
import HuginnLabel from "@components/HuginnLabel";
import LoadingBackground from "@components/LoadingBackground";
import LoadingIcon from "@components/LoadingIcon";
import MemberSince from "@components/MemberSince";
import { ProfileAboutMe, ProfileActivity } from "@components/profile/ProfileComponents";
import RoamingHuginnIcon from "@components/RoamingHuginnIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useFileDialog } from "@hooks/useFileDialog";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { CONSTANTS, ActivityType, type APIPatchCurrentUserJSONBody } from "@huginn/shared";
import { getUserBannerOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";

type EditingField = "username" | "displayName" | "email" | "password";

export default function SettingsProfileTab() {
   const client = useClient();
   const { user, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const isOAuth = useIsOAuth();
   const { openFileDialog } = useFileDialog("image/*");

   const { data: originalBanner, isLoading: isBannerLoading } = useQuery(getUserBannerOptions(user?.id, user?.banner, client));
   const [bannerColor, setBannerColor] = useState(() => user?.bannerColor ?? "");
   const [accentColor, setAccentColor] = useState(() => user?.accentColor ?? "");
   const [bio, setBio] = useState(() => user?.bio ?? "");
   const [isEditing, setIsEditing] = useState(false);
   const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(undefined);
   const [pendingBanner, setPendingBanner] = useState<string | null | undefined>(undefined);
   const [showBanner, setShowBanner] = useState(() => !!user?.banner || !!user?.bannerColor);

   const mutation = usePatchUser();

   useEffect(() => {
      if (!isEditing && user?.bannerColor !== undefined) {
         setBannerColor(user.bannerColor ?? "");
      }
   }, [user?.bannerColor, isEditing]);

   useEffect(() => {
      if (!isEditing && user?.accentColor !== undefined) {
         setAccentColor(user.accentColor ?? "");
      }
   }, [user?.accentColor, isEditing]);

   useEffect(() => {
      if (!isEditing && user?.bio !== undefined) {
         setBio(user.bio ?? "");
      }
   }, [user?.bio, isEditing]);

   function handleBannerColorChange(color: string) {
      setBannerColor(color);
      if (!showBanner) handleToggleBannerVisibility();
   }

   function handleAccentColorChange(color: string) {
      setAccentColor(color);
   }

   function handleToggleBannerVisibility() {
      setShowBanner(!showBanner);
   }

   function handleResetAccentColor() {
      setAccentColor("");
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
            cropType: "avatar",
            mimeType: result.mimeType,
            callback: (data) => {
               setPendingAvatar(data);
               updateModals({ imageCrop: { isOpen: false } });
            },
         },
      });
   }

   async function handleEditBanner() {
      const result = await openFileDialog();
      if (!result) return;

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: "banner",
            callback: (data) => {
               setPendingBanner(data);
               setShowBanner(true);
               updateModals({ imageCrop: { isOpen: false } });
            },
         },
      });
   }

   function handleDeleteAvatar() {
      setPendingAvatar(null);
   }

   function handleDeleteBanner() {
      setPendingBanner(null);
   }

   function handleRevertProfile() {
      setBannerColor(user?.bannerColor ?? "");
      setAccentColor(user?.accentColor ?? "");
      setBio(user?.bio ?? "");
      setPendingAvatar(undefined);
      setPendingBanner(undefined);
      setShowBanner(!!user?.banner || !!user?.bannerColor);
   }

   async function handleSaveProfile() {
      const payload: APIPatchCurrentUserJSONBody = {};

      if (bannerColor !== (user?.bannerColor ?? "")) {
         payload.bannerColor = bannerColor || null;
      }
      if (accentColor !== (user?.accentColor ?? "")) {
         payload.accentColor = accentColor || null;
      }
      if (bio !== (user?.bio ?? "")) {
         payload.bio = bio || null;
      }
      if (pendingAvatar !== undefined) {
         payload.avatar = pendingAvatar;
      }
      if (pendingBanner !== undefined) {
         payload.banner = pendingBanner;
      }

      if (!showBanner) {
         payload.banner = null;
         payload.bannerColor = null;
      }

      if (Object.keys(payload).length > 0) {
         try {
            await mutation.mutateAsync(payload);
         } catch {
            return;
         }
      }

      setPendingAvatar(undefined);
      setPendingBanner(undefined);
      setIsEditing(false);
   }

   const avatarOverride = pendingAvatar !== undefined ? pendingAvatar : undefined;
   const hasAvatarPreview = pendingAvatar !== undefined ? !!pendingAvatar : !!user?.avatar;
   const displayBanner = pendingBanner !== undefined ? pendingBanner : originalBanner;
   const isImageBannerLoading = showBanner && isBannerLoading && pendingBanner === undefined && !!user?.banner;
   const isBannerTall = !!displayBanner || isImageBannerLoading;
   const hasChanges =
      bannerColor !== (user?.bannerColor ?? "") ||
      accentColor !== (user?.accentColor ?? "") ||
      bio !== (user?.bio ?? "") ||
      pendingAvatar !== undefined ||
      pendingBanner !== undefined;

   if (!user) return;

   return (
      <div className="flex w-full items-center justify-center gap-x-5">
         <div className="relative w-full max-w-md">
            {isEditing && (
               <div className="flex flex-col gap-y-2 px-1 py-2.5">
                  <ColorSelector
                     color={bannerColor}
                     onChange={handleBannerColorChange}
                     disabled={!!displayBanner}
                     label="banner"
                     disabledReason="Remove banner image to use banner color."
                  />
                  <ColorSelector color={accentColor} onChange={handleAccentColorChange} label="accent" />
                  <div className="flex items-center gap-x-2">
                     <HuginnButton
                        type="button"
                        color="surface-alt"
                        className="flex items-center gap-x-2 self-start rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors"
                        onClick={handleToggleBannerVisibility}
                     >
                        {showBanner ? <IconMingcuteEyeLine className="size-3.5" /> : <IconMingcuteEyeCloseLine className="size-3.5" />}
                        {showBanner ? "Hide Banner" : "Show Banner"}
                     </HuginnButton>
                     <HuginnButton
                        type="button"
                        color="surface-alt"
                        className="flex items-center gap-x-2 self-start rounded-md px-3 py-1.5 text-xs font-medium text-white/80 transition-colors"
                        disabled={!accentColor}
                        onClick={handleResetAccentColor}
                     >
                        <IconMingcuteRefresh3Fill className="size-3.5" />
                        Reset Accent Color
                     </HuginnButton>
                  </div>
               </div>
            )}

            <div className="bg-surface-alt relative mb-4 overflow-hidden rounded-lg border-2" style={{ borderColor: accentColor || "transparent" }}>
               <div className={clsx("group relative transition-all", showBanner ? (isBannerTall ? "h-32" : "h-20") : "h-0")}>
                  {displayBanner ? (
                     <>
                        <img alt="user-banner" className="h-full w-full object-cover" src={displayBanner} />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                     </>
                  ) : (
                     !isImageBannerLoading && (
                        <>
                           <div className="h-full w-full" style={{ backgroundColor: bannerColor || "transparent" }} />
                           <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                        </>
                     )
                  )}
                  <LoadingBackground hasError={false} isLoaded={!isImageBannerLoading} />
                  {isEditing && (
                     <div className={clsx("absolute top-2 right-2 flex gap-x-1 transition-opacity", !showBanner ? "opacity-0" : "opacity-100")}>
                        {displayBanner && <ImagePickerDeleteButton onClick={handleDeleteBanner} />}
                        <ImagePickerEditButton onClick={handleEditBanner} />
                     </div>
                  )}
               </div>

               <RoamingHuginnIcon />

               <div className={clsx("flex items-start gap-x-4 px-5 pb-5 transition-[padding]", showBanner ? "pt-0" : "pt-5")}>
                  <div className="flex flex-col gap-y-2">
                     <div className={clsx("relative z-10 w-max shrink-0 transition-[margin]", showBanner ? "-mt-11" : "mt-0")}>
                        <div className="border-surface-alt rounded-full border-4">
                           <UserAvatar
                              userId={user.id}
                              avatarHash={user.avatar}
                              imageSrc={avatarOverride}
                              size={5.5}
                              hideStatus
                              animatedMode="always"
                           />
                        </div>
                        {isEditing && (
                           <div className="absolute -top-1 -right-1 z-20 flex gap-x-1">
                              {hasAvatarPreview && <ImagePickerDeleteButton onClick={handleDeleteAvatar} />}
                              <ImagePickerEditButton onClick={handleEditAvatar} />
                           </div>
                        )}
                     </div>
                     <div className="flex max-w-60 flex-col pl-1">
                        <div className="text-lg font-semibold wrap-break-word whitespace-break-spaces text-white">{user.displayName}</div>
                        <div className="text-sm wrap-break-word whitespace-break-spaces text-white">{user.username}</div>
                        {/* {user && (
                           <Suspense>
                              <CurrentUserBadges userId={user.id} />
                           </Suspense>
                        )} */}
                     </div>
                  </div>
                  <div className="ml-auto flex h-full shrink-0 flex-col gap-y-1 pt-3">{user && <MemberSince userId={user.id} />}</div>
               </div>

               <div className="mx-5 h-0.5" style={{ backgroundColor: `color-mix(in srgb, ${accentColor || "white"} 20%, transparent)` }} />
               <div className="flex flex-col gap-y-5 p-5">
                  {isEditing ? (
                     <ProfileAboutMe
                        accentColor={accentColor}
                        headerRight={
                           <span className={clsx("text-xs", bio.length > CONSTANTS.BIO_MAX_LENGTH ? "text-negative-100" : "text-text/40")}>
                              {bio.length}/{CONSTANTS.BIO_MAX_LENGTH}
                           </span>
                        }
                     >
                        <textarea
                           className="bg-surface-alt w-full resize-none rounded-md px-1.5 py-1 text-sm text-white/80 outline-none placeholder:text-white/30"
                           rows={3}
                           maxLength={CONSTANTS.BIO_MAX_LENGTH}
                           placeholder="Tell me who the f.. fu... FUNKY hell are you?"
                           value={bio}
                           onChange={(e) => setBio(e.target.value)}
                        />
                     </ProfileAboutMe>
                  ) : (
                     user?.bio && (
                        <ProfileAboutMe accentColor={accentColor}>
                           <div className="text-sm text-white/80">
                              {user.bio.split("\n").map((line, i) => (
                                 <div key={i}>{line}</div>
                              ))}
                           </div>
                        </ProfileAboutMe>
                     )
                  )}

                  <ProfileActivity
                     activity={{ type: ActivityType.PLAYING, name: "Huginn", startedAt: Date.now() - 42 * 60 * 1000 }}
                     accentColor={accentColor}
                  />

                  <div className="flex items-center gap-x-2">
                     {isEditing ? (
                        <>
                           <HuginnButton
                              color="primary"
                              className="flex h-8 w-full items-center justify-center gap-x-2 text-sm font-medium"
                              onClick={handleSaveProfile}
                              disabled={mutation.isPending}
                           >
                              {mutation.isPending ? (
                                 <IconMingcuteLoading3Fill className="size-4 animate-spin" />
                              ) : (
                                 <IconMingcuteCheckFill className="size-4" />
                              )}
                              {mutation.isPending ? "Saving..." : "Save"}
                           </HuginnButton>
                           <HuginnButton
                              color="surface"
                              className="flex h-8 w-full items-center justify-center gap-x-2 text-sm font-medium"
                              onClick={handleRevertProfile}
                              disabled={!hasChanges || mutation.isPending}
                           >
                              <IconMingcuteRefreshAnticlockwise1Line className="size-4" />
                              Revert
                           </HuginnButton>
                        </>
                     ) : (
                        <HuginnButton
                           color="primary"
                           className="flex h-8 w-full items-center justify-center gap-x-2 text-sm font-medium"
                           onClick={() => setIsEditing(true)}
                        >
                           <IconMingcuteEdit2Fill className="size-4" />
                           Edit Profile
                        </HuginnButton>
                     )}
                  </div>
               </div>
            </div>

            {/* ── Account ── */}
            <div className="bg-surface-alt rounded-lg p-4">
               <div className="flex flex-col">
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Username</HuginnLabel>
                        <div className="text-white">{user?.username}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("username")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full" />
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Display Name</HuginnLabel>
                        <div className="text-white">{user?.displayName}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("displayName")} />
                  </div>
                  <div className="bg-surface my-4 h-px w-full" />
                  <div className="flex w-full items-center justify-between gap-x-2">
                     <div className="flex w-full flex-col items-start justify-center">
                        <HuginnLabel className="mb-0!">Email</HuginnLabel>
                        <div className="text-white">{user?.email}</div>
                     </div>
                     <ChangeButton onClick={() => handleEditField("email")} />
                  </div>
                  {!isOAuth && (
                     <>
                        <div className="bg-surface my-4 h-px w-full" />
                        <div className="flex w-full items-center justify-between gap-x-2">
                           <div className="flex w-full flex-col items-start justify-center">
                              <HuginnLabel className="mb-0!">Password</HuginnLabel>
                              <div className="text-white">****</div>
                           </div>
                           <ChangeButton onClick={() => handleEditField("password")} />
                        </div>
                     </>
                  )}
                  <div className="bg-surface my-4 h-px w-full" />
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
      <HuginnButton className="h-8 px-3" color="surface" onClick={props.onClick}>
         Change
      </HuginnButton>
   );
}

// function CurrentUserBadges({ userId }: { userId: string }) {
//    const profile = useUserProfile(userId);
//    return <ProfileBadges badges={profile.badges} />;
// }

const COLOR_PRESETS = ["#00dabd", "#00bbea", "#9b59b6", "#e91e63", "#e74c3c", "#e67e22", "#f1c40f", "#a3804f", "#517889"];

function ColorSelector(props: { onChange?: (color: string) => void; color: string; disabled?: boolean; label: string; disabledReason?: string }) {
   function handleHexInputChange(value: string) {
      // const cleaned = value.startsWith("#") ? value : `#${value}`;
      // console.log(cleaned);
      props.onChange?.(value);
   }

   return (
      <div className={clsx("flex w-full items-center gap-x-2", props.disabled && "opacity-50")}>
         <HuginnLabel className="text-tiny mb-0!">{props.label}</HuginnLabel>
         {props.disabled && (
            <Tooltip>
               <Tooltip.Trigger>
                  <IconMingcuteInformationFill className="text-caution-100 size-3.5" />
               </Tooltip.Trigger>
               <Tooltip.Content>{props.disabledReason}</Tooltip.Content>
            </Tooltip>
         )}
         {/* <span className="text-tiny w-20 shrink-0 font-semibold text-text/80 uppercase">Accent</span> */}
         <div className={clsx("ml-auto flex gap-x-1.5", props.disabled && "pointer-events-none")}>
            {COLOR_PRESETS.map((color) => (
               <button
                  key={color}
                  type="button"
                  className="size-5 shrink-0 cursor-pointer rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: color }}
                  onClick={() => props.onChange?.(color)}
               />
            ))}
         </div>
         <input
            type="text"
            className={clsx(
               "bg-surface-alt w-24 shrink-0 rounded-md px-2 py-1 text-xs text-white outline-none placeholder:text-white/30",
               props.disabled && "pointer-events-none",
            )}
            placeholder="#000000"
            maxLength={16}
            value={props.color}
            onChange={(e) => handleHexInputChange(e.currentTarget.value)}
         />
      </div>
   );
}
