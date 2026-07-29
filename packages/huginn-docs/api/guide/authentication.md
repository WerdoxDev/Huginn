---
title: Authentication
description: Authenticate, restore, refresh, and clear Huginn sessions.
---

# Authentication

The client owns access-token state, refreshes expiring tokens, authenticates the realtime gateway, and exposes the authenticated user through `currentUser`.

## Login

`client.login(credentials)` calls `client.auth.login()` and stores `token` and `refreshToken` when the response contains both. You can directly call `client.initialize()` with no options to authenticate the user.

```ts
const result = await client.login({
   email: "huginn@example.com",
   password: "very-stronk-password!",
});

if ("token" in result) {
   await client.initialize();
}
```

::: warning
`client.login()` will not return tokens if the user's email is not yet verified. You should check if `token` or `pendingEmail` is available and act accordingly
:::

Call `client.auth.login()` directly only when you intentionally want to manage the returned tokens yourself.

## Register

`register()` acts as a sign-up and creates a new user:

```ts
const result = await client.register({
   email: "huginn@example.com",
   username: "average-user",
   displayName: "Average User",
   password: "average-huginn-enjoyer-password",
});
```

::: warning
`client.register()` does't act like login and never returns tokens. A new user always needs to verify the returned `pendingEmail`.
:::

The exact request and response shapes come from `@huginn/shared`.

## Initialize a session

`initialize()` performs the complete startup sequence:

1. Validate a supplied access token.
2. Refresh it when invalid and a refresh token exists.
3. Connect the gateway.
4. Identify or resume the gateway session.
5. Set `client.currentUser` from the gateway ready payload.

```ts
const result = await client.initialize({
   tokens: {
      token: persisted.token,
      refreshToken: persisted.refreshToken,
   },
});

switch (result.status) {
   case "success":
      renderApplication(client.currentUser);
      break;
   case "network_error":
   case "not_connected":
   case "timeout":
      showRetry();
      break;
   case "invalid_tokens":
   case "authentication_failed":
      showLogin();
      break;
}
```

### Initialization result

| Field       | Type                   | Meaning                                                       |
| ----------- | ---------------------- | ------------------------------------------------------------- |
| `success`   | `boolean`              | Whether authentication completed.                             |
| `status`    | `InitializationStatus` | Machine-readable outcome.                                     |
| `retryable` | `boolean`              | Whether retrying without changing credentials can make sense. |

Possible statuses are `success`, `timeout`, `network_error`, `invalid_tokens`, `authentication_failed`, and `not_connected`.

## Token lifecycle

`client.tokenHandler` exposes:

| Member                  | Description                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `token`                 | Get or set the current access token. Setting a valid JWT schedules refresh shortly before expiry. |
| `refreshToken`          | Get or set the current refresh token.                                                             |
| `waitForTokenRefresh()` | Resolve after the scheduled refresh, or immediately with `false` when no refresh is pending.      |

```ts
client.tokenHandler.token = restored.token;
client.tokenHandler.refreshToken = restored.refreshToken;

const refreshed = await client.tokenHandler.waitForTokenRefresh();
```

::: warning
The scheduler needs a refresh token by the time the access token expires. If you set tokens manually, set both values together.
:::

## Validate an access token

`validateAccessToken(token)` decodes the JWT and checks its expiry. A valid token is assigned to the token handler.

```ts
if (!(await client.validateAccessToken(candidate))) {
   console.error("Token is invalid!");
}
```

This is a client-side expiry check, not proof that the server still accepts the token.

## Current user

`currentUser` is populated only after `initialize()` authenticates the gateway:

```ts
client.checkUser();
// TypeScript now knows client.currentUser is APIUser and not nullable.
console.log(client.currentUser.username);
```

`checkUser()` throws `"Client user is null"` when the client is not initialized.

## Log out and clear

```ts
await client.logout();
```

`logout()` always clears local state and closes gateway and voice connections, even if the logout request fails.

## Lower-level auth namespace

The `client.auth` namespace also provides:

```ts
await client.auth.login(body);
await client.auth.register(body);
await client.auth.logout();
await client.auth.refreshToken({ refreshToken });
await client.auth.sendNotificationToken(body);
```

See [REST APIs — Authentication](/api/reference/rest-apis#authentication) for signatures.
