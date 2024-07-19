import { Hono } from "hono";
import postLogin from "./auth/post-login";
import postLogout from "./auth/post-logout";
import postRefreshToken from "./auth/post-refresh-token";
import postRegister from "./auth/post-register";
import deleteChannelBID from "./channel/delete-channel-bid";
import getChannelBID from "./channel/get-channel-bid";
import getChannelMessages from "./channel/get-channel-messages";
import getMessageBID from "./channel/get-message-bid";
import postMessage from "./channel/post-message";
import postUniqueUsername from "./post-unique-username";
import deleteRelationshipBUID from "./relationship/delete-relationship-buid";
import getRelationshipBUID from "./relationship/get-relationship-buid";
import getUserRelationships from "./relationship/get-user-relationships";
import postPutRelationship from "./relationship/post-put-relationship";
import getBuilds from "./updater/get-builds";
import getCheckUpdate from "./updater/get-check-update";
import getCurrentUser from "./user/get-current-user";
import getUserBID from "./user/get-user-bid";
import getUserChannels from "./user/get-user-channels";
import patchCurrentUser from "./user/patch-current-user";
import postChannels from "./user/post-channels";

export const app = new Hono();

// Common
app.route("/", postUniqueUsername);

// Auth
app.route("/", postLogin);
app.route("/", postRegister);
app.route("/", postLogout);
app.route("/", postRefreshToken);

// Channel
app.route("/", getMessageBID);
app.route("/", getChannelBID);
app.route("/", getChannelMessages);
app.route("/", postMessage);
app.route("/", deleteChannelBID);

// User
app.route("/", getCurrentUser);
app.route("/", getUserBID);
app.route("/", getUserChannels);
app.route("/", postChannels);
app.route("/", patchCurrentUser);

// Relationship
app.route("/", getRelationshipBUID);
app.route("/", getUserRelationships);
app.route("/", postPutRelationship);
app.route("/", deleteRelationshipBUID);

// Updater
app.route("/", getCheckUpdate);
app.route("/", getBuilds);

export default app;
