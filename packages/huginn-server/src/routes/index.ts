import Elysia, { status } from "elysia";

export const getIndex = new Elysia().get("/", () => {
   return status("OK", "API Home");
});
