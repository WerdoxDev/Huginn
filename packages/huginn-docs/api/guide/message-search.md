---
title: Message search
description: Search direct messages with content, media, author, date, and reply filters.
outline: deep
---

# Message search

Use `client.channels.searchMessages()` to search messages in DMs and group DMs. It requires an authenticated access token and only returns messages from conversations where the current user is a recipient or owner. Guild channels are excluded.

## Search messages

With an [authenticated client](/api/guide/authentication):

```ts
const messages = await client.channels.searchMessages({
   channelId,
   content: "holiday",
   has: ["image"],
   sortOrder: "desc",
   limit: 25,
});

for (const message of messages) {
   console.log(message.channelId, message.id, message.content);
}
```

Omit `channelId` to search all accessible direct conversations. All fields are optional, so `{}` returns the newest accessible messages without additional filters. Content matches a case-insensitive, literal substring; `%`, `_`, and backslashes are treated literally. Search text is not parsed into filter operators.

## Endpoint and types

```ts
client.channels.searchMessages(
   body: APIPostChannelSearchJSONBody,
): Promise<APIPostChannelSearchResult>
```

The method sends a JSON body to `POST /api/channels/@me/search`. For [raw REST](/api/reference/cdn-rest#raw-rest), use `Routes.channelSearch()` from `@huginnjs/shared`, which returns `/channels/@me/search` relative to the API root, with `auth: true`.

`APIPostChannelSearchJSONBody`, `APIPostChannelSearchResult`, `MessageSearchHas`, `MessageType`, and `Snowflake` are exported from `@huginnjs/shared`. The result is an `APIMessage[]`, with no total count or pagination wrapper. No matches returns `[]`.

## Filters

All supplied filters are combined with **AND**. Every user in `mentions` must be mentioned, and every category in `has` must match. These arrays do not mean “any of these.”

| Field                 | Type                 | Behavior                                                                                                                                                        |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content`             | `string`             | Case-insensitive substring of the message content.                                                                                                              |
| `channelId`           | `Snowflake`          | Restrict the search to one accessible DM or group DM.                                                                                                           |
| `authorId`            | `Snowflake`          | Only messages sent by this user.                                                                                                                                |
| `mentions`            | `Snowflake[]`        | Only messages mentioning every listed user.                                                                                                                     |
| `has`                 | `MessageSearchHas[]` | Require every listed content category; see below.                                                                                                               |
| `pinned`              | `boolean`            | `true` for pinned messages, `false` for unpinned messages. Omit for either.                                                                                     |
| `attachmentFilename`  | `string`             | Nonempty, case-insensitive literal substring of an attachment filename.                                                                                         |
| `attachmentExtension` | `string`             | Case-insensitive filename suffix, with or without a leading dot, such as `png`, `.png`, or `tar.gz`. Only alphanumeric segments separated by dots are accepted. |
| `embedType`           | `string`             | Nonempty, case-insensitive exact embed type, such as `image`, `video`, `rich`, or `gifv`.                                                                       |
| `minId`               | `Snowflake`          | Exclusive **before** bound: `message.id < minId`.                                                                                                               |
| `maxId`               | `Snowflake`          | Exclusive **after** bound: `message.id > maxId`.                                                                                                                |
| `repliedToUserId`     | `Snowflake`          | Only replies whose referenced message was authored by this user.                                                                                                |
| `repliedToMessageId`  | `Snowflake`          | Only replies referencing this message.                                                                                                                          |
| `types`               | `MessageType[]`      | Match any listed message type. Use the `MessageType` enum values.                                                                                               |
| `sortOrder`           | `"asc" \| "desc"`    | Sort by message ID: oldest first or newest first. Defaults to `"desc"`.                                                                                         |
| `limit`               | `number`             | Integer from `1` to `25`. Defaults to `25`.                                                                                                                     |
| `offset`              | `number`             | Number of matching messages to skip. Integer from `0` to `2_147_483_647`; defaults to `0`.                                                                      |

IDs are decimal strings within the nonnegative signed 64-bit range (`0` through `9223372036854775807`). Keep snowflakes as strings to avoid JavaScript number precision loss.

When `attachmentFilename` and `attachmentExtension` are both supplied, a single attachment must satisfy both. Reply filters only match `MessageType.REPLY`; pin notifications with a message reference are excluded. Supplying both reply filters requires the same referenced message to satisfy both.

### Content categories

| `has` value | Matches                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `image`     | An attachment with an `image/` MIME type, or an `image` or `gifv` embed.                        |
| `video`     | An attachment with a `video/` MIME type, or a `video` or `gifv` embed.                          |
| `audio`     | An attachment with an `audio/` MIME type.                                                       |
| `file`      | Any attachment, including images, videos, and audio.                                            |
| `link`      | Content containing `http://` or `https://` (case-insensitive), or an embed with a non-null URL. |
| `embed`     | Any embed.                                                                                      |

For example, `has: ["image", "file"]` requires both an image match and an attachment. An image embed without an attachment does not satisfy that search.

## Dates and ID bounds

::: warning Bound names
`minId` is the exclusive upper bound (before), and `maxId` is the exclusive lower bound (after). These names follow the search API contract.
:::

Bounds compare message IDs and do not require a stored message with that ID. Use `snowflake.getMinimum(timestamp)` to exclude a timestamp and everything after it, or `snowflake.getMaximum(timestamp)` to exclude a timestamp and everything before it.

To include all messages on a UTC calendar day:

```ts
import { snowflake } from "@huginnjs/shared";

const start = Date.parse("2026-10-01T00:00:00.000Z");
const nextDay = Date.parse("2026-10-02T00:00:00.000Z");

const messages = await client.channels.searchMessages({
   channelId,
   maxId: snowflake.getMaximum(start - 1),
   minId: snowflake.getMinimum(nextDay),
   sortOrder: "asc",
});
```

Choose timestamps in the timezone your application intends to search. The helpers accept `Date` objects or whole-millisecond timestamps in Huginn's snowflake range, beginning January 1, 2023 UTC. For a range starting at that epoch, omit `maxId` because the preceding millisecond is outside the supported range. Contradictory bounds return no matches.

## Pagination

Keep the filters and sort order fixed and increase `offset` by `limit` for each page. Stop when a page contains fewer than `limit` messages. If a page is full, another request may still return `[]`.

```ts
import type { APIPostChannelSearchJSONBody } from "@huginnjs/shared";

const query: APIPostChannelSearchJSONBody = {
   channelId,
   content: "holiday",
   sortOrder: "desc",
   limit: 25,
};

const firstPage = await client.channels.searchMessages({ ...query, offset: 0 });
const secondPage = await client.channels.searchMessages({ ...query, offset: 25 });
```

Each request searches the current messages. New or deleted matches can shift offsets between requests.

## Search in the Huginn app

Select the **Search Messages** icon in the top bar of a DM or group DM, enter text, and choose **Search** or press Enter. You can leave the text empty and use filters alone. The panel searches the current conversation.

Use **Add filter** to select **From user**, **Has**, **Date**, **Mentions**, **Pinned**, or **Attachment filename**, then confirm with **Add filter**. Multiple **Has** and **Mentions** filters require all selected values. Date filters use local calendar days: **Before** excludes the selected day, **After** excludes the selected day, and **On** includes that entire day. **Before** and **After** can form a range; **On** replaces that range. Dates start at January 1, 2023.

Results default to **Newest first**. Change the sort to **Oldest first**, use **Previous** and **Next** to page through matches, or choose **Jump** on a result to view it in the conversation.

Attachment extension, embed type, reply, and message type filters are available through the API only.

## Errors

Missing or invalid authentication returns `401 Unauthorized`. Specifying an existing channel that is inaccessible or is not a DM or group DM returns `403 Missing Access`. Invalid IDs, pagination values, or filter values return `400 Invalid Form Body`.

The typed client handles these through the standard [REST error behavior](/api/reference/rest-apis#errors).
