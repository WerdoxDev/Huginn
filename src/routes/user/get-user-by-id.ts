import { createError } from "../../factory/error-factory";
import { HttpCode, Error as HError } from "@shared/errors";
import { createResult } from "../../factory/result-factory";
import { APIGetUserByIdResult } from "@shared/api-types";
import { Snowflake } from "@shared/types";
import Elysia from "elysia";
import { setup, hasToken } from "../../route-utils";
import { DatabaseUser } from "../../database";
import { DatabaseError, isDBError } from "../../database/database-error";

const route = new Elysia().use(setup);

route.get("/:id", ({ params: { id } }) => handleGetUserById(id), { beforeHandle: hasToken });

export async function handleGetUserById(id: Snowflake): Promise<Response> {
   if (!id) {
      return createError().toResponse(HttpCode.UNAUTHORIZED);
   }

   try {
      const user = await DatabaseUser.getUserById(id, "-email");
      const result: APIGetUserByIdResult = user.toObject();

      return createResult(result, HttpCode.OK);
   } catch (e) {
      if (isDBError(e) && e.error.message === DatabaseError.NULL_USER) {
         return createError(HError.unknownUser()).toResponse(HttpCode.NOT_FOUND);
      }

      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
