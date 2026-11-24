---
title: Voice & media
description: Connect calls and manage microphones, cameras, streams, and remote media.
---

# Voice & media

Huginn's voice stack combines gateway state, a voice-signaling WebSocket, mediasoup transports, local media producers, and remote consumers.

::: info
Voice requires browser-compatible WebRTC APIs like `MediaStreamTrack` and global `fetch` for ICE server requests. Make sure your environment supports these.
:::

## Connect to a call

Authenticate the main gateway before joining voice:

```ts
const initialized = await client.initialize({ tokens });
if (!initialized.success) throw new Error(initialized.status);

// supply null for guildId if it's a DM
await client.voiceManager.connectVoice(guildId, channelId);
```

`connectVoice()` updates the gateway voice state, obtains a voice token, opens signaling, creates send and receive transports, and resolves when `client.voice.status` becomes `ready`. It can reuse a cached token younger than ten minutes. An optional third argument supplies a token directly; the gateway state update must still complete.

Gateway state confirmation and token acquisition share a 15-second deadline. Disconnecting cancels pending token requests. The deadline covers this initial phase, not the entire connection. If device or transport setup fails, the connection promise rejects and voice is disconnected.

Only one voice-signaling session is retained per user. Joining from another client replaces the previous session and closes its media transports.

Disconnecting from a voice channel is done so:

```ts
await client.voiceManager.disconnectVoice();
```

## Configure voice endpoints and TURN

For a custom instance, configure both the signaling WebSocket and the voice HTTP API:

```ts
const client = new HuginnClient({
   voice: {
      url: "wss://huginn.example/voice",
      api: "https://huginn.example/voice",
   },
});
```

Before creating each transport, the SDK fetches `${voice.api}/ice-servers` with the main access token and a ten-second timeout. The endpoint returns `{ iceServers }`, with an empty array when the instance has no TURN configuration. Setting only the WebSocket URL leaves the HTTP API on its default instance.

ICE transport policy defaults to `"all"`, which permits direct connections and continues without fetched ICE servers if the request fails. Set `voice.transportOptions.iceTransportPolicy` to `"relay"` to require TURN. Under that policy, a failed request rejects setup with `RELAY_CREDENTIALS_UNAVAILABLE`; a response without TURN servers rejects with `RELAY_NOT_CONFIGURED`.

See [VoiceOptions](/api/reference/configuration#voiceoptions) for the complete configuration, including the currently required `transportOptions.voiceApi` field, a forced-relay example, and numeric error codes.

## Observe voice status

```ts
client.voice.on("status_changed", (status) => {
   // idle | connecting | signaling | disconnected | ready
   updateCallIndicator(status);
});

client.voice.on("ready", () => startCallUI());
client.voice.on("connection_error", (error) => showCallError(error));
client.voice.on("disconnected", () => showReconnectState());
client.voice.on("reset", () => clearRemoteMedia());
```

## Microphone and camera

Acquire media in your application and pass individual tracks to the device manager:

```ts
const media = await navigator.mediaDevices.getUserMedia({
   audio: true,
   video: true,
});

await client.voice.device.openMicrophone(media.getAudioTracks()[0]);
await client.voice.device.openCamera(media.getVideoTracks()[0]);
```

Replace tracks without rebuilding the transport:

```ts
await client.voice.device.replaceMicrophoneTrack(nextAudioTrack);
await client.voice.device.replaceCameraTrack(nextVideoTrack);
```

Stop producing:

```ts
await client.voice.device.closeMicrophone();
await client.voice.device.closeCamera();
```

## Voice state

`client.voiceManager.voiceState` keeps server-visible, local-only, and per-user preference state.

```ts
// The voice state synced with other clients
await client.voiceManager.voiceState.updateGatewayVoiceState({
   isAudioMuted: true,
   isAudioDeafened: false,
});

// Pause this client's microphone without changing the shared mute flag
client.voiceManager.voiceState.updateLocalVoiceState({
   isAudioPaused: true,
});

// User volumes and muted states
client.voiceManager.voiceState.updateVoicePreferences(preferences);
```

Gateway voice-state updates are optimistic by default. Pass `false` as the second argument when the local state should change only after server confirmation.

```ts
await voiceState.updateGatewayVoiceState({ isCameraOn: true }, false);
```

The gateway flags also include `isCameraInverted`:

```ts
await client.voiceManager.voiceState.updateGatewayVoiceState({
   isCameraInverted: true,
});
```

Optimistic updates resolve even if the gateway request fails; use `false` to propagate failures. A confirmed disconnected state (`channelId: null`) preserves locally selected media flags for the next call. The full state and `gateway_voice_state_updated` payload also include `userId`, `sessionId`, `channelId`, and `guildId`.

## Video and audio streaming

Open a stream with video, audio, or both:

```ts
await client.voice.stream.openStream(videoTrack, audioTrack, {
   useSimulcast: true,
   maxVideoBitrate: 4_000_000,
   maxAudioBitrate: 128_000,
});
```

::: info
You can actually open an audio only stream for something like music sharing
:::

Bitrates are clamped to the limits in `@huginnjs/shared`. Simulcast creates low- and full-resolution video encodings.

Update a live stream:

```ts
await client.voice.stream.updateVideoParameters({
   width: 1920,
   height: 1080,
   frameRate: 30,
   maxBitrate: 4_000_000,
});

await client.voice.stream.updateAudioBitrate(128_000);
await client.voice.stream.replaceStreamVideoTrack(newVideoTrack);
```

Stream manager events report the applied values:

```ts
client.voice.stream.on("video_constraints_updated", console.log);
client.voice.stream.on("video_bitrate_updated", console.log);
client.voice.stream.on("audio_bitrate_updated", console.log);
```

Close one part or the whole stream:

```ts
await client.voice.stream.closeStreamAudio();
await client.voice.stream.closeStreamVideo();
await client.voice.stream.closeStream();
```

## Remote media

The transport tracks server-announced remote producers and locally created consumers:

```ts
client.voice.transport.on("remote_producer_created", async ({ userId, kind }) => {
   const consumer = await client.voice.transport.createConsumer(userId, kind);
   attachTrack(userId, kind, consumer.track);
});

client.voice.transport.on("consumer_closed", ({ userId, kind }) => {
   detachTrack(userId, kind);
});
```

Convenience lookups include:

```ts
client.voice.transport.getProducer("microphone");
client.voice.transport.getConsumer(userId, "camera");
client.voice.transport.getProducers();
client.voice.transport.getConsumers();
client.voice.transport.getRemoteProducers();
client.voice.transport.getRemoteConsumers();
```

## Automatic recovery

The signaling connection can resume after interruptions. The instance retains stale authenticated voice sessions for 60 seconds and keeps at most 20 messages for replay. Resume requires a valid voice token, the same user's retained session, and enough replay history after the client's last sequence number. Intentional closes, invalid sessions, and going-away closes delete the session immediately.

If mediasoup disconnects while signaling remains authenticated, the client attempts ICE restart. Observe `client.voice.transport`'s `status_changed` event for transport disconnections.

A soft signaling reset retains the resumable session and transports. A session or hard signaling reset clears transports, producers, and consumers, and clears `isCameraOn`, `isScreenSharing`, and `isAudioStreaming`. It preserves mute, deafen, camera inversion, local microphone pause, and per-user preferences. Reopen local media producers after a session or hard reset when the call is ready again.

For the low-level signaling, transport, state, and event surface, see the [Voice reference](/api/reference/voice).
