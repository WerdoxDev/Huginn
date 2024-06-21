import { router } from "@/main";
import { HuginnClient } from "@api/index";
import { routeHistory } from "@contexts/historyContext";
import { redirect } from "@tanstack/react-router";

export async function setup(client: HuginnClient) {
   const pathname = router.state.location.pathname;
   if (!routeHistory.initialPathname) routeHistory.initialPathname = pathname;

   if (pathname === "/splashscreen") {
      return;
   }

   if (client.isLoggedIn) {
      return;
   } else {
      if (pathname === "/") {
         throw redirect({ to: "/login" });
      }

      console.log(pathname);
      if (pathname !== "/login" && pathname !== "/register") throw redirect({ to: "/login", mask: pathname });
   }

   // const refreshToken = localStorage.getItem("refresh-token");
   // try {
   //    if (refreshToken) {
   //       await client.initializeWithToken({ refreshToken });
   //       client.gateway.connect();
   //       // throw redirect({ to: "/channels/@me" });
   //    }
   //    if (router.history.location.pathname === "/") {
   //       throw redirect({ to: "/login" });
   //    }
   // } catch (e) {
   //    localStorage.removeItem("refresh-token");
   //    throw redirect({ to: "/login" });
   // }
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
