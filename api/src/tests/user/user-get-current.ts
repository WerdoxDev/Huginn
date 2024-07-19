import { describe, test, expect } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("user-get-current", () => {
   test("user-get-current-successful", async () => {
      const client = await getLoggedClient();

      const result = await client.users.getCurrent();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("email");
   });
});
