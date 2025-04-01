import ModalErrorComponent from "@components/ModalErrorComponent";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import BaseModal from "./BaseModal";

const CreateDMModal = lazy(() => import("./CreateDMModal"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const ImageCropModal = lazy(() => import("./ImageCropModal"));
const EditGroupModal = lazy(() => import("./EditGroupModal"));
const AddRecipientModal = lazy(() => import("./AddRecipientModal"));
const InfoModal = lazy(() => import("./InfoModal"));
const MagnifiedImageModal = lazy(() => import("./MagnifiedImageModal"));
const NewsModal = lazy(() => import("./NewsModal"));

export default function ModalsRenderer() {
	const { user } = useThisUser();
	const { createDM, addRecipient, editGroup, imageCrop, info, settings, magnifiedImage, news, updateModals } = useModals();

	return (
		<>
			<ErrorBoundary FallbackComponent={ModalErrorComponent}>
				<BaseModal renderChildren={<SettingsModal />} modal={settings} onClose={() => updateModals({ settings: { isOpen: false } })} />
				<BaseModal renderChildren={<ImageCropModal />} modal={imageCrop} onClose={() => updateModals({ imageCrop: { isOpen: false } })} />
				<BaseModal
					renderChildren={<MagnifiedImageModal />}
					modal={magnifiedImage}
					onClose={() => updateModals({ magnifiedImage: { isOpen: false } })}
					backgroundClassName="bg-black/70"
				/>
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
					</>
				)}
			</ErrorBoundary>
			<BaseModal
				modal={info}
				onClose={() => (!info.action?.cancel ? info.closable && updateModals({ info: { isOpen: false } }) : info.action.cancel.callback())}
				renderChildren={<InfoModal />}
			/>
		</>
	);
}
