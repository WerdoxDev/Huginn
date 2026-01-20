import RouteErrorComponent from "@components/RouteErrorComponent";
import { clientStore } from "@stores/clientStore";
import { createHashRouter, type LoaderFunctionArgs, type MiddlewareFunction, redirect } from "react-router";
import Root, { queryClient } from "./root";
import AppLayout from "./routes/app/app-layout";
import ChannelMe from "./routes/app/main/home/channels.@me";
import ChannelWithId from "./routes/app/main/home/channels.@me.$channelId";
import Friends from "./routes/app/main/home/friends";
import HomeLayout from "./routes/app/main/home/home-layout";
import MainLayout from "./routes/app/main/main-layout";
import Index from "./routes/app/start/index";
import Login from "./routes/app/start/login";
import OauthRedirect from "./routes/app/start/oauth-redirect";
import Register from "./routes/app/start/register";
import StartLayout from "./routes/app/start/start-layout";
import VoiceDebug from "./routes/voice-debug";
import { getChannelsOptions, getMessagesOptions, getRelationshipsOptions } from "@lib/queries";

async function homeLoader() {
   const client = clientStore.getState().client;
   if (!client) return;

   return await queryClient?.ensureQueryData(getChannelsOptions(client, "@me"));
}

async function friendsLoader() {
   const client = clientStore.getState().client;
   if (!client) return;

   return await queryClient.ensureQueryData(getRelationshipsOptions(client));
}

async function channelWithIdLoader({ params }: LoaderFunctionArgs) {
   const client = clientStore.getState().client;
   if (!client) return;

   return queryClient.ensureInfiniteQueryData(getMessagesOptions(queryClient, client, params.channelId as string));
}

const mainMiddleware: MiddlewareFunction = async ({ request }) => {
   const url = new URL(request.url);
   const pathname = url.pathname;

   const search = new URLSearchParams({ redirect: pathname, requireAuth: "1" });

   const client = clientStore.getState().client;
   if (!client || client?.gateway.status !== "authenticated") {
      throw redirect(`/?${search}`);
   }
};

const startMiddleware: MiddlewareFunction = async ({ request }) => {
   const url = new URL(request.url);
   const pathname = url.pathname;

   const client = clientStore.getState().client;
   if (client?.gateway.status === "authenticated") {
      throw redirect("/channels/@me");
   }

   const search = new URLSearchParams({ redirect: url.toString(), requireAuth: "0" });

   if (!client && pathname !== "/") {
      throw redirect(`/?${search}`);
   }
};

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
                  middleware: [startMiddleware],
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
                  middleware: [mainMiddleware],
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
                              loader: friendsLoader,
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
