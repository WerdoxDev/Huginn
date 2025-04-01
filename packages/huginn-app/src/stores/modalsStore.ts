import type { DeepPartial, MutationKinds, StatusCode } from "@/types";
import type { APIChannel, Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

type DefaultModal = { isOpen: boolean };

const initialStore = () => ({
	settings: { isOpen: false } as DefaultModal,
	info: { isOpen: false, status: "none", title: "", text: "", closable: true } as DefaultModal & {
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
	},
	imageCrop: { isOpen: false, originalImageData: "", mimeType: "" } as DefaultModal & {
		originalImageData: string;
		mimeType: string;
	},
	createDM: { isOpen: false } as DefaultModal,
	editGroup: { isOpen: false } as DefaultModal & { channel?: APIChannel },
	addRecipient: { isOpen: false, channelId: "" } as DefaultModal & { channelId: Snowflake },
	magnifiedImage: { isOpen: false, url: "", filename: "", width: 0, height: 0 } as DefaultModal & {
		url: string;
		width: number;
		height: number;
		filename?: string;
	},
	news: { isOpen: false, html: "" } as DefaultModal & { html: string },
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
	combine(initialStore(), (set) => ({
		updateModals: (action: DeepPartial<StoreType>) =>
			set(
				produce((draft: StoreType) => {
					for (const [key, value] of Object.entries(action)) {
						const actualKey = key as keyof typeof draft;
						Object.assign(draft[actualKey], value);
					}
				}),
			),
	})),
);

export function useModals() {
	return useStore(store);
}
