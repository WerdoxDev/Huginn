import { analytics, recordSpanError, type ExpressionKind, type ExpressionType } from "@huginnjs/shared";

import { prisma } from "#database";
import { Prisma } from "#prisma/client";

export const expressionExtension = Prisma.defineExtension({
   model: {
      expression: {
         async getById(key: { kind: ExpressionKind; type: ExpressionType; id: string }) {
            return analytics.startActiveSpan("db.expression.getById", async (span) => {
               span.setAttributes({
                  "query.expression.kind": key.kind,
                  "query.expression.type": key.type,
                  "query.expression.id": key.id,
               });

               try {
                  return await prisma.expression.findUnique({ where: { kind_type_id: key } });
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async getBySourceKey(sourceKey: string) {
            return analytics.startActiveSpan("db.expression.getBySourceKey", async (span) => {
               span.setAttributes({
                  "query.expression.sourceKey": sourceKey,
               });

               try {
                  return await prisma.expression.findUnique({ where: { sourceKey } });
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async createExpression(options: {
            kind: ExpressionKind;
            type: ExpressionType;
            id: string;
            title: string;
            url: string;
            src: string;
            width: number;
            height: number;
            contentType: string;
            sourceKey?: string;
         }) {
            return analytics.startActiveSpan("db.expression.createExpression", async (span) => {
               span.setAttributes({
                  "query.expression.kind": options.kind,
                  "query.expression.type": options.type,
                  "query.expression.id": options.id,
               });

               try {
                  const key = { kind: options.kind, type: options.type, id: options.id };
                  return await prisma.expression.upsert({
                     where: { kind_type_id: key },
                     update: {},
                     create: options,
                  });
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
   },
});
