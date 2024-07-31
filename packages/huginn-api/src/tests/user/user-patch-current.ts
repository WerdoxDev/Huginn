import { describe, expect, test } from "bun:test";
import { editCredentials, getLoggedClient } from "../test-utils";
import { APIPatchCurrentUserJSONBody } from "@huginn/shared";
import path from "path";

describe("user-patch-current", () => {
   test("user-patch-current-password-incorrect", async () => {
      const client = await getLoggedClient();

      const edit: APIPatchCurrentUserJSONBody = {
         displayName: "test-edited",
         email: "test.edited@gmail.com",
         username: "test-edited",
         newPassword: "test-edited",
         password: "test-incorrect",
      };

      expect(() => client.users.edit(edit)).toThrow("Invalid Form Body");
   });
   test("user-patch-current-invalid-username-displayName", async () => {
      const client = await getLoggedClient();

      const edit: APIPatchCurrentUserJSONBody = {
         displayName: "t",
         email: "test.edited@gmail.com",
         username: "t",
         newPassword: "test-edited",
         password: "test",
      };

      expect(() => client.users.edit(edit)).toThrow("Invalid Form Body");
   });
   test("user-patch-current-invalid-email", async () => {
      const client = await getLoggedClient();

      const edit: APIPatchCurrentUserJSONBody = {
         displayName: "test-edited",
         email: "invalid",
         username: "test-edited",
         newPassword: "test-edited",
         password: "test",
      };

      expect(() => client.users.edit(edit)).toThrow("Invalid Form Body");
   });
   test("user-patch-current-successful", async () => {
      const client = await getLoggedClient();

      const result = await client.users.edit({
         displayName: "test-edited",
         email: "test-edited@gmail.com",
         username: "test-edited",
         newPassword: "test-edited",
         password: "test",
      });

      expect(result).toBeDefined();
   });
   test("user-patch-current-single-field-successful", async () => {
      const client = await getLoggedClient(editCredentials);

      const result = await client.users.edit({
         email: "test-edited-single@gmail.com",
      });

      expect(result.email).toBe("test-edited-single@gmail.com");
   });
   test("user-patch-current-revert-successful", async () => {
      const client = await getLoggedClient(editCredentials);

      const result = await client.users.edit({
         displayName: "test",
         email: "test@gmail.com",
         username: "test",
         newPassword: "test",
         password: "test-edited",
      });

      expect(result).toBeDefined();
   });

   test("user-patch-current-avatar", async () => {
      const client = await getLoggedClient();

      const result = await client.users.edit({ avatar: path.resolve(__dirname, "../pixel.png") });

      expect(result.avatar).toBeDefined();
      expect(result.avatar).toHaveLength(32);
   });
});
