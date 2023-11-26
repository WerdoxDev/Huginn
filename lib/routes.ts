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
    * ROute for:
    * - POST '/unique-username'
    */
   uniqueUsername() {
      return `/unique-username` as const;
   },

   /**
    * Route for:
    * - GET   '/user/@me'
    * - GET   '/user/{user.id}'
    * - PATCH '/user/@me'
    */
   user(id: Snowflake) {
      return `/user/${id}` as const;
   },
};

let a = Routes.user("asd");
