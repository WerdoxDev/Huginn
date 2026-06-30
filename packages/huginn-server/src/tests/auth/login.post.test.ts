import type { APIPostLoginResult, LoginCredentials } from "@huginn/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";

import { expectUserExactSchema } from "#tests/expect-utils";
import { createTestUsers, removeUserLater } from "#tests/utils";

describe("POST /auth/login", () => {
   test("should return 'Invalid Form Body' when body constrains are not met", () => {
      const result = testHandler("/api/auth/login", {}, "POST", {});
      expect(result).rejects.toThrow("Invalid Form Body");
   });

   test("should return 'Invalid Form Body' when credentials are incorrect", async () => {
      const [user] = await createTestUsers(1);

      const incorrectEmail: LoginCredentials = {
         email: "incorrect",
         password: user.password ?? "",
      };

      const incorrectUsername: LoginCredentials = {
         username: "incorrect",
         password: user.password ?? "",
      };

      const incorrectPasswordWithEmail: LoginCredentials = {
         email: user.email,
         password: "incorrect",
      };

      const incorrectPasswordWithUsername: LoginCredentials = {
         username: user.username,
         password: "incorrect",
      };

      const result = testHandler("/api/auth/login", {}, "POST", incorrectEmail);
      expect(result).rejects.toThrow("Invalid Form Body");

      const result2 = testHandler("/api/auth/login", {}, "POST", incorrectUsername);
      expect(result2).rejects.toThrow("Invalid Form Body");

      const result3 = testHandler("/api/auth/login", {}, "POST", incorrectPasswordWithEmail);
      expect(result3).rejects.toThrow("Invalid Form Body");

      const result4 = testHandler("/api/auth/login", {}, "POST", incorrectPasswordWithUsername);
      expect(result4).rejects.toThrow("Invalid Form Body");
   });

   test("should return a user when request is successful with username or email", async () => {
      const [user] = await createTestUsers(1);

      const withUsername: LoginCredentials = {
         username: user.username,
         password: user.password ?? "",
      };

      const withEmail: LoginCredentials = {
         email: user.email,
         password: user.password ?? "",
      };

      const result = (await testHandler("/api/auth/login", {}, "POST", withUsername)) as APIPostLoginResult;
      const result2 = (await testHandler("/api/auth/login", {}, "POST", withEmail)) as APIPostLoginResult;

      for (const res of [result, result2]) {
         expectUserExactSchema(res, { ...user, hasTokens: true });
      }
   });

   test("should return 202 with pending email for unverified users", async () => {
      const user = await prisma.user
         .createOne({
            username: "unverified_login_user",
            displayName: "unverified login user",
            email: "unverified-login-user@gmail.com",
            password: "unverified-login-pass",
         })
         .then(removeUserLater);

      const response = (await testHandler(
         "/api/auth/login",
         {},
         "POST",
         {
            email: user.email,
            password: "unverified-login-pass",
         },
         true,
      )) as Response;
      const result = (await response.json()) as { pendingEmail: string };

      expect(response.status).toBe(202);
      expect(result).toStrictEqual({ pendingEmail: user.email });
   });
});
