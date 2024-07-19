import { describe, expect, test } from "bun:test";
import { getLoggedClient } from "../test-utils";

describe("relationship-delete", () => {
   test("relationship-delete-invalid", async () => {
      const client = await getLoggedClient();

      expect(() => client.relationships.delete("invalid")).toThrow("Invalid Form Body"); // Invalid id
      expect(() => client.relationships.delete("000000000000000000")).toThrow("Unknown Relationship"); // Unknown id
   });
   test("relationship-delete-success", async () => {
      const client = await getLoggedClient();

      const relationships = await client.relationships.getAll();

      expect(() => client.relationships.delete(relationships[0].user.id)).not.toThrow();
   });
});
