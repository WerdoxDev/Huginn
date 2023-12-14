import { InferContext } from "@/index";
import { DatabaseUser } from "@/src/database";
import { verifyToken } from "@/src/factory/token-factory";
import { setup, hasToken, result, serverError } from "@/src/route-utils";
import Elysia from "elysia";

const route = new Elysia().use(setup).get("/users/@me", (ctx) => handleGetCurrentUser(ctx), { beforeHandle: hasToken });

async function handleGetCurrentUser(ctx: InferContext<typeof setup>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer || "");

      const user = await DatabaseUser.getUserById(payload!.id);

      return result(ctx, user.toObject());
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
