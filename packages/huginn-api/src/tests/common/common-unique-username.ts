import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("common-unique-username", () => {
   test("common-unique-username-taken", async () => {
      const client = await getLoggedClient();

      const result = await client.common.uniqueUsername({ username: "test" });

      expect(result.taken).toBeTrue();
   });

   test("common-unique-username-free", async () => {
      const client = await getLoggedClient();

      const result = await client.common.uniqueUsername({ username: "a-free-username" });

      expect(result.taken).toBeFalse();
   });
});
