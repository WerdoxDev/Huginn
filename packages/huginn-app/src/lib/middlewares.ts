import { router } from "@/main";
import { HuginnClient } from "@huginn/api";
import { routeHistory } from "@contexts/historyContext";
import { APIDMChannel, APIGroupDMChannel } from "@huginn/shared";
import { Snowflake } from "@huginn/shared";
import { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export function setup(client: HuginnClient) {
   const pathname = router.state.location.pathname;
   if (!routeHistory.initialPathname) routeHistory.initialPathname = pathname;

   console.log("to", pathname);

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
         console.log(pathname, "mask");
         throw redirect({ to: "/login", mask: pathname });
      }
   }
}

export function ensureChannelExists(channelId: Snowflake, queryClient: QueryClient) {
   const channels: (APIDMChannel | APIGroupDMChannel)[] | undefined = queryClient.getQueryData(["channels", "@me"]);
   console.log(channels);
   const safePathname = routeHistory.lastPathname?.includes(channelId) ? "/channels/@me" : routeHistory.lastPathname;
   if (!channels?.some(x => x.id === channelId)) throw redirect({ to: safePathname });
   console.log("CHANNEL EXISTS");
}

export function requireAuth(client: HuginnClient) {
   if (!client.isLoggedIn) {
      console.log("REQUIRE AUTH");
      throw redirect({ to: "/login" });
   }
}

export function requireNotAuth(client: HuginnClient) {
   if (client.isLoggedIn) {
      console.log("NO AUTH");
      throw redirect({ to: "/channels/@me" });
   }
}
