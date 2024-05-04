import postLogin from "./auth/post-login";
import postRegister from "./auth/post-register";
import postLogout from "./auth/post-logout";
import postRefreshToken from "./auth/post-refresh-token";
import postUniqueUsername from "./post-unique-username";
import postMessage from "./channel/post-message";
import getChannelBID from "./channel/get-channel-bid";
import getMessageBID from "./channel/get-message-bid";
import getUserBID from "./user/get-user-bid";
import postDirectMessage from "./user/post-direct-message";
import getCurrentUser from "./user/get-current-user";
import getUserChannels from "./user/get-user-channels";
import patchCurrentUser from "./user/patch-current-user";
import putRelationship from "./user/relationship/post-put-relationship";
import getRelationshipBID from "./user/relationship/get-relationship-buid";
import getChannelMessages from "./channel/get-channel-messages";
import getUserRelationships from "./user/relationship/get-user-relationships";
import deleteRelationshipBID from "./user/relationship/delete-relationship-bid";
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

// User
app.route("/", getCurrentUser);
app.route("/", getUserBID);
app.route("/", getUserChannels);
app.route("/", postDirectMessage);
app.route("/", putRelationship);
app.route("/", patchCurrentUser);
app.route("/", getRelationshipBID);
app.route("/", getUserRelationships);
app.route("/", deleteRelationshipBID);

// Updater
app.route("/", getCheckUpdate);
app.route("/", getBuilds);

export default app;
