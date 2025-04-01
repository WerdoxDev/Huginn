import type { APIUser, TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { client } from "./apiStore";

const store = createStore(
	combine(
		{
			user: undefined as APIUser | undefined,
			tokenPayload: undefined as TokenPayload | undefined,
		},
		(set) => ({
			setUser: (user?: APIUser) => set({ user }),
		}),
	),
);

export function initializeUser() {
	const unlisten = client.gateway.listen("user_update", (d) => {
		store.getState().setUser(d);
		store.setState({ tokenPayload: client.tokenHandler.token ? (jose.decodeJwt(client.tokenHandler.token) as TokenPayload) : undefined });
	});

	return () => {
		unlisten();
	};
}

export function useThisUser() {
	return useStore(store);
}

export const userStore = store;
