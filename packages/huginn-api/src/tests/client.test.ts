import { describe, expect, test } from "bun:test";
import { HuginnClient } from "../huginn-client";

describe("Client", () => {
   test("should have correct default options", () => {
      const client = new HuginnClient();
      expect(client.options).toMatchInlineSnapshot(`
        {
          "cdn": {
            "url": "https://midgard.huginn.dev",
          },
          "gateway": {
            "intents": 0,
            "url": "wss://midgard.huginn.dev/gateway",
          },
          "rest": {
            "api": "https://midgard.huginn.dev/api",
            "authPrefix": "Bearer",
            "makeRequest": [Function: makeRequest],
          },
          "voice": {
            "url": "wss://midgard.huginn.dev/voice",
          },
        }
      `);
   });
});
