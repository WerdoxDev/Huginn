import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("user-get-by-id", () => {
   test("user-get-by-id-invalid", async () => {
      const client = await getLoggedClient();

      expect(() => client.users.get("invalid")).toThrow("Invalid Form Body"); // Invalid id
      expect(() => client.users.get("000000000000000000")).toThrow("Unknown User"); // Unknown id
   });
   test("user-get-by-id-successful", async () => {
      const client = await getLoggedClient();

      const result = await client.users.get(client.user?.id || "");

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty("email");
   });
});
