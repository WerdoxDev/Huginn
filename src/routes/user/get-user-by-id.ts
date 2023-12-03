import { createError } from "../../factory/error-factory";
import { HttpCode, Error } from "@shared/errors";
import { getUserById } from "../../database/user";
import { createResult } from "../../factory/result-factory";
import { APIGetUserByIdResult } from "@shared/api-types";
import { Snowflake } from "@shared/types";
import Elysia from "elysia";
import { setup, hasToken } from "../../route-utils";

const route = new Elysia().use(setup);

route.get("/:id", ({ params: { id } }) => handleGetUserById(id), { beforeHandle: hasToken });

export async function handleGetUserById(id: Snowflake): Promise<Response> {
   if (!id) {
      return createError().toResponse(HttpCode.UNAUTHORIZED);
   }

   try {
      const user = await getUserById(id, "-email");

      if (!user) {
         return createError(Error.unknownUser()).toResponse(HttpCode.NOT_FOUND);
      }

      const result: APIGetUserByIdResult = user.toObject();

      return createResult(result, HttpCode.OK);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
