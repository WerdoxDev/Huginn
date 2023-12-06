import Elysia, { type Context } from "elysia";
import { HttpCode } from "@shared/errors";
import { verifyToken } from "../../factory/token-factory";
import { APIGetCurrentUserResult } from "@shared/api-types";
import { setup, hasToken } from "../../route-utils";
import { DatabaseUser } from "../../database";
import { logServerError } from "../../log-utils";
import { InferContext } from "../../..";

const route = new Elysia().use(setup);

route.get("/@me", (ctx: Context) => handleGetCurrentUser(ctx), { beforeHandle: hasToken });

async function handleGetCurrentUser(ctx: InferContext<typeof route>) {
   try {
      const [isValid, payload] = await verifyToken(ctx.bearer || "");

      if (!isValid || !payload) {
         ctx.set.status = HttpCode.UNAUTHORIZED;
         return undefined;
      }

      const user = await DatabaseUser.getUserById(payload.id);
      const result: APIGetCurrentUserResult = user.toObject();

      ctx.set.status = HttpCode.OK;
      return result;
   } catch (e) {
      logServerError(ctx.path, e);

      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
