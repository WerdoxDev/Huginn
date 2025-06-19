import RouteErrorComponent from "@components/RouteErrorComponent";
import { createHashRouter } from "react-router";
import Root, { rootLoader } from "./root";
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
import StartLayout, { startLoader } from "./routes/app/start/start-layout";

const router = createHashRouter([
   {
      Component: Root,
      loader: rootLoader,
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
