import Elysia from "elysia";

export const getIndex = new Elysia().get("/cdn", ({ status }) => status("OK", "CDN Home"));
