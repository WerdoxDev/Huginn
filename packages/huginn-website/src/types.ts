import type { APIPublicUser } from "@huginnjs/shared";

export type IconComponent = typeof import("~icons/mingcute/windows-fill.jsx").default;

export type StaffSession = {
   token: string;
   user: APIPublicUser;
};
