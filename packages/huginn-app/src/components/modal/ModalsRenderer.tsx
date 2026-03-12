import ModalErrorComponent from "@components/ModalErrorComponent";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";

import BaseModal from "./BaseModal";
import StreamAudioModal from "./StreamAudioModal";

const CreateDMModal = lazy(() => import("./CreateDMModal"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const ImageCropModal = lazy(() => import("./ImageCropModal"));
const EditGroupModal = lazy(() => import("./EditGroupModal"));
const AddRecipientModal = lazy(() => import("./AddRecipientModal"));
const InfoModal = lazy(() => import("./InfoModal"));
const MagnifiedImageModal = lazy(() => import("./MagnifiedImageModal"));
const NewsModal = lazy(() => import("./NewsModal"));
const ScreenShareModal = lazy(() => import("./ScreenShareModal"));

const ChangeUsernameModal = lazy(() => import("./profile/ChangeUsernameModal"));
const ChangeDisplayNameModal = lazy(() => import("./profile/ChangeDisplayNameModal"));
const ChangeEmailModal = lazy(() => import("./profile/ChangeEmailModal"));

export default function ModalsRenderer() {
   const { user } = useThisUser();
   const {
      createDM,
      addRecipient,
      editGroup,
      imageCrop,
      info,
      settings,
      magnifiedImage,
      news,
      screenShare,
      streamAudio,
      updateModals,
      changeUsername,
      changeDisplayName,
      changeEmail,
   } = useModals();

   return (
      <>
         <ErrorBoundary FallbackComponent={ModalErrorComponent}>
            <BaseModal
               renderChildren={<SettingsModal />}
               modal={settings}
               onClose={() => settings.isClosable && updateModals({ settings: { isOpen: false } })}
            />
            <BaseModal renderChildren={<ImageCropModal />} modal={imageCrop} onClose={() => updateModals({ imageCrop: { isOpen: false } })} />
            <BaseModal
               renderChildren={<MagnifiedImageModal />}
               modal={magnifiedImage}
               onClose={() => updateModals({ magnifiedImage: { isOpen: false } })}
               backgroundClassName="bg-black/70"
            />
            <BaseModal renderChildren={<ScreenShareModal />} modal={screenShare} onClose={() => updateModals({ screenShare: { isOpen: false } })} />
            <BaseModal renderChildren={<StreamAudioModal />} modal={streamAudio} onClose={() => updateModals({ streamAudio: { isOpen: false } })} />
            <BaseModal renderChildren={<NewsModal />} modal={news} onClose={() => updateModals({ news: { isOpen: false } })} />
            {user && (
               <>
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
               </>
            )}
         </ErrorBoundary>
         <BaseModal
            modal={info}
            onClose={() => (!info.action?.cancel ? info.isClosable && updateModals({ info: { isOpen: false } }) : info.action.cancel.callback())}
            renderChildren={<InfoModal />}
         />
      </>
   );
}
