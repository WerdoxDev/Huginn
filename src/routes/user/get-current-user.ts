import Elysia from "elysia";
import { createError } from "../../factory/error-factory";
import { HttpCode } from "@shared/errors";
import { verifyToken } from "../../factory/token-factory";
import { getUserById } from "../../database/user";
import { createResult } from "../../factory/result-factory";
import { APIGetCurrentUserResult } from "@shared/api-types";
import { setup, hasToken } from "../../route-utils";

const route = new Elysia().use(setup);

route.get("/@me", ({ bearer }) => handleGetCurrentUser(bearer || ""), { beforeHandle: hasToken });

async function handleGetCurrentUser(token: string): Promise<Response> {
   try {
      const [isValid, payload] = await verifyToken(token);

      if (!isValid || !payload) {
         return createError().toResponse(HttpCode.UNAUTHORIZED);
      }

      const user = await getUserById(payload.id);

      if (!user) {
         return createError().toResponse(HttpCode.SERVER_ERROR);
      }

      const result: APIGetCurrentUserResult = user.toObject();

      return createResult(result, HttpCode.OK);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
