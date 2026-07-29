---
title: CDN & raw REST
description: Build asset URLs and call API routes directly.
outline: deep
---

# CDN & raw REST

The root client exposes lower-level CDN and HTTP helpers for features that do not need a typed namespace.

## CDN

`client.cdn` builds URLs against `CDNOptions.url`.

### Asset helpers

| Method | Description |
| --- | --- |
| `avatar(id, hash, options?)` | Build a user avatar URL. |
| `banner(id, hash, options?)` | Build a banner URL. |
| `channelIcon(id, hash, options?)` | Build a channel icon URL. |
| `emoji(id)` | Build an SVG emoji URL. |

```ts
const avatarUrl = client.cdn.avatar(user.id, user.avatar, {
  format: "webp",
  size: 256,
});
```

### Generic URL builders

```ts
makeURL(route, { format = "webp", size } = {}): string
```

Validates format and size using `CONSTANTS.ALLOWED_IMAGE_FORMATS` and `CONSTANTS.ALLOWED_IMAGE_SIZES`, then returns an absolute URL. Invalid values throw `RangeError`.

```ts
dynamicMakeURL(
  route,
  hash,
  { forceStatic = false, ...options } = {},
): string
```

Uses GIF format for hashes beginning with `a_`, unless `forceStatic` is true.

```ts
client.cdn.dynamicMakeURL(
  `/avatars/${user.id}/${user.avatar}`,
  user.avatar,
  { size: 512 },
);
```

## Raw REST

`client.rest` provides direct HTTP methods:

| Method | Signature |
| --- | --- |
| `get` | `get(fullRoute, options?): Promise<unknown>` |
| `post` | `post(fullRoute, options?): Promise<unknown>` |
| `put` | `put(fullRoute, options?): Promise<unknown>` |
| `patch` | `patch(fullRoute, options?): Promise<unknown>` |
| `delete` | `delete(fullRoute, options?): Promise<unknown>` |
| `request` | `request(options): Promise<unknown>` |

Use `Routes` and request types from `@huginn/shared`:

```ts
import { Routes } from "@huginn/shared";

const result = await client.rest.get(Routes.user("@me"), {
  auth: true,
});
```

Common request options include `body`, `query`, `auth`, `token`, `files`, and browser `xhr` controls. `request()` fills in the configured API root, authentication prefix, and current access token.

### Custom request

```ts
const result = await client.rest.request({
  method: "POST",
  fullRoute: "/experiments",
  auth: true,
  body: { enabled: true },
});
```

### Error handling

```ts
handleErrors(
  response,
  method,
  url,
  requestData,
): Promise<ResponseLike>
```

- `5xx` throws `HTTPError`.
- `4xx` parses `HuginnErrorData` and throws `HuginnAPIError`.
- An authenticated `401` clears the current access token.
- Other responses are returned unchanged.

`handleErrors()` is public for custom transport integrations, though ordinary calls run it automatically.

### Upload progress

When request data contains enabled `xhr` options and the code runs in a browser, REST uses `XMLHttpRequest`. This provides `onUploadProgress` and `AbortSignal` support. Other calls use the configured `makeRequest`.
