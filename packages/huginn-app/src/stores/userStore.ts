import type { APIUser, TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppUser } from "@/types";
import { convertToAppUser } from "@lib/utils";

const store = createStore(
   combine(
      {
         user: undefined as AppUser | undefined,
         tokenPayload: undefined as TokenPayload | undefined,
      },
      (set) => ({
         setUser: (user?: APIUser) => set({ user: user ? convertToAppUser(user) : undefined }),
      }),
   ),
);

export function initializeUser() {
   const client = clientStore.getState().client;
   if (!client) {
      return;
   }

   const unlisten = client.gateway.listen("user_update", (d) => {
      store.getState().setUser(d);
      store.setState({ tokenPayload: client?.tokenHandler.token ? (jose.decodeJwt(client?.tokenHandler.token) as TokenPayload) : undefined });
   });

   return () => {
      unlisten?.();
   };
}

export function useThisUser() {
   return useStore(store);
}

export const userStore = store;
