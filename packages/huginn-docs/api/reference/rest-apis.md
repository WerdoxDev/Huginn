---
title: REST APIs
description: Complete reference for HuginnClient's typed REST namespaces.
outline: deep
---

# REST APIs

Every namespace delegates to `client.rest`, supplies the corresponding route, and returns types from `@huginn/shared`. Unless noted otherwise, methods require an authenticated access token.

## Authentication

Accessed through `client.auth`.

| Method                                                          | Returns                     | Description                                                                              |
| --------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `login(body: APIPostLoginJSONBody)`                             | `APIPostLoginResult`        | Log in without modifying client token state. Prefer `client.login()` for managed tokens. |
| `register(body: APIPostRegisterJSONBody)`                       | `APIPostRegisterResult`     | Register an account.                                                                     |
| `logout()`                                                      | `unknown`                   | Invalidate the authenticated session. Prefer `client.logout()` for cleanup.              |
| `refreshToken(body: APIPostRefreshTokenJSONBody)`               | `APIPostRefreshTokenResult` | Exchange a refresh token.                                                                |
| `sendNotificationToken(body: APIPostNotificationTokenJSONBody)` | `unknown`                   | Register a push-notification token.                                                      |

## Users

Accessed through `client.users`.

| Method                      | Returns                      | Description                                                               |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `get(userId)`               | `APIGetUserByIdResult`       | Fetch a user.                                                             |
| `getProfile(userId)`        | `APIGetProfileResult`        | Fetch a user's profile.                                                   |
| `getCurrent()`              | `APIGetCurrentUserResult`    | Fetch the authenticated user.                                             |
| `edit(body)`                | `APIPatchCurrentUserResult`  | Edit the current user. Image input in `avatar` is resolved before upload. |
| `editSettings(body)`        | `APIPatchUserSettingsResult` | Update user settings.                                                     |
| `verifyEmail(body)`         | `APIPostVerifyEmailResult`   | Submit email verification data. Authentication is not required.           |
| `resendVerificationEmail()` | `void`                       | Request another verification email.                                       |

## Channels and messages

Accessed through `client.channels`.

### Read channels

| Method                                                     | Returns                       | Description                                    |
| ---------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `get(channelId)`                                           | `APIGetChannelByIdResult`     | Fetch one channel.                             |
| `getAll()`                                                 | `APIGetUserChannelsResult`    | Fetch channels visible to the current user.    |
| `getMessage(channelId, messageId)`                         | `APIGetMessageByIdResult`     | Fetch one message.                             |
| `getMessages(channelId, limit?, before?, after?, around?)` | `APIGetChannelMessagesResult` | Fetch a message page around cursor snowflakes. |
| `getPinnedMessages(channelId, limit?, before?)`            | `APIGetChannelPinsResult`     | Fetch pinned messages.                         |

`before`, `after`, and `around` are passed as query parameters. Choose the cursor mode supported by the endpoint.

### Manage direct-message channels

| Method                                    | Returns                    | Description                                           |
| ----------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `createDM(body)`                          | `APIPostDMChannelResult`   | Create a DM channel.                                  |
| `editDM(channelId, body)`                 | `APIPatchDMChannelResult`  | Edit a DM channel and resolve an optional icon input. |
| `addRecipient(channelId, recipientId)`    | `unknown`                  | Add a recipient.                                      |
| `removeRecipient(channelId, recipientId)` | `unknown`                  | Remove a recipient.                                   |
| `deleteDM(channelId)`                     | `APIDeleteDMChannelResult` | Delete or leave a DM channel.                         |

### Send and manage messages

| Method                                                               | Returns                  | Description                                                   |
| -------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `createMessage(channelId, body, files?, onUploadProgress?, signal?)` | `APIPostMessageResult`   | Send content and optional file uploads.                       |
| `editMessage(channelId, messageId, body)`                            | `APIPatchMessageResult`  | Edit a message.                                               |
| `deleteMessage(channelId, messageId)`                                | `unknown`                | Delete a message.                                             |
| `pinMessage(channelId, messageId)`                                   | `APIPutChannelPinResult` | Pin a message.                                                |
| `unpinMessage(channelId, messageId)`                                 | `unknown`                | Remove a pin.                                                 |
| `typing(channelId)`                                                  | `unknown`                | Send a typing indicator.                                      |
| `ackMessage(channelId, messageId)`                                   | `unknown`                | Acknowledge reading a message.                                |
| `ring(channelId, recipients)`                                        | `unknown`                | Ring selected recipients, or all when `recipients` is `null`. |

