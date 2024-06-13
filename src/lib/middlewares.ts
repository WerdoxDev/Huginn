import { HuginnClient } from "@api/index";
import { redirect } from "@tanstack/react-router";
import { router } from "../main";

export async function setup(client: HuginnClient) {
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
         // throw redirect({ to: "/channels/@me" });
      }
      if (router.history.location.pathname === "/") {
         throw redirect({ to: "/login" });
      }
   } catch (e) {
      localStorage.removeItem("refresh-token");
      throw redirect({ to: "/login" });
   }
}

export function requireAuth(client: HuginnClient) {
   if (!client.isLoggedIn) {
      throw redirect({ to: "/login" });
   }
}

export function requireNotAuth(client: HuginnClient) {
   if (client.isLoggedIn) {
      throw redirect({ to: "/channels/@me" });
   }
}
