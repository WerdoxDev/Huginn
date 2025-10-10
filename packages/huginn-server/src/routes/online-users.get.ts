import { gateway } from "#setup";
import Elysia from "elysia";

export const getOnlineUsers = new Elysia().get("/api/online-users", async ({ status }) => {
   return status("OK", { count: gateway.getSessionsCount() });
});
