import type { APIUser, LoginCredentials, RegisterUser } from "@huginn/shared";

import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import * as jose from "jose";

import { HuginnClient } from "../";

// Mock dependencies
const mockGateway = {
   connect: mock(() => {}),
   authenticate: mock(() => Promise.resolve({ authenticated: true, retryable: true })),
   close: mock(() => {}),
   user: undefined as APIUser | undefined,
};

const mockVoice = {
   signaling: {
      close: mock(() => {}),
   },
};

const mockREST = {
   request: mock(() => Promise.resolve({})),
};

const mockAuthAPI = {
   login: mock(() =>
      Promise.resolve({
         token: "mock_token",
         refreshToken: "mock_refresh_token",
         user: { id: "123", username: "testuser" },
      }),
   ),
   register: mock(() =>
      Promise.resolve({
         token: "mock_token",
         refreshToken: "mock_refresh_token",
         user: { id: "123", username: "testuser" },
      }),
   ),
   logout: mock(() => Promise.resolve()),
   refreshToken: mock(() =>
      Promise.resolve({
         token: "new_mock_token",
         refreshToken: "new_mock_refresh_token",
      }),
   ),
};

// Mock modules
mock.module("../gateway", () => ({
   Gateway: class {
      connect = mockGateway.connect;
      authenticate = mockGateway.authenticate;
      close = mockGateway.close;
      user = mockGateway.user;
   },
}));

mock.module("../voice", () => ({
   Voice: class {
      signaling = mockVoice.signaling;
   },
}));

mock.module("../voice-manager", () => ({
   VoiceManager: class {},
}));

mock.module("../rest", () => ({
   REST: class {
      request = mockREST.request;
   },
}));

mock.module("../rest-apis/auth", () => ({
   AuthAPI: class {
      login = mockAuthAPI.login;
      register = mockAuthAPI.register;
      logout = mockAuthAPI.logout;
      refreshToken = mockAuthAPI.refreshToken;
   },
}));

