import Elysia from "elysia";

import { gateway } from "#server";

export const getOnlineUsers = new Elysia().get("/api/online-users", async ({ status }) => {
   return status("OK", { count: gateway.getSessionsCount() });
});
