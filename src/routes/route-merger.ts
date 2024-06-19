import postLogin from "./auth/post-login";
import postRegister from "./auth/post-register";
import postLogout from "./auth/post-logout";
import postRefreshToken from "./auth/post-refresh-token";
import postUniqueUsername from "./post-unique-username";
import postMessage from "./channel/post-message";
import getChannelBID from "./channel/get-channel-bid";
import deleteChannelBID from "./channel/delete-channel-bid";
import getMessageBID from "./channel/get-message-bid";
import getUserBID from "./user/get-user-bid";
import postChannels from "./user/post-channels";
import getCurrentUser from "./user/get-current-user";
import getUserChannels from "./user/get-user-channels";
import patchCurrentUser from "./user/patch-current-user";
import postPutRelationship from "./relationship/post-put-relationship";
import getRelationshipBID from "./relationship/get-relationship-buid";
import getChannelMessages from "./channel/get-channel-messages";
import getUserRelationships from "./relationship/get-user-relationships";
import deleteRelationshipBID from "./relationship/delete-relationship-bid";
import getCheckUpdate from "./updater/get-check-update";
import getBuilds from "./updater/get-builds";
import { Hono } from "hono";

export const app = new Hono();

// Common
app.route("/", postUniqueUsername);

// Auth
app.route("/", postLogin);
app.route("/", postRegister);
app.route("/", postLogout);
app.route("/", postRefreshToken);

// Channel
app.route("/", postMessage);
app.route("/", getMessageBID);
app.route("/", getChannelBID);
app.route("/", getChannelMessages);
app.route("/", deleteChannelBID);

// User
app.route("/", getCurrentUser);
app.route("/", getUserBID);
app.route("/", getUserChannels);
app.route("/", postChannels);
app.route("/", postPutRelationship);
app.route("/", patchCurrentUser);
app.route("/", getRelationshipBID);
app.route("/", getUserRelationships);
app.route("/", deleteRelationshipBID);

// Updater
app.route("/", getCheckUpdate);
app.route("/", getBuilds);

export default app;
