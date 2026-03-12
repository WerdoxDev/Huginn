import type { APIUser, PresenceUser, UserTokenPayload } from "@huginn/shared";

import { convertToAppUser } from "@lib/utils";
import * as jose from "jose";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { AppUser } from "@/types";

import { clientStore } from "./clientStore";

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

   const unlisten = client.gateway.listen("ready", () => {
      store.setState({
         tokenPayload: client?.tokenHandler.token ? (jose.decodeJwt(client?.tokenHandler.token) as UserTokenPayload) : undefined,
      });
   });

   const unlisten2 = client.gateway.listen("user_update", (d) => {
      store.getState().setUser(d);
      store.setState({
         tokenPayload: client?.tokenHandler.token ? (jose.decodeJwt(client?.tokenHandler.token) as UserTokenPayload) : undefined,
      });
   });

   return () => {
      unlisten?.();
      unlisten2?.();
   };
}

export function useThisUser() {
   return useStore(store);
}

export const userStore = store;
