import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { z } from "zod";
import { hValidator, handleRequest } from "../route-utils";
import { validateUsernameUnique } from "../validation";

const schema = z.object({ username: z.string() });

const app = new Hono();

app.post("/unique-username", hValidator("json", schema), c =>
   handleRequest(c, async () => {
      const body = (await c.req.json()) as APIPostUniqueUsernameJSONBody;

      const isUnique = await validateUsernameUnique(body.username.toLowerCase());
      const json: APIPostUniqueUsernameResult = { taken: !isUnique };

      return c.json(json, HttpCode.OK);
   }),
);

export default app;
