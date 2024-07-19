import { RegisterUser } from "@shared/api-types";
import { beforeAll, describe, expect, test } from "bun:test";
import { getNewClient, url } from "../test-utils";

beforeAll(async () => {
   await fetch(`http://${url}/test/test-users`, { method: "POST" });
});

describe("auth-register", () => {
   test("auth-register-invalid", () => {
      const client = getNewClient();
      expect(() => client.register({} as RegisterUser)).toThrow("Invalid Form Body");
   });

   test("auth-register-short-username-password", () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "t",
         displayName: "test",
         email: "test@gmail.com",
         password: "t",
      };

      expect(() => client.register(user)).toThrow("Invalid Form Body");
   });

   test("auth-register-successful", async () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "test",
         displayName: "test",
         email: "test@gmail.com",
         password: "test",
      };

      await client.register(user);

      expect(client.user).toBeDefined();
   });

   test("auth-register-repeated-invalid", () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "test",
         displayName: "test",
         email: "test@gmail.com",
         password: "test",
      };

      expect(() => client.register(user)).toThrow("Invalid Form Body");
   });

   test("auth-register-second-successful", async () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "test2",
         displayName: "test2",
         email: "test2@gmail.com",
         password: "test2",
      };

      await client.register(user);

      expect(client.user).toBeDefined();
   });

   test("auth-register-third-successful", async () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "test3",
         displayName: "test3",
         email: "test3@gmail.com",
         password: "test3",
      };

      await client.register(user);

      expect(client.user).toBeDefined();
   });
   test("auth-register-fourth-successful", async () => {
      const client = getNewClient();

      const user: RegisterUser = {
         username: "test4",
         displayName: "test4",
         email: "test4@gmail.com",
         password: "test4",
      };

      await client.register(user);

      expect(client.user).toBeDefined();
   });
});
