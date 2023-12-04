import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { createResult } from "../factory/result-factory";
import { HttpCode } from "@shared/errors";
import { createError } from "../factory/error-factory";
import { validateUsernameUnique } from "../validation";

const route = new Elysia();

route.post("/unique-username", ({ body }) => handleUniqueUsername(body), {
   body: t.Object({
      username: t.String(),
   }),
});

async function handleUniqueUsername(body: APIPostUniqueUsernameJSONBody): Promise<Response> {
   try {
      const isUnique = await validateUsernameUnique(body.username);
      const result: APIPostUniqueUsernameResult = { taken: isUnique };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
