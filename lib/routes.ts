import { Snowflake } from "./types";

export const Routes = {
   /**
    * Route for:
    * - POST '/auth/login'
    */
   login() {
      return `/auth/login` as const;
   },

   /**
    * Route for:
    * - POST '/auth/register'
    */
   register() {
      return `/auth/register` as const;
   },

   /**
    * Route for:
    * - POST '/auth/refresh-token'
    */
   refreshToken() {
      return `/auth/refresh-token` as const;
   },

   /**
    * ROute for:
    * - POST '/unique-username'
    */
   uniqueUsername() {
      return `/unique-username` as const;
   },

   /**
    * Route for:
    * - GET   '/users/@me'
    * - GET   '/users/{user.id}'
    * - PATCH '/users/@me'
    */
   user(id: Snowflake) {
      return `/users/${id}` as const;
   },

   /**
    * Route for:
    * - POST '/users/@me/channels'
    */
   userChannels() {
      return `/users/@me/channels` as const;
   },

   /**
    * Route for:
    * - GET '/channels/{channel.id}'
    */
   channel(id: Snowflake) {
      return `/channels/${id}` as const;
   },

   /**
    * Route for:
    * - POST '/channels/{channel.id}/typing'
    */
   channelTyping(channelId: Snowflake) {
      return `/channels/${channelId}/typing` as const;
   },
};

let a = Routes.user("asd");
