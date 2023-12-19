import { DBErrorType, prisma } from "@/src/database";
import { includeChannelRecipients } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIPostCreateDMJsonBody, APIPostCreateDMResult } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { omit } from "@shared/utility";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ recipientId: z.optional(z.string()), users: z.optional(z.record(z.string(), z.string())) });

const app = new Hono();

app.post("/users/@me/channels", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = (await c.req.json()) as APIPostCreateDMJsonBody;
         const payload = getJwt(c);

         if (body.recipientId) {
            const channel: APIPostCreateDMResult = omit(
               await prisma.channel.createSingleDM(payload.id, body.recipientId, includeChannelRecipients),
               ["recipientIds"],
            );
            return c.json(channel, HttpCode.CREATED);
         }

         if (body.users) {
            if (Object.entries(body.users).length === 0) {
               return error(c, createError(Error.invalidFormBody()));
            }

            const channel: APIPostCreateDMResult = omit(
               await prisma.channel.createGroupDM(payload.id, body.users, includeChannelRecipients),
               ["recipientIds"],
            );
            return c.json(channel, HttpCode.CREATED);
         }

         return error(c, createError(Error.invalidFormBody()));
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
