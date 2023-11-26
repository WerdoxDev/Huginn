import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "$shared/api-types";
import Elysia, { t } from "elysia";
import { existsInUsers } from "../database/common";
import { createResult } from "../factory/result-factory";
import { HttpCode } from "$shared/errors";
import { createError } from "../factory/error-factory";

const route = new Elysia();

route.post("/unique-username", ({ body }) => handleUniqueUsername(body), {
   body: t.Object({
      username: t.String(),
   }),
});

async function handleUniqueUsername(body: APIPostUniqueUsernameJSONBody): Promise<Response> {
   try {
      const exists = await existsInUsers("username", body.username);

      const result: APIPostUniqueUsernameResult = { taken: exists };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
