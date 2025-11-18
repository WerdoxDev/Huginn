import RouteErrorComponent from "@components/RouteErrorComponent";
import { clientStore } from "@stores/clientStore";
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
import VoiceDebug from "./routes/voice-debug";

async function mainLoader({ request }: LoaderFunctionArgs) {
   const url = new URL(request.url);
   const pathname = url.pathname;

   const search = new URLSearchParams({ redirect: pathname });

   // await new Promise((r) => setTimeout(r, 1000));
   // try {
   const client = clientStore.getState().client;
   if (!client || client?.gateway.status !== "authenticated") {
      throw redirect(`/?${search}`);
   }
   // oxlint-disable-next-line no-unused-vars
   // } catch (e) {
   //    throw redirect(`/?${search}`);
   // }
}

async function startLoader({ request }: LoaderFunctionArgs) {
   const url = new URL(request.url);
   const pathname = url.pathname;

   // await new Promise((r) => setTimeout(r, 1000));

   const client = clientStore.getState().client;
   if (client?.gateway.status === "authenticated") {
      throw redirect("/channels/@me");
   }

   if (!client && pathname !== "/" && pathname !== "/oauth-redirect") {
      throw redirect("/");
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
                        Component: Index,
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
         { Component: VoiceDebug, path: "/voice-debug" },
      ],
   },
]);

export default router;
