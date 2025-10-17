import Elysia from "elysia";

export const getIndex = new Elysia().get("/", ({ status }) => status("OK", "CDN Home"));
