import loginRoute from "./auth/login";
import registerRoute from "./auth/register";
import logoutRoute from "./auth/logout";
import refreshTokenRoute from "./auth/refresh-token";
import uniqueUsernameRoute from "./unique-username";
import createMessageRoute from "./channel/create-message";
import getChannelByIdRoute from "./channel/get-channel-by-id";
import getMessageByIdRoute from "./channel/get-message-by-id";
import getUserByIdRoute from "./user/get-user-by-id";
import createDmRoute from "./user/create-dm";
import getCurrentUserRoute from "./user/get-current-user";
import getUserChannelsRoute from "./user/get-user-channels";
import patchCurrentUserRoute from "./user/patch-current-user";
import createRelationRoute from "./user/create-relationship";
import getRelationshipById from "./user/get-relationship-by-id";
import getChannelMessagesRoute from "./channel/get-channel-messages";
import getUserRelationships from "./user/get-user-relationships";
import deleteRelationshipById from "./user/delete-relationship-by-id";
import checkUpdateRoute from "./updater/check-update";
import buildsRoute from "./updater/builds";
import { Hono } from "hono";

export const app = new Hono();

// Common
app.route("/", uniqueUsernameRoute);

// Auth
app.route("/", loginRoute);
app.route("/", registerRoute);
app.route("/", logoutRoute);
app.route("/", refreshTokenRoute);

// Channel
app.route("/", createMessageRoute);
app.route("/", getMessageByIdRoute);
app.route("/", getChannelByIdRoute);
app.route("/", getChannelMessagesRoute);

// User
app.route("/", getCurrentUserRoute);
app.route("/", getUserByIdRoute);
app.route("/", getUserChannelsRoute);
app.route("/", createDmRoute);
app.route("/", createRelationRoute);
app.route("/", patchCurrentUserRoute);
app.route("/", getRelationshipById);
app.route("/", getUserRelationships);
app.route("/", deleteRelationshipById);

// Updater
app.route("/", checkUpdateRoute);
app.route("/", buildsRoute);

export default app;