In browsers, file uploads use `XMLHttpRequest` to expose upload progress and abort support.

## Reactions

Accessed through `client.messages`.

| Method                                                     | Returns | Description                              |
| ---------------------------------------------------------- | ------- | ---------------------------------------- |
| `createReaction(channelId, messageId, emojiId, emojiName)` | `void`  | Add a standard or custom emoji reaction. |
| `removeReaction(channelId, messageId, emojiId, emojiName)` | `void`  | Remove the current user's reaction.      |

Pass `emojiId: null` for a Unicode emoji. A custom emoji route key is encoded as `name:id`.

## Relationships

Accessed through `client.relationships`.

| Method                               | Returns                            | Description                                |
| ------------------------------------ | ---------------------------------- | ------------------------------------------ |
| `get(userId)`                        | `APIGetUserRelationshipByIdResult` | Fetch a relationship with one user.        |
| `getAll()`                           | `APIGetUserRelationshipsResult`    | Fetch all relationships.                   |
| `createRelationship(body)`           | `unknown`                          | Create a relationship from a typed body.   |
| `createRelationshipByUserId(userId)` | `unknown`                          | Create a relationship directly by user ID. |
| `remove(userId)`                     | `unknown`                          | Remove a relationship.                     |

## Applications

Accessed through `client.applications`.

| Method                   | Returns                         | Description                                                                 |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------- |
| `getKnown(since?: Date)` | `APIGetKnownApplicationsResult` | Fetch known applications, optionally changed since a millisecond timestamp. |
| `submitKnown(body)`      | `APIPostKnownApplicationResult` | Submit known-application metadata.                                          |
| `uploadIcon(body)`       | `APIPostApplicationIconResult`  | Upload an application icon.                                                 |

## GIFs

Accessed through `client.gifs`.

| Method                         | Returns                     | Description           |
| ------------------------------ | --------------------------- | --------------------- |
| `getCategories()`              | `APIGetGifCategoriesResult` | Fetch GIF categories. |
| `getTrending(limit?, page?)`   | `APIGetTrendingGifsResult`  | Fetch trending GIFs.  |
| `search(query, limit?, page?)` | `APIGetSearchGifsResult`    | Search GIFs.          |

```ts
const results = await client.gifs.search("raven", 30, 1);
```

## Common

Accessed through `client.common`.

| Method                       | Returns                       | Description                                                                                        |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `uniqueUsername(body)`       | `APIPostUniqueUsernameResult` | Generate or check a unique username. No authentication required.                                   |
| `changelog(version, since?)` | `APIGetChangelogResult`       | Fetch changes for `current=version`, optionally since another version. No authentication required. |

## OAuth

Accessed through `client.oauth`.

| Method                                 | Returns                     | Description                                                                                                 |
| -------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `confirmOAuth(body, identityToken)`    | `APIPostOAuthConfirmResult` | Confirm OAuth using the identity token as request authorization.                                            |
| `getOAuthURL(type, flow, redirectUrl)` | `string`                    | Build an authorization URL. Currently returns a URL for `google` and an empty string for unsupported types. |

```ts
const url = client.oauth.getOAuthURL("google", "login", `${location.origin}/auth/callback`);

location.assign(url);
```

The generated Google URL contains a random base64 state, flow, and redirect URL.

## Errors

The shared REST client:

- throws `HTTPError` for `5xx` responses;
- throws `HuginnAPIError` with decoded server error data for `4xx` responses;
- clears `tokenHandler.token` after an authenticated `401`;
- returns parsed JSON, text, or an empty response through `parseResponse`.

Use [`client.rest`](/api/reference/cdn-rest#raw-rest) when a typed namespace does not yet expose an endpoint.
