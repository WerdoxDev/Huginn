---
title: Gateway
description: Gateway connection, state, presence, voice coordination, and event methods.
outline: deep
---

# Gateway

`client.gateway` is a typed, resumable WebSocket client. Constructing it directly requires a `HuginnClient`; normal applications should use the instance attached to the client.

## State

| Member            | Type                     |
| ----------------- | ------------------------ |
| `options`         | `GatewayOptions`         |
| `socket`          | `WebSocket \| undefined` |
| `sessionId`       | `Snowflake \| undefined` |
| `status`          | `GatewayStatus`          |
| `user`            | `APIUser \| undefined`   |
| `isConnected`     | `boolean`                |
| `isAuthenticated` | `boolean`                |
| `canResume`       | `boolean`                |

`GatewayStatus` is `"disconnected" | "connecting" | "connected" | "authenticated" | "idle" | "helloed"`.

## Connection methods

### `connect()`

```ts
connect(): Promise<boolean>
```

Creates the configured socket and waits for `hello`, `disconnected`, or `reset`. Throws if a connection is already active or in progress.

### `authenticate()`

```ts
authenticate(): Promise<AuthenticationResult>
```

Resumes when `canResume` is true; otherwise identifies with the access token, intents, and client properties.

```ts
type AuthenticationResult = {
   authenticated: boolean;
   status: "success" | "authentication_failed" | "not_connected" | "network_error";
   retryable: boolean;
};
```

### `close()`

```ts
close(): void
```

Closes intentionally and prevents automatic reconnection.

### `reset()`

```ts
reset(): void
```

Clears sequence and session ID, changes status to `idle`, and emits `reset`.

## Presence

```ts
updatePresence(options: GatewayUpdatePresenceData): void
```

Sends status, overall status, and activities when authenticated. It does nothing in other states.

## Voice-state methods

### `updateVoiceState()`

```ts
updateVoiceState(
  options: GatewayVoiceStateFlags,
  channelId: Snowflake,
  guildId: Snowflake | null,
): Promise<GatewayVoiceState>
```

Sends the complete voice flags for a target channel and resolves when the current user's matching `voice_state_update` arrives.

### `sendDefaultVoiceState()`

```ts
sendDefaultVoiceState(): Promise<void>
```

Sends a null channel and guild with every media flag `false`, then waits for confirmation. `VoiceManager.disconnectVoice()` uses this to leave a call.

## Event methods

These methods come from `EventEmitter` and `SharedWebsocket`:

| Method                                    | Description                                             |
| ----------------------------------------- | ------------------------------------------------------- |
| `on(event, handler)`                      | Add a typed handler.                                    |
| `off(event, handler)`                     | Remove one handler.                                     |
| `offAll(event)`                           | Remove all handlers for one event.                      |
| `listen(event, handler)`                  | Add a handler and return its unsubscribe function.      |
| `waitForAnyEvents(events)`                | Resolve with the first `{ event, data }`.               |
| `waitForAnyEventUntil(events, predicate)` | Resolve with the first event accepted by the predicate. |

See [Gateway & events](/api/guide/gateway-events#event-catalog) for the full gateway event catalog.

## Reconnection behavior

An unintentional close cleans up heartbeat state and schedules reconnect after two seconds. Authentication resumes when enough session state remains; otherwise it identifies again. Invalid-session and authentication-failed close codes trigger a full reset.
