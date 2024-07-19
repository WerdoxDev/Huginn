import { describe, expect, test } from "bun:test";
import { getLoggedClient, test3Credentials } from "../test-utils";
import { ChannelType } from "@shared/api-types";

describe("channel-get", () => {
   test("channel-get-by-id-invalid", async () => {
      const client = await getLoggedClient();
      const client3 = await getLoggedClient(test3Credentials);

      const channels = (await client.channels.getAll()).filter((x) => x.type === ChannelType.DM);

      expect(() => client.channels.get("invalid")).toThrow("Invalid Form Body"); // Invalid id
      expect(() => client.channels.get("000000000000000000")).toThrow("Unknown Channel"); // Unknown id
      expect(() => client3.channels.get(channels[0].id)).toThrow("Unknown Channel"); // None Existance
   });
   test("channel-get-all-successful", async () => {
      const client = await getLoggedClient();

      const channels = await client.channels.getAll();

      expect(channels).toBeDefined();
      expect(channels.length).toBeGreaterThan(0);
   });
   test("channel-get-by-id-successful", async () => {
      const client = await getLoggedClient();

      const channels = await client.channels.getAll();

      const channel = await client.channels.get(channels[0].id);
      expect(channel).toBeDefined();
   });
});
