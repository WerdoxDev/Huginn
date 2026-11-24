---
title: Voice
description: Voice facade, manager, state, device, stream, signaling, and transport reference.
outline: deep
---

# Voice

`client.voice` groups signaling, transport, device, and stream functionality. `client.voiceManager` coordinates it with the main gateway.

## Voice facade

| Property    | Type                    | Description                                              |
| ----------- | ----------------------- | -------------------------------------------------------- |
| `client`    | `HuginnClient`          | Owning client.                                           |
| `status`    | `VoiceStatus`           | Aggregate signaling and transport status.                |
| `signaling` | `VoiceSignalingClient`  | Voice WebSocket.                                         |
| `transport` | `VoiceTransportManager` | mediasoup devices, transports, producers, and consumers. |
| `device`    | `VoiceDeviceManager`    | Microphone and camera controls.                          |
| `stream`    | `VoiceStreamManager`    | Screen/application stream controls.                      |

`VoiceStatus` is `"idle" | "connecting" | "signaling" | "disconnected" | "ready"`.

### Voice events

| Event                | Payload                                               |
| -------------------- | ----------------------------------------------------- |
| `status_changed`     | `VoiceStatus`                                         |
| `connection_error`   | `Error` from device or transport setup after signaling is ready. |
| `ready`              | `undefined`                                           |
| `disconnected`       | `undefined`                                           |
| `reset`              | `undefined`                                           |
| `update_voice_state` | Internal coordination payload used by `VoiceManager`. |

## VoiceManager

### State

`client.voiceManager.voiceState` is the public `VoiceState` instance. The manager also emits `voice_token_updated` with `{ token, updatedAt }`.

### Methods

| Method                                     | Description                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectVoice(guildId, channelId, token?)` | Join a call and resolve when transport is ready. Use `null` guild ID for a direct channel call. An optional voice token replaces token acquisition but still requires the gateway state update to complete. |
| `disconnectVoice()`                        | Close signaling, cancel pending token requests, clear the cached voice token, and leave the call through the gateway. |
| `applyVoiceState()`                        | Apply gateway flags, local state, and per-user preferences to transports.                                                                                      |

`connectVoice()` requires an authenticated main gateway and rejects concurrent connection attempts or an attempt to join the same call again. It can reuse a cached token younger than ten minutes. Gateway state confirmation and token acquisition share a 15-second deadline; this does not impose a deadline on the entire connection. Device or transport setup failures emit `connection_error`, disconnect voice, and reject the connection promise.

The instance retains one voice-signaling session per user. Identifying from another client replaces the previous session and closes its media transports. See [recovery behavior](/api/guide/voice#automatic-recovery) for resume limits.

## VoiceState

### Stored state

```ts
gatewayVoiceState = {
   userId: "",
   guildId: null,
   channelId: null,
   sessionId: "",
   isAudioDeafened: false,
   isAudioMuted: false,
   isCameraOn: false,
   isCameraInverted: false,
   isScreenSharing: false,
   isAudioStreaming: false,
};

localVoiceState = {
   isAudioPaused: false,
};