describe("HuginnClient", () => {
   let client: HuginnClient;

   beforeEach(() => {
      // Reset all mocks
      mockGateway.connect.mockClear();
      mockGateway.authenticate.mockClear();
      mockGateway.close.mockClear();
      mockVoice.signaling.close.mockClear();
      mockAuthAPI.login.mockClear();
      mockAuthAPI.register.mockClear();
      mockAuthAPI.logout.mockClear();
      mockAuthAPI.refreshToken.mockClear();
      mockGateway.user = undefined;
   });

   afterEach(() => {
      if (client) {
         client.clearSession();
      }
   });

   describe("Constructor", () => {
      test("should initialize with default options", () => {
         client = new HuginnClient();

         expect(client).toBeDefined();
         expect(client.options).toBeDefined();
         expect(client.gateway).toBeDefined();
         expect(client.voice).toBeDefined();
         expect(client.tokenHandler).toBeDefined();
         expect(mockGateway.connect).toHaveBeenCalledTimes(1);
      });

      test("should initialize all API instances", () => {
         client = new HuginnClient();

         expect(client.auth).toBeDefined();
         expect(client.users).toBeDefined();
         expect(client.channels).toBeDefined();
         expect(client.relationships).toBeDefined();
         expect(client.applications).toBeDefined();
         expect(client.common).toBeDefined();
         expect(client.oauth).toBeDefined();
      });
   });

   describe("connect()", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should successfully connect without tokens", async () => {
         mockGateway.user = { id: "123", username: "testuser" } as APIUser;
         mockGateway.authenticate.mockResolvedValue({ authenticated: true, retryable: true });

         const result = await client.connect();

         expect(result.success).toBe(true);
         expect(result.result).toBe("success");
         expect(result.retryable).toBe(false);
         expect(client.currentUser).not.toBeDefined();
      });

      test("should timeout if authentication takes too long", async () => {
         mockGateway.authenticate.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ authenticated: true, retryable: true }), 15000)),
         );

         const result = await client.connect({ timeout: 100 });

         expect(result.success).toBe(false);
         expect(result.result).toBe("timeout");
         expect(result.retryable).toBe(true);
      });

      test("should handle authentication failure", async () => {
         mockGateway.authenticate.mockResolvedValue({ authenticated: false, retryable: false });

         const result = await client.connect();

         expect(result.success).toBe(false);
         expect(result.result).toBe("authentication_failed");
         expect(result.retryable).toBe(false);
      });

      test("should restore session with valid access token", async () => {
         const futureDate = Math.floor(Date.now() / 1000) + 3600;
         const mockToken = "header." + btoa(JSON.stringify({ exp: futureDate })) + ".signature";

         spyOn(jose, "decodeJwt").mockReturnValue({ exp: futureDate });
         mockGateway.user = { id: "123", username: "testuser" } as APIUser;
         mockGateway.authenticate.mockResolvedValue({ authenticated: true, retryable: true });

         const result = await client.connect({
            tokens: { token: mockToken },
         });

         expect(result.success).toBe(true);
         expect(result.result).toBe("success");
         expect(client.tokenHandler.token).toBe(mockToken);
      });

      test("should refresh session with expired access token but valid refresh token", async () => {
         const pastDate = Math.floor(Date.now() / 1000) - 3600;
         const futureDate = Math.floor(Date.now() / 1000) + 3600;
         const expiredToken = "header." + btoa(JSON.stringify({ exp: pastDate })) + ".signature";
         const newToken = "header." + btoa(JSON.stringify({ exp: futureDate })) + ".signature";

         spyOn(jose, "decodeJwt").mockReturnValueOnce({ exp: pastDate }).mockReturnValue({ exp: futureDate });

         mockAuthAPI.refreshToken.mockResolvedValue({
            token: newToken,
            refreshToken: "new_refresh_token",
         });
         mockGateway.user = { id: "123", username: "testuser" } as APIUser;
         mockGateway.authenticate.mockResolvedValue({ authenticated: true, retryable: true });

         const result = await client.connect({
            tokens: { token: expiredToken, refreshToken: "old_refresh_token" },
         });

         expect(result.success).toBe(true);
         expect(mockAuthAPI.refreshToken).toHaveBeenCalledWith({
            refreshToken: "old_refresh_token",
         });
         expect(client.tokenHandler.token).toBe(newToken);
      });

      test("should return invalid_tokens for invalid tokens", async () => {
         spyOn(jose, "decodeJwt").mockImplementation(() => {
            throw new Error("Invalid token");
         });

         const result = await client.connect({
            tokens: { token: "invalid_token" },
         });

         expect(result.success).toBe(false);
         expect(result.result).toBe("invalid_tokens");
         expect(result.retryable).toBe(false);
      });

      test("should handle network errors during token restoration", async () => {
         mockAuthAPI.refreshToken.mockRejectedValue(new TypeError("Network request failed"));

         const result = await client.connect({
            tokens: { refreshToken: "some_token" },
         });

         expect(result.success).toBe(false);
         expect(result.result).toBe("network_error");
         expect(result.retryable).toBe(true);
      });
   });

   describe("login()", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should successfully login with credentials", async () => {
         const credentials: LoginCredentials = {
            email: "test@example.com",
            password: "password123",
         };

         const result = await client.login(credentials);

         expect(mockAuthAPI.login).toHaveBeenCalledWith(credentials);
         expect(result.token).toBe("mock_token");
         expect(result.refreshToken).toBe("mock_refresh_token");
         expect(client.tokenHandler.token).toBe("mock_token");
         expect(client.tokenHandler.refreshToken).toBe("mock_refresh_token");
      });

      test("should handle login failure", async () => {
         mockAuthAPI.login.mockRejectedValue(new Error("Invalid credentials"));

         const credentials: LoginCredentials = {
            email: "test@example.com",
            password: "wrongpassword",
         };

         expect(client.login(credentials)).rejects.toThrow("Invalid credentials");
      });
   });

   describe("register()", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should successfully register a new user", async () => {
         const userData: RegisterUser = {
            username: "newuser",
            email: "newuser@example.com",
            password: "password123",
            displayName: "newuser",
         };

         const result = await client.register(userData);

         expect(mockAuthAPI.register).toHaveBeenCalledWith(userData);
         expect(result.token).toBe("mock_token");
         expect(result.refreshToken).toBe("mock_refresh_token");
         expect(client.tokenHandler.token).toBe("mock_token");
         expect(client.tokenHandler.refreshToken).toBe("mock_refresh_token");
      });

      test("should handle registration failure", async () => {
         mockAuthAPI.register.mockRejectedValue(new Error("Username already exists"));

         const userData: RegisterUser = {
            username: "existinguser",
            email: "test@example.com",
            password: "password123",
            displayName: "existinguser",
         };

         await expect(client.register(userData)).rejects.toThrow("Username already exists");
      });
   });

   describe("logout()", () => {
      beforeEach(() => {
         client = new HuginnClient();
         client.tokenHandler.token = "some_token";
         client.tokenHandler.refreshToken = "some_refresh_token";
      });

      test("should successfully logout and cleanup", async () => {
         await client.logout();

         expect(mockAuthAPI.logout).toHaveBeenCalled();
         expect(client.tokenHandler.token).toBeUndefined();
         expect(client.tokenHandler.refreshToken).toBeUndefined();
         expect(mockVoice.signaling.close).toHaveBeenCalled();
         expect(mockGateway.close).toHaveBeenCalled();
      });

      test("should cleanup even if logout API call fails", async () => {
         mockAuthAPI.logout.mockRejectedValue(new Error("Network error"));

         await client.logout();

         expect(client.tokenHandler.token).toBeUndefined();
         expect(client.tokenHandler.refreshToken).toBeUndefined();
         expect(mockVoice.signaling.close).toHaveBeenCalled();
         expect(mockGateway.close).toHaveBeenCalled();
      });
   });

   describe("clearSession()", () => {
      beforeEach(() => {
         client = new HuginnClient();
         client.tokenHandler.token = "some_token";
         client.tokenHandler.refreshToken = "some_refresh_token";
         // @ts-expect-error - accessing private property for testing
         client._user = { id: "123", username: "testuser" } as APIUser;
      });

      test("should clear all session data", () => {
         client.clearSession();

         expect(client.tokenHandler.token).toBeUndefined();
         expect(client.tokenHandler.refreshToken).toBeUndefined();
         expect(client.currentUser).toBeUndefined();
      });
   });

   describe("generateNonce()", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should generate a valid snowflake nonce", () => {
         const nonce = client.generateNonce();

         expect(nonce).toBeDefined();
         expect(typeof nonce).toBe("string");
         expect(nonce.length).toBeGreaterThan(0);
      });

      test("should generate unique nonces", () => {
         const nonce1 = client.generateNonce();
         const nonce2 = client.generateNonce();

         expect(nonce1).not.toBe(nonce2);
      });
   });

   describe("checkUser()", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should not throw when user exists", () => {
         // @ts-expect-error - accessing private property for testing
         client._user = { id: "123", username: "testuser" } as APIUser;

         expect(() => client.checkUser()).not.toThrow();
      });

      test("should throw when user is undefined", () => {
         expect(() => client.checkUser()).toThrow("Client user is null");
      });
   });

   describe("currentUser getter", () => {
      beforeEach(() => {
         client = new HuginnClient();
      });

      test("should return undefined when no user is set", () => {
         expect(client.currentUser).toBeUndefined();
      });

      test("should return user when set", () => {
         const mockUser = { id: "123", username: "testuser" } as APIUser;
         // @ts-expect-error - accessing private property for testing
         client._user = mockUser;

         expect(client.currentUser).toBe(mockUser);
      });
   });
});
