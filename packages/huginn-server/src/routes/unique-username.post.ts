import { type APIPostUniqueUsernameResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

import { validateUsernameUnique } from "#utils/validation";

const schema = t.Object({ username: t.String() });

export const postUniqueUsername = new Elysia().post(
   "/api/unique-username",
   async ({ status, body }) => {
      const isUnique = await validateUsernameUnique(body.username.toLowerCase());
      const json: APIPostUniqueUsernameResult = { taken: !isUnique };

      return status("OK", json);
   },
   { body: schema },
);
