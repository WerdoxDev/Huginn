import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { HttpCode } from "@shared/errors";
import { validateUsernameUnique } from "../validation";
import { InferContext } from "../..";
import { logServerError } from "../log-utils";

const route = new Elysia();

route.post("/unique-username", (ctx) => handleUniqueUsername(ctx), {
   body: t.Object({
      username: t.String(),
   }),
});

async function handleUniqueUsername(ctx: InferContext<typeof route, APIPostUniqueUsernameJSONBody>) {
   try {
      const isUnique = await validateUsernameUnique(ctx.body.username);
      const result: APIPostUniqueUsernameResult = { taken: !isUnique };

      ctx.set.status = HttpCode.OK;
      return result;
   } catch (e) {
      logServerError(ctx.path, e);

      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
