import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { ChannelType, ExpressionType, GatewayOperations, snowflake, WorkerID } from "@huginnjs/shared";
import { describe, expect, spyOn, test } from "bun:test";

import { gateway } from "#server";
import { authHeader, createTestChannel, createTestRelationships, createTestUsers } from "#tests/utils";

describe("Expression usage gateway updates", () => {
   test(
      "publishes one update per distinct expression to the sender user topic after successful sends",
      async () => {
         const [sender, recipient] = await createTestUsers(2);
         await createTestRelationships(sender.id, recipient.id, true);
         const channel = await createTestChannel(undefined, ChannelType.DM, sender.id, recipient.id);
         const id = snowflake.generate(WorkerID.GIF).toString();
         const ref = { id, type: ExpressionType.KLIPY };
         const media = {
            ...ref,
            title: "Gateway test",
            url: "https://example.com/expression",
            src: "https://example.com/expression",
            width: 100,
            height: 100,
            contentType: "image/gif",
         };

         try {
            await prisma.expression.createExpression({ ...media, kind: "gifs" });
            await prisma.expression.createExpression({ ...media, kind: "stickers" });
            const publish = spyOn(gateway, "sendToTopic");
            try {
               async function send(body: object) {
                  publish.mockClear();
                  await testHandler(`/api/channels/${channel.id}/messages`, authHeader(sender.accessToken), "POST", body);
                  return publish.mock.calls.flatMap(([topic, payload]) => {
                     if (payload.op !== GatewayOperations.DISPATCH || payload.t !== "expression_updated") return [];
                     expect(topic).toBe(sender.id.toString());
                     return [payload.d];
                  });
               }

               // Duplicate references count once, even when both kinds share the same source ID.
               const firstSend = await send({ gifs: [ref, ref], stickers: [ref, ref] });
               expect(firstSend).toHaveLength(2);
               expect(firstSend.map((update) => update.kind).sort()).toEqual(["gifs", "stickers"]);
               for (const update of firstSend) {
                  expect(update.expression).toMatchObject({ ...media, usageCount: 1 });
                  expect(update.expression.lastUsedAt).toEqual(expect.any(String));
               }

               const secondSend = await send({ gifs: [ref] });
               expect(secondSend).toHaveLength(1);
               expect(secondSend[0]).toMatchObject({ kind: "gifs", expression: { id, type: ref.type, usageCount: 2 } });

               expect(await send({ content: "No expression usage" })).toEqual([]);
               publish.mockClear();
               await expect(testHandler(`/api/channels/${channel.id}/messages`, authHeader(sender.accessToken), "POST", {})).rejects.toThrow();
               expect(publish.mock.calls.filter(([, payload]) => payload.op === GatewayOperations.DISPATCH && payload.t === "expression_updated")).toHaveLength(
                  0,
               );
            } finally {
               publish.mockRestore();
            }
         } finally {
            await prisma.userExpression.deleteMany({ where: { expressionId: id, type: ref.type } });
            await prisma.expression.deleteMany({ where: { id, type: ref.type } });
         }
      },
      { timeout: 10000 },
   );
});
