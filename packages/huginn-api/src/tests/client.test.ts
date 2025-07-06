import { describe, expect, test } from "bun:test";
import { HuginnClient } from "../huginn-client";

describe("Client", () => {
   test("should have correct default options", () => {
      const client = new HuginnClient();
      expect(client.options).toMatchSnapshot("client default options");
   });
});
