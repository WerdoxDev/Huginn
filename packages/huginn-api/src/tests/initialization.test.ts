import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { getClient, loginClient } from "./test-utils";

const spyFetch = spyOn(globalThis, "fetch");

let tokens: { token: string; refreshToken: string };
beforeEach(async () => {
   const client = getClient();
   tokens = await loginClient(client);
});

describe("Client Initialization", () => {
   test("should fail to initialize with invalid access token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ token: "invalid" });

      expect(result).toStrictEqual({ status: false, retryable: false });
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   test("should fail to initialize with invalid refresh token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ refreshToken: "invalid" });

      expect(result).toStrictEqual({ status: false, retryable: false });
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   test("should fail to initialize with no token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({});

      expect(result).toStrictEqual({ status: false, retryable: false });
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   test("should fail to initialize with refresh token but retryable when no internet connection", async () => {
      function mockFetch() {
         // Simulate network error
         throw new TypeError("fail");
      }

      // @ts-ignore
      spyFetch.mockImplementation(mockFetch);

      const client = getClient();
      const result = await client.initializeWithToken({ refreshToken: tokens.refreshToken });

      expect(result).toStrictEqual({ status: false, retryable: true });
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
      spyFetch.mockRestore();
   });

   test("should successfully initialize with access token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ token: tokens.token });

      expect(result).toStrictEqual({ status: true, retryable: true });
      expect(client.tokenHandler.token).toBeDefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   test("should successfully initialize with refresh token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ refreshToken: tokens.refreshToken });

      expect(result).toStrictEqual({ status: true, retryable: true });
      expect(client.tokenHandler.token).toBeDefined();
      expect(client.tokenHandler.refreshToken).toBeDefined();
   });

   test("should successfully initialize with valid access token and invalid refresh token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ token: tokens.token, refreshToken: "invalid" });

      expect(result).toStrictEqual({ status: true, retryable: true });
      expect(client.tokenHandler.token).toBeDefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
   });

   test("should successfully initialize with invalid access token and valid refresh token", async () => {
      const client = getClient();
      const result = await client.initializeWithToken({ token: "invalid", refreshToken: tokens.refreshToken });

      expect(result).toStrictEqual({ status: true, retryable: true });
      expect(client.tokenHandler.token).toBeDefined();
      expect(client.tokenHandler.refreshToken).toBeDefined();
   });

   test("should initialize with login credentials successfully", async () => {
      const client = getClient();

      await client.login({ username: "internal", password: "internal" });
      expect(client.tokenHandler.token).toBeDefined();
      expect(client.tokenHandler.refreshToken).toBeDefined();
   });

   test("should logout successfully", async () => {
      const client = getClient();
      await loginClient(client);

      await client.logout();
      expect(client.tokenHandler.token).toBeUndefined();
      expect(client.tokenHandler.refreshToken).toBeUndefined();
      expect(client.currentUser).toBeUndefined();
      expect(client.gateway.socket).toBeUndefined();
      expect(client.voice.socket).toBeUndefined();

      // For some reason this is required for other tests to run successfully
      await new Promise((r) => setTimeout(r, 1000));
   });
});
