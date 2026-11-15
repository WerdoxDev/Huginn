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

| Method                            | Description               |
| --------------------------------- | ------------------------- |
| `avatar(id, hash, options?)`      | Build a user avatar URL.  |
| `banner(id, hash, options?)`      | Build a banner URL.       |
| `channelIcon(id, hash, options?)` | Build a channel icon URL. |
| `emoji(id)`                       | Build an SVG emoji URL.   |
| `asset(path)`                     | Resolve or rebase an asset URL onto the configured CDN, preserving signed query parameters. |

```ts
const avatarUrl = client.cdn.avatar(user.id, user.avatar, {
   format: "webp",
   size: 256,
});
```

The SDK and app share `resolveCdnUrl(value, cdnBase)` from `@huginnjs/shared`. It accepts bare asset paths, `/cdn/...` paths, and absolute CDN URLs, and uses the selected CDN host and path prefix. Queries and fragments are preserved. `client.cdn.asset(value)` delegates to it using the client's configured CDN. Non-HTTP URLs and invalid inputs are returned unchanged.

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
client.cdn.dynamicMakeURL(`/avatars/${user.id}/${user.avatar}`, user.avatar, { size: 512 });
```

## Raw REST

`client.rest` provides direct HTTP methods:

| Method    | Signature                                       |
| --------- | ----------------------------------------------- |
| `get`     | `get(fullRoute, options?): Promise<unknown>`    |
| `post`    | `post(fullRoute, options?): Promise<unknown>`   |
| `put`     | `put(fullRoute, options?): Promise<unknown>`    |
| `patch`   | `patch(fullRoute, options?): Promise<unknown>`  |
| `delete`  | `delete(fullRoute, options?): Promise<unknown>` |
| `request` | `request(options): Promise<unknown>`            |

Use `Routes` and request types from `@huginnjs/shared`:

```ts
import { Routes } from "@huginnjs/shared";

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

## GIF and sticker assets

`client.cdn.gif(id, ex, hm)` and `client.cdn.sticker(id, ex, hm)` build signed
asset URLs while preserving the configured CDN origin and path prefix.
`client.cdn.asset(path)` also preserves signatures returned by the server.

`GET /cdn/gifs/:id.gif?ex=…&hm=…` and
`GET /cdn/stickers/:id.webp?ex=…&hm=…` require a valid, unexpired signature
bound to the exact asset path. Both return `Cache-Control: private, no-store`.
Uploads to `POST /cdn/gifs/:id` and `/cdn/stickers/:id` require server CDN
tokens. Clients upload through the app server's `/gifs` and `/stickers` routes.
