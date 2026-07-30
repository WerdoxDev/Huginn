---
title: Gateway & events
description: Connect to Huginn's realtime gateway and consume typed events.
---

# Gateway & events

The gateway is a resumable WebSocket connection. It delivers messages, channel changes, presence, relationships, calls, settings, and voice coordination events.

## Connect and authenticate

::: warning
Prefer `client.initialize()` for normal application startup. It connects, authenticates, and sets `currentUser`.
:::

For manual control:

```ts
const connected = await client.gateway.connect();

if (connected) {
   const auth = await client.gateway.authenticate();
   console.log(auth.authenticated, auth.status);
}
```

Calling `client.connect()` is shorthand for `client.gateway.connect()`; it does not authenticate.

## Subscribe to events

Gateway inherits the typed event-emitter methods `on`, `off`, `offAll`, and `listen`.

```ts
function onMessage(message: GatewayMessageCreateData) {
   console.log(message.content);
}

client.gateway.on("message_create", onMessage);
client.gateway.off("message_create", onMessage);
```

`listen()` returns an unsubscribe function:

```ts
const unlisten = client.gateway.listen("typing_start", ({ userId, channelId }) => {
   showTyping(userId, channelId);
});

unlisten();
```

## Event catalog

### Connection events

| Event            | Payload            | When it fires                                    |
| ---------------- | ------------------ | ------------------------------------------------ |
| `connected`      | `undefined`        | The WebSocket opens.                             |
| `disconnected`   | close code         | The socket closes without a full reset.          |
| `reconnected`    | `undefined`        | Automatic reconnect and authentication succeed.  |
| `reset`          | `undefined`        | Session state is discarded.                      |
| `status_changed` | `GatewayStatus`    | Connection status changes.                       |
| `message`        | `GatewayPayload`   | Any parsed gateway payload arrives.              |
| `send`           | `GatewayPayload`   | The client sends a payload.                      |
| `hello`          | `GatewayHelloData` | The gateway supplies heartbeat and session data. |
| `ready`          | `GatewayReadyData` | Identification succeeds.                         |
| `resumed`        | `undefined`        | A previous session resumes.                      |

### Dispatch events

| Area          | Events                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Messages      | `message_create`, `message_delete`, `message_update`, `message_ack`                                       |
| Reactions     | `message_reaction_add`, `message_reaction_remove`                                                         |
| Channels      | `channel_create`, `channel_update`, `channel_delete`, `channel_recipient_add`, `channel_recipient_remove` |
| Users         | `user_update`, `presence_update`, `typing_start`                                                          |
| Relationships | `relationship_add`, `relationship_remove`                                                                 |
| Calls         | `call_create`, `call_update`, `call_delete`, `voice_state_update`, `voice_server_update`                  |
| Account       | `settings_update`, `session_update`                                                                       |

Event payload types are defined in `@huginnjs/shared` as `GatewayWebsocketEvents`.

## Presence

Presence updates are sent only while the gateway is authenticated:

```ts
client.gateway.updatePresence({
   status: "online",
   overallStatus: "online",
   activities: [
      {
         name: "Building Huginn",
         type: 0,
      },
   ],
});
```

The request type is `GatewayUpdatePresenceData`.

## Status and session state

| Property          | Meaning                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| `status`          | `idle`, `connecting`, `connected`, `helloed`, `authenticated`, or `disconnected`. |
| `user`            | User from the ready payload, when authenticated.                                  |
| `sessionId`       | Current resumable gateway session ID.                                             |
| `socket`          | Underlying `WebSocket`, when present.                                             |
| `isConnected`     | `true` after hello or authentication.                                             |
| `isAuthenticated` | `true` after ready or resumed.                                                    |
| `canResume`       | Whether session ID, sequence, user, and token are sufficient to resume.           |

## Reconnection and shutdown

Unexpected closes schedule a reconnect after two seconds. When the client still has a user, the gateway re-authenticates and emits `reconnected`.

```ts
client.gateway.close();
```

`close()` is intentional: it prevents automatic reconnection. `reset()` clears sequence and session ID and returns the gateway to `idle`.

## Waiting for lifecycle events

Advanced code can await the first matching event:

```ts
const result = await client.gateway.waitForAnyEvents(["ready", "disconnected", "reset"]);
```

Or wait until a payload meets a predicate:

```ts
const result = await client.gateway.waitForAnyEventUntil(
   ["message_create", "disconnected"],
   (event, data) => event === "disconnected" || data.channelId === channelId,
);
```

See the [Gateway reference](/api/reference/gateway) for the complete method list.
