import type { DeepPartial, MutationKinds, StatusCode } from "@/types";
import type { APIChannel, Snowflake } from "@huginn/shared";
import { type Dispatch, type ReactNode, createContext } from "react";

type DefaultModal = { isOpen: boolean };
export type ModalContextType = {
	settings: DefaultModal;
	info: DefaultModal & {
		status: StatusCode;
		text: string;
		title: string;
		action?: {
			cancel?: {
				text?: string;
				callback: () => void;
			};
			confirm?: {
				text: string;
				mutationKey?: keyof MutationKinds;
				callback: () => void;
			};
		};
		closable: boolean;
	};
	imageCrop: DefaultModal & {
		originalImageData: string;
		mimeType: string;
	};
	createDM: DefaultModal;
	editGroup: DefaultModal & { channel?: APIChannel };
	addRecipient: DefaultModal & { channelId: Snowflake };
};

const defaultValue: ModalContextType = {
	settings: { isOpen: false },
	info: { isOpen: false, status: "none", title: "", text: "", closable: true },
	imageCrop: { isOpen: false, originalImageData: "", mimeType: "" },
	createDM: { isOpen: false },
	editGroup: { isOpen: false },
	addRecipient: { isOpen: false, channelId: "" },
};

const ModalContext = createContext<ModalContextType>(defaultValue);
const ModalDispatchContext = createContext<Dispatch<DeepPartial<ModalContextType>>>(() => {});

export function ModalProvider(props: { children?: ReactNode }) {
	const [modals, dispatch] = useReducer(modalsReducer, defaultValue);

	return (
		<ModalContext.Provider value={modals}>
			<ModalDispatchContext.Provider value={dispatch}>{props.children}</ModalDispatchContext.Provider>
		</ModalContext.Provider>
	);
}

function modalsReducer(modals: ModalContextType, action: DeepPartial<ModalContextType>): ModalContextType {
	const settings = action.settings ? Object.assign({}, modals.settings, action.settings) : modals.settings;
	const info = action.info ? Object.assign({}, modals.info, action.info) : modals.info;
	const imageCrop = action.imageCrop ? Object.assign({}, modals.imageCrop, action.imageCrop) : modals.imageCrop;
	const createDM = action.createDM ? Object.assign({}, modals.createDM, action.createDM) : modals.createDM;
	const editGroup = action.editGroup ? Object.assign({}, modals.editGroup, action.editGroup) : modals.editGroup;
	const addRecipient = action.addRecipient ? Object.assign({}, modals.addRecipient, action.addRecipient) : modals.addRecipient;

	return { settings, info, imageCrop, createDM, editGroup, addRecipient };
}

export function useModals() {
	return useContext(ModalContext);
}

export function useModalsDispatch() {
	return useContext(ModalDispatchContext);
}
