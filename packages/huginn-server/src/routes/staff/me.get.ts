import type { APIPublicUser } from "@huginnjs/shared";

import Elysia from "elysia";

import { verifyStaff } from "#utils/staff";

export const getStaffMe = new Elysia().use(verifyStaff()).get("/api/staff/@me", ({ staffUser, status }) => {
   return status("OK", staffUser as APIPublicUser);
});
