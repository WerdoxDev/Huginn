import { router } from "@/main";
import { HuginnClient } from "@huginn/api/index";
import { routeHistory } from "@contexts/historyContext";
import { APIDMChannel, APIGroupDMChannel } from "@huginn/shared";
import { Snowflake } from "@huginn/shared";
import { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export function setup(client: HuginnClient) {
   const pathname = router.state.location.pathname;
   if (!routeHistory.initialPathname) routeHistory.initialPathname = pathname;

   if (pathname === "/splashscreen") {
      return;
   }

   if (pathname === "/") {
      throw redirect({ to: "/login" });
   }

   if (client.isLoggedIn) {
      return;
   } else {
      if (pathname !== "/login" && pathname !== "/register") {
         console.log("redirect");
         throw redirect({ to: "/login", mask: pathname });
      }
   }
}

export function ensureChannelExists(channelId: Snowflake, queryClient: QueryClient) {
   const channels: (APIDMChannel | APIGroupDMChannel)[] | undefined = queryClient.getQueryData(["channels", "@me"]);

   const safePathname = routeHistory.lastPathname?.includes(channelId) ? "/channels/@me" : routeHistory.lastPathname;
   if (!channels?.some(x => x.id === channelId)) throw redirect({ to: safePathname });
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
