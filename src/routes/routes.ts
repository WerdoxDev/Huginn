import loginRoute from "./auth/login";
import refreshTokenRoute from "./auth/login";
import uniqueUsernameRoute from "./unique-username";
import registerRoute from "./auth/register";
import createMessageRoute from "./channel/create-message";
import getChannelByIdRoute from "./channel/get-channel-by-id";
import getMessageByIdRoute from "./channel/get-message-by-id";
import getUserByIdRoute from "./user/get-user-by-id";
import createDmRoute from "./user/create-dm";
import getCurrentUserRoute from "./user/get-current-user";
import getUserChannelsRoute from "./user/get-user-channels";
import patchCurrentUserRoute from "./user/patch-current-user";
import getChannelMessagesRoute from "./channel/get-channel-messages";
import Elysia from "elysia";
import { setup } from "../route-utils";

export const routes = new Elysia()
   .use(setup)
   .use(loginRoute)
   .use(registerRoute)
   .use(refreshTokenRoute)
   .use(getMessageByIdRoute)
   .use(getUserByIdRoute)
   .use(getUserChannelsRoute)
   .use(getCurrentUserRoute)
   .use(getChannelByIdRoute)
   .use(getChannelMessagesRoute)
   .use(createMessageRoute)
   .use(createDmRoute)
   .use(patchCurrentUserRoute)
   .use(uniqueUsernameRoute);
