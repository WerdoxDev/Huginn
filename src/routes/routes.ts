import loginRoute from "./auth/login";
import registerRoute from "./auth/register";
import refreshTokenRoute from "./auth/login";
import uniqueUsernameRoute from "./unique-username";
import createMessageRoute from "./channel/create-message";
import getChannelByIdRoute from "./channel/get-channel-by-id";
import getMessageByIdRoute from "./channel/get-message-by-id";
import getUserByIdRoute from "./user/get-user-by-id";
import createDmRoute from "./user/create-dm";
import getCurrentUserRoute from "./user/get-current-user";
import getUserChannelsRoute from "./user/get-user-channels";
import patchCurrentUserRoute from "./user/patch-current-user";
import getChannelMessagesRoute from "./channel/get-channel-messages";
import { Hono } from "hono";

export const app = new Hono();

app.route("/", loginRoute);
app.route("/", registerRoute);
app.route("/", refreshTokenRoute);
app.route("/", uniqueUsernameRoute);
app.route("/", getMessageByIdRoute);
app.route("/", getCurrentUserRoute);
app.route("/", getUserByIdRoute);
app.route("/", getUserChannelsRoute);
app.route("/", getChannelByIdRoute);
app.route("/", getChannelMessagesRoute);
app.route("/", createMessageRoute);
app.route("/", createDmRoute);
app.route("/", patchCurrentUserRoute);

export default app;
