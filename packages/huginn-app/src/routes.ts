import RouteErrorComponent from "@components/RouteErrorComponent";
import { client } from "@stores/clientStore";
import { createHashRouter, type LoaderFunctionArgs, redirect } from "react-router";
import Root from "./root";
import AppLayout from "./routes/app/app-layout";
import ChannelMe from "./routes/app/main/home/channels.@me";
import ChannelWithId, { channelWithIdLoader } from "./routes/app/main/home/channels.@me.$channelId";
import Friends from "./routes/app/main/home/friends";
import HomeLayout, { homeLoader } from "./routes/app/main/home/home-layout";
import MainLayout from "./routes/app/main/main-layout";
import Index from "./routes/app/start/index";
import Login from "./routes/app/start/login";
import OauthRedirect from "./routes/app/start/oauth-redirect";
import Register from "./routes/app/start/register";
import StartLayout from "./routes/app/start/start-layout";

function mainLoader({ request }: LoaderFunctionArgs) {
   const url = new URL(request.url);
   const pathname = url.pathname;

   const search = new URLSearchParams({ redirect: pathname });
   if (client?.gateway.status !== "authenticated") {
      throw redirect(`/?${search}`);
   }
}

function startLoader({ request }: LoaderFunctionArgs) {
   if (client?.gateway.status === "authenticated") {
      throw redirect("/channels/@me");
   }
}

const router = createHashRouter([
   {
      Component: Root,
      ErrorBoundary: RouteErrorComponent,
      children: [
         {
            Component: AppLayout,
            children: [
               {
                  Component: StartLayout,
                  loader: startLoader,
                  children: [
                     {
                        path: "/",
                        Component: Index
                     },
                     {
                        path: "/login",
                        Component: Login,
                     },
                     {
                        path: "/register",
                        Component: Register,
                     },
                     {
                        path: "/oauth-redirect",
                        Component: OauthRedirect,
                     },
                  ],
               },
               {
                  Component: MainLayout,
                  loader: mainLoader,
                  children: [
                     {
                        Component: HomeLayout,
                        loader: homeLoader,
                        children: [
                           {
                              path: "/channels/@me/:channelId",
                              Component: ChannelWithId,
                              loader: channelWithIdLoader,
                           },
                           {
                              path: "/channels/@me",
                              Component: ChannelMe,
                           },
                           {
                              path: "/friends",
                              Component: Friends,
                           },
                        ],
                     },
                  ],
               },
            ],
         },
      ],
   },
]);

export default router;
