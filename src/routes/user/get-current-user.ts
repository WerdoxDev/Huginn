import Elysia from "elysia";
import { verifyToken } from "../../factory/token-factory";
import { setup, hasToken, logAndReturnError, returnResult } from "../../route-utils";
import { DatabaseUser } from "../../database";
import { InferContext } from "../../..";

const route = new Elysia().use(setup).get("/@me", (ctx) => handleGetCurrentUser(ctx), { beforeHandle: hasToken });

async function handleGetCurrentUser(ctx: InferContext<typeof setup>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer || "");

      const user = await DatabaseUser.getUserById(payload!.id);

      return returnResult(ctx, user.toObject());
   } catch (e) {
      return logAndReturnError(ctx, e);
   }
}

export default route;
