// import { describe, expect, test } from "bun:test";
// import { generateUserAccessToken, verifyToken } from "../token-handler";
// import { ITokenUser } from "@huginn/shared";

// describe("jwt", async () => {
//    test("invalid-token", async () => {
//       const testToken = "invalid token";

//       const [isValid, tokenPayload] = await verifyToken(testToken);

//       expect(isValid).toBeFalse();
//       expect(tokenPayload).toBeNull();
//    });

//    test("expired-token", async () => {
//       const testUser = { id: "123", username: "test", email: "test@gmail.com" } satisfies ITokenUser;
//       const token = await generateUserAccessToken(testUser, "1s");

//       await new Promise((resolve) => {
//          setTimeout(() => {
//             resolve(null);
//          }, 1500);
//       });

//       const [isValid, tokenPayload] = await verifyToken(token);

//       expect(isValid).toBeFalse();
//       expect(tokenPayload).toBeNull();
//    });

//    test("valid-token", async () => {
//       const testUser = { id: "123", username: "test", email: "test@gmail.com" } satisfies ITokenUser;
//       const token = await generateUserAccessToken(testUser, "5s");

//       await new Promise((resolve) => {
//          setTimeout(() => {
//             resolve(null);
//          }, 1000);
//       });

//       const [isValid, tokenPayload] = await verifyToken(token);

//       expect(isValid).toBeTrue();
//       expect(tokenPayload).toBeDefined();
//    });

//    test("null-token", async () => {
//       const testToken = null;

//       const [isValid, tokenPayload] = await verifyToken(testToken as unknown as string);

//       expect(isValid).toBeFalse();
//       expect(tokenPayload).toBeNull();
//    });
// });