voicePreferences = [];
```

### Methods

| Method                                               | Description                                              |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `updateGatewayVoiceState(update, optimistic = true)` | Merge server-visible flags and request a gateway update. |
| `resendGatewayVoiceState()`                          | Resend the current gateway state and wait for the request to complete. |
| `confirmGatewayVoiceState(confirmed)`                | Apply the confirmed `GatewayVoiceState`; preserve locally selected media flags when `channelId` is `null`. |
| `updateLocalVoiceState(update)`                      | Merge local state; `isAudioPaused` pauses the local microphone producer. |
| `updateVoicePreferences(preferences)`                | Replace per-user voice preferences.                      |

`updateGatewayVoiceState()` accepts `Partial<GatewayUpdateVoiceStateData>`, including channel/guild IDs and media flags. It ignores unchanged state. Optimistic updates change local state immediately and resolve even if the gateway request fails; pass `false` to wait for confirmation and propagate request failures. `resendGatewayVoiceState()` requests an update even when the state is unchanged and propagates request failures.

### Events

| Event                         | Payload                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `gateway_voice_state_updated` | `GatewayVoiceState`                                          |
| `local_voice_state_updated`   | `LocalVoiceState`                                            |
| `voice_preferences_updated`   | `VoicePreference[]`                                          |
| `update_gateway_voice_state`  | Internal request/callback payload handled by `VoiceManager`. |

## VoiceDeviceManager

Accessed through `client.voice.device`.

| Method                          | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| `openMicrophone(track)`         | Create a `microphone` producer.                       |
| `replaceMicrophoneTrack(track)` | Replace its track.                                    |
| `closeMicrophone()`             | Close the producer.                                   |
| `openCamera(track)`             | Create a `camera` producer with temporal scalability. |
| `replaceCameraTrack(track)`     | Replace its track.                                    |
| `closeCamera()`                 | Close the producer.                                   |

All methods return `Promise<void>`.

## VoiceStreamManager

Accessed through `client.voice.stream`.

### Open and update

| Method                                                | Description                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `openStream(videoTrack?, audioTrack?, options?)`      | Create `stream_video`, `stream_audio`, or both.             |
| `updateVideoConstraints(width?, height?, frameRate?)` | Apply constraints to the existing video track.              |
| `updateVideoBitrate(maxBitrate)`                      | Clamp and apply the maximum video bitrate to RTP encodings. |
| `updateAudioBitrate(maxBitrate)`                      | Clamp and apply the maximum audio bitrate.                  |
| `updateVideoParameters(options)`                      | Update constraints and bitrate together.                    |
| `replaceStreamVideoTrack(track)`                      | Replace stream video without recreating its producer.       |
| `replaceStreamAudioTrack(track)`                      | Replace stream audio without recreating its producer.       |

```ts
type VoiceStreamOptions = {
   useSimulcast?: boolean;
   maxVideoBitrate?: number;
   maxAudioBitrate?: number;
};
```

### Close

| Method               | Description                           |
| -------------------- | ------------------------------------- |
| `closeStreamAudio()` | Close stream audio.                   |
| `closeStreamVideo()` | Close stream video.                   |
| `closeStream()`      | Close every existing stream producer. |

### Events

| Event                       | Payload                           |
| --------------------------- | --------------------------------- |
| `video_constraints_updated` | `{ width?, height?, frameRate? }` |
| `video_bitrate_updated`     | `{ maxBitrate }`                  |
| `audio_bitrate_updated`     | `{ maxBitrate }`                  |

## VoiceTransportManager

The transport manager is public for applications that need direct mediasoup control.

### State and collections

| Member            | Type                                                  |
| ----------------- | ----------------------------------------------------- |
| `status`          | `"idle" \| "disconnected" \| "ready" \| "restarting"` |
| `device`          | `mediasoupClient.Device \| undefined`                 |
| `sendTransport`   | `Transport \| undefined`                              |
| `recvTransport`   | `Transport \| undefined`                              |
| `producers`       | `Map<HMediaKind, Producer>`                           |
| `consumers`       | `Map<string, Consumer>`                               |
| `remoteProducers` | `Map<string, ProducerData>`                           |
| `remoteConsumers` | `Map<string, ConsumerData>`                           |
| `iceTransportPolicy` | `RTCIceTransportPolicy` (defaults to `"all"`)       |

`HMediaKind` includes `microphone`, `camera`, `stream_audio`, `stream_video`, and `unknown`.

### Setup and recovery

| Method                              | Description                                         |
| ----------------------------------- | --------------------------------------------------- |
| `initializeDevice(rtpCapabilities)` | Load a mediasoup device.                            |
| `createSendTransport(options)`      | Create and wire the send transport.                 |
| `createRecvTransport(options)`      | Create and wire the receive transport.              |
| `checkAndRestartIce()`              | Restart disconnected transport ICE when applicable. |
| `cancelRestartIce()`                | Cancel restart state.                               |
| `restartIce(direction)`             | Request and apply ICE parameters for one direction. |
| `reset()`                           | Close media objects and clear transport state.      |

`checkDevice()`, `checkSendTransport()`, and `checkRecvTransport()` are assertion helpers that throw `TransportError` when required state is unavailable.

Transport creation fetches ICE servers from the voice HTTP API. Configure the initial policy with `voice.transportOptions.iceTransportPolicy`; changing the public property affects subsequently created transports. See [ICE servers and TURN](/api/reference/configuration#ice-servers-and-turn) for authentication, timeouts, and relay errors.

### Producers

| Method                                  | Description                        |
| --------------------------------------- | ---------------------------------- |
| `createProducer(kind, track, options?)` | Produce a local media track.       |
| `closeProducer(kind)`                   | Signal and close a local producer. |
| `replaceProducerTrack(kind, track)`     | Replace a local producer track.    |
| `getProducer(kind)`                     | Return one producer.               |
| `getProducers()`                        | Return every local producer.       |

### Consumers

| Method                                              | Description                                         |
| --------------------------------------------------- | --------------------------------------------------- |
| `createConsumer(userId, kind)`                      | Create and resume a consumer for a remote producer. |
| `resumeConsumer(consumerId)`                        | Resume a consumer locally and through signaling.    |
| `pauseConsumer(consumerId)`                         | Pause a consumer locally and through signaling.     |
| `closeConsumer(consumerId, skipSignalling = false)` | Close a consumer.                                   |
| `getConsumer(userId, kind)`                         | Find one consumer.                                  |
| `getConsumers()`                                    | Return every local consumer.                        |

### Remote descriptors

| Method                             | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `addRemoteProducer(producer)`      | Add a server-announced producer.            |
| `removeRemoteProducer(producerId)` | Remove it.                                  |
| `addRemoteConsumer(consumer)`      | Add a server-announced consumer descriptor. |
| `removeRemoteConsumer(consumerId)` | Remove it.                                  |
| `getRemoteProducers()`             | Return producer descriptors.                |
| `getRemoteConsumers()`             | Return consumer descriptors.                |

### Voice-state application

```ts
applyVoiceState(
  gatewayState,
  localState,
  preferences,
): Promise<void>
```

Applies mute, deafen, pause, and per-user preference changes across producers and consumers.

### Transport events

Application-relevant events include:

| Area      | Events                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Readiness | `send_transport_ready`, `recv_transport_ready`, `status_changed`, `reset`                                      |
| Producers | `producer_created`, `producer_updated`, `producer_closed`, `remote_producer_created`, `remote_producer_closed` |
| Consumers | `consumer_created`, `consumer_closed`, `remote_consumer_created`, `remote_consumer_closed`                     |

The callback-bearing `connect_transport`, `restart_ice`, `create_producer`, `close_producer`, `create_consumer`, `resume_consumer`, `pause_consumer`, and `close_consumer` events are signaling hooks already handled by `Voice`.

Observe `status_changed` for transport disconnections. The `transport_disconnected` event is declared in the current types but is never emitted.

## VoiceSignalingClient

The signaling client manages the voice WebSocket and is normally driven by `VoiceManager`.

### State

| Member           | Type                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `status`         | `connecting`, `connected`, `helloed`, `authenticated`, `resuming`, `disconnected`, or `idle` |
| `socket`         | `WebSocket \| undefined`                                                                     |
| `connectionData` | `VoiceConnectionData \| undefined`                                                           |
| `canResume`      | `boolean`                                                                                    |

### Connection and reset

| Method                               | Description                                                         |
| ------------------------------------ | ------------------------------------------------------------------- |
| `connect(token, channelId, guildId)` | Open signaling; return `Promise<boolean>` resolving on hello (`true`) or an earlier disconnection (`false`). |
| `close()`                            | Intentionally close it.                                             |
| `softReset(emitEvent = true)`        | Reset socket lifecycle state while retaining the resumable session. |
| `hardReset()`                        | Clear session and connection state.                                 |
| `checkStatus()`                      | Require connection data and status `authenticated` or `resuming`; throw otherwise. |
| `setVoiceToken(token)`               | Replace the token in current connection data.                       |

### Signaling requests

| Method                                                         | Purpose                                       |
| -------------------------------------------------------------- | --------------------------------------------- |
| `sendCreateTransport(direction)`                               | Request send or receive transport parameters. |
| `sendConnectTransport(transportId, dtlsParameters)`            | Connect a transport.                          |
| `sendCreateProducer(kind, transportId, rtpParameters)`         | Announce a producer.                          |
| `sendCloseProducer(producerId)`                                | Close a producer.                             |
| `sendCreateConsumer(producerId, transportId, rtpCapabilities)` | Request a consumer.                           |
| `sendResumeConsumer(consumerId)`                               | Resume a consumer.                            |
| `sendPauseConsumer(consumerId)`                                | Pause a consumer.                             |
| `sendCloseConsumer(consumerId)`                                | Close a consumer.                             |
| `sendRestartIce(transportId)`                                  | Request fresh ICE parameters.                 |

The signaling client emits all `VoiceWebsocketEvents` from `@huginnjs/shared`, plus `connected`, `disconnected`, `status_changed`, `reacquire_token`, and `reset`.
