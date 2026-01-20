import type { APIUser, PresenceUser, UserTokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppUser } from "@/types";
import { convertToAppUser } from "@lib/utils";

const store = createStore(
   combine(
      {
         user: undefined as AppUser<PresenceUser<APIUser>> | undefined,
         tokenPayload: undefined as UserTokenPayload | undefined,
      },
      (set) => ({
         setUser: (user?: AppUser<PresenceUser<APIUser>>) => set({ user: user ? convertToAppUser<PresenceUser<APIUser>>(user) : undefined }),
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
      store.setState({ tokenPayload: client?.tokenHandler.token ? (jose.decodeJwt(client?.tokenHandler.token) as UserTokenPayload) : undefined });
   });

   return () => {
      unlisten?.();
   };
}

export function useThisUser() {
   return useStore(store);
}

export const userStore = store;
