import { InferContext } from "@/index";
import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { setup, result, serverError } from "../route-utils";
import { validateUsernameUnique } from "../validation";

const route = new Elysia().post("/unique-username", (ctx) => handleUniqueUsername(ctx), {
   body: t.Object({
      username: t.String(),
   }),
});

async function handleUniqueUsername(ctx: InferContext<typeof setup, APIPostUniqueUsernameJSONBody>) {
   try {
      const isUnique = await validateUsernameUnique(ctx.body.username);
      const json: APIPostUniqueUsernameResult = { taken: !isUnique };

      return result(ctx, json);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
