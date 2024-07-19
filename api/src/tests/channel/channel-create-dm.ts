import { beforeAll, describe, expect, test } from "bun:test";
import { getLoggedClient, test2Credentials, test3Credentials, url } from "../test-utils";
import { Snowflake } from "@shared/snowflake";
import { APIChannelUser, APIGroupDMChannel, APIPostDMChannelJSONBody } from "@shared/api-types";

beforeAll(async () => {
   await fetch(`http://${url}/test/test-channels`, { method: "POST" });
});

describe("channel-create-dm", () => {
   test("channel-create-dm-invalid", async () => {
      const client = await getLoggedClient();

      expect(() => client.channels.createDM({} as APIPostDMChannelJSONBody)).toThrow("Invalid Form Body"); // Invalid
      expect(() => client.channels.createDM({ recipients: [] } as APIPostDMChannelJSONBody)).toThrow("Invalid Form Body"); // Invalid id
      expect(() => client.channels.createDM({ recipients: ["000000000000000000"] })).toThrow("Unknown User"); // Unknown id
   });
   test("channel-create-single-dm-successful", async () => {
      const client = await getLoggedClient();
      const secondClient = await getLoggedClient(test2Credentials);

      const result = await client.channels.createDM({ recipients: [secondClient.user!.id] });

      expect(result).toBeDefined();
      expect(containsId(result.recipients, secondClient.user!.id)).toBe(true);
   });
   test("channel-create-group-dm-successful", async () => {
      const client = await getLoggedClient();
      const secondClient = await getLoggedClient(test2Credentials);
      const thirdClient = await getLoggedClient(test3Credentials);

      const result = (await client.channels.createDM({
         recipients: [secondClient.user!.id, thirdClient.user!.id],
      })) as APIGroupDMChannel;

      expect(result).toBeDefined();
      expect(result.ownerId).toBe(client.user!.id);
      expect(containsId(result.recipients, secondClient.user!.id)).toBe(true);
      expect(containsId(result.recipients, thirdClient.user!.id)).toBe(true);
   });
});

function containsId(recipients: APIChannelUser[], id: Snowflake) {
   return recipients.some((x) => x.id === id);
}
