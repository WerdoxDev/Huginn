import ModalErrorComponent from "@components/ModalErrorComponent";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { useUser } from "@contexts/userContext";
import { lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import BaseModal from "./BaseModal";

const CreateDMModal = lazy(() => import("./CreateDMModal"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const ImageCropModal = lazy(() => import("./ImageCropModal"));
const EditGroupModal = lazy(() => import("./EditGroupModal"));
const AddRecipientModal = lazy(() => import("./AddRecipientModal"));
const InfoModal = lazy(() => import("./InfoModal"));

export default function ModalsRenderer() {
	const { user } = useUser();
	const { createDM, addRecipient, editGroup, imageCrop, info, settings } = useModals();
	const dispatch = useModalsDispatch();

	return (
		<>
			<ErrorBoundary FallbackComponent={ModalErrorComponent}>
				<BaseModal renderChildren={<SettingsModal />} modal={settings} onClose={() => dispatch({ settings: { isOpen: false } })} />
				<BaseModal renderChildren={<ImageCropModal />} modal={imageCrop} onClose={() => dispatch({ imageCrop: { isOpen: false } })} />
				{user && (
					<>
						<BaseModal renderChildren={<CreateDMModal />} onClose={() => dispatch({ createDM: { isOpen: false } })} modal={createDM} />
						<BaseModal renderChildren={<EditGroupModal />} modal={editGroup} onClose={() => dispatch({ editGroup: { isOpen: false } })} />
						<BaseModal
							renderChildren={<AddRecipientModal />}
							modal={addRecipient}
							onClose={() => dispatch({ addRecipient: { isOpen: false } })}
						/>
					</>
				)}
			</ErrorBoundary>
			<BaseModal
				modal={info}
				onClose={() => (!info.action?.cancel ? info.closable && dispatch({ info: { isOpen: false } }) : info.action.cancel.callback())}
				renderChildren={<InfoModal />}
			/>
		</>
	);
}
