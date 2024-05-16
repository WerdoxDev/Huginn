import { redirect } from "@tanstack/react-router";
import { router } from "../main";
import { client, initializeClient } from "./api";
import { settingsContent, readSettingsFile } from "./appData";

export async function setup() {
   if (window.__TAURI__) {
      if (!settingsContent) {
         console.log("reading");
         await readSettingsFile();
      }
   }

   if (!client) {
      initializeClient();
   }

   if (router.history.location.pathname === "/splashscreen") {
      return;
   }

   if (client.isLoggedIn) {
      return;
   }

   const refreshToken = localStorage.getItem("refresh-token");
   try {
      if (refreshToken) {
         await client.initializeWithToken({ refreshToken });
         client.gateway.connect();
         throw redirect({ to: "/channels/@me" });
      }
      if (router.history.location.pathname === "/") {
         throw redirect({ to: "/login" });
      }
   } catch (e) {
      localStorage.removeItem("refresh-token");
      throw redirect({ to: "/login" });
   }
}

export async function requireAuth() {
   if (!client.isLoggedIn) {
      throw redirect({ to: "/login" });
      // return router.navigate({ to: "/login" });
   }
}

export async function requireNotAuth() {
   if (client.isLoggedIn) {
      throw redirect({ to: "/channels/@me" });
      return router.navigate({ to: "/channels/@me" });
   }
}
