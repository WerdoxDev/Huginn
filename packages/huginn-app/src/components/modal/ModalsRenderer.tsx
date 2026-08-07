import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { lazy } from "react";

import AudioStreamModal from "./AudioStreamModal";
import BaseModal from "./BaseModal";
import ChangeBackgroundModal from "./ChangeBackgroundModal";

const CreateDMModal = lazy(() => import("./CreateDMModal"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const ImageCropModal = lazy(() => import("./ImageCropModal"));
const EditGroupModal = lazy(() => import("./EditGroupModal"));
const AddRecipientModal = lazy(() => import("./AddRecipientModal"));
const InfoModal = lazy(() => import("./InfoModal"));
const MagnifiedImageModal = lazy(() => import("./MagnifiedMediaModal"));
const NewsModal = lazy(() => import("./NewsModal"));
const ScreenShareModal = lazy(() => import("./ScreenShareModal"));

const ChangeUsernameModal = lazy(() => import("./profile/ChangeUsernameModal"));
const ChangeDisplayNameModal = lazy(() => import("./profile/ChangeDisplayNameModal"));
const ChangeEmailModal = lazy(() => import("./profile/ChangeEmailModal"));
const VerifyEmailModal = lazy(() => import("./profile/VerifyEmailModal"));
const ChangePasswordModal = lazy(() => import("./profile/ChangePasswordModal"));
const UserProfileModal = lazy(() => import("./UserProfileModal"));

export default function ModalsRenderer() {
   const { user } = useThisUser();
   const {
      createDM,
      addRecipient,
      editGroup,
      imageCrop,
      info,
      settings,
      magnifiedMedia,
      news,
      screenShare,
      audioStream,
      updateModals,
      changeUsername,
      changeDisplayName,
      changeEmail,
      verifyEmail,
      changePassword,
      userProfile,
      changeBackground,
   } = useModals();

   return (
      <>
         <BaseModal
            renderChildren={<SettingsModal />}
            modal={settings}
            onClose={() => (settings.isClosable || settings.isClosable === undefined) && updateModals({ settings: { isOpen: false } })}
         />
         <BaseModal
            renderChildren={<MagnifiedImageModal />}
            modal={magnifiedMedia}
            onClose={() => updateModals({ magnifiedMedia: { isOpen: false } })}
            backgroundClassName="bg-black/70"
            headless
         />
         <BaseModal renderChildren={<ScreenShareModal />} modal={screenShare} onClose={() => updateModals({ screenShare: { isOpen: false } })} />
         <BaseModal renderChildren={<AudioStreamModal />} modal={audioStream} onClose={() => updateModals({ audioStream: { isOpen: false } })} />
         <BaseModal renderChildren={<NewsModal />} modal={news} onClose={() => updateModals({ news: { isOpen: false } })} />
         <BaseModal
            renderChildren={<VerifyEmailModal />}
            modal={verifyEmail}
            onClose={() => updateModals({ verifyEmail: { isOpen: false, pendingEmail: null, onSuccess: undefined } })}
         />
         {user && (
            <>
               <BaseModal
                  renderChildren={<ChangeBackgroundModal />}
                  modal={changeBackground}
                  onClose={() => updateModals({ changeBackground: { isOpen: false } })}
               />
               <BaseModal renderChildren={<CreateDMModal />} onClose={() => updateModals({ createDM: { isOpen: false } })} modal={createDM} />
               <BaseModal renderChildren={<EditGroupModal />} modal={editGroup} onClose={() => updateModals({ editGroup: { isOpen: false } })} />
               <BaseModal
                  renderChildren={<AddRecipientModal />}
                  modal={addRecipient}
                  onClose={() => updateModals({ addRecipient: { isOpen: false } })}
               />
               <BaseModal
                  renderChildren={<ChangeUsernameModal />}
                  modal={changeUsername}
                  onClose={() => updateModals({ changeUsername: { isOpen: false } })}
               />
               <BaseModal
                  renderChildren={<ChangeDisplayNameModal />}
                  modal={changeDisplayName}
                  onClose={() => updateModals({ changeDisplayName: { isOpen: false } })}
               />
               <BaseModal
                  renderChildren={<ChangeEmailModal />}
                  modal={changeEmail}
                  onClose={() => updateModals({ changeEmail: { isOpen: false } })}
               />
               <BaseModal
                  renderChildren={<ChangePasswordModal />}
                  modal={changePassword}
                  onClose={() => updateModals({ changePassword: { isOpen: false } })}
               />
               <BaseModal
                  renderChildren={<UserProfileModal />}
                  modal={userProfile}
                  onClose={() => updateModals({ userProfile: { isOpen: false } })}
               />
            </>
         )}
         <BaseModal renderChildren={<ImageCropModal />} modal={imageCrop} onClose={() => updateModals({ imageCrop: { isOpen: false } })} />
         <BaseModal
            modal={info}
            onClose={() =>
               !info.action?.cancel
                  ? (info.isClosable || info.isClosable === undefined) && updateModals({ info: { isOpen: false } })
                  : info.action.cancel.callback()
            }
            renderChildren={<InfoModal />}
         />
      </>
   );
}
