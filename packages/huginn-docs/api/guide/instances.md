---
title: Instance access addresses
description: Serve endpoint discovery from multiple public addresses.
---

# Instance access addresses

An instance can have multiple access addresses. Each address must route `GET /api/instance`, the API, and the gateway to the same Huginn deployment. The client tries the selected address first and, during startup, tries the remaining addresses if discovery, the API, or the gateway repeatedly fails. It does not switch while the app is in use.

The discovery response contains one stable `instanceId` and full URLs for `api`, `gateway`, `cdn`, `voice`, `posthog`, and `otlp`. Set `INSTANCE_ID` to the same value for every mirror of one deployment. Use a different value for a different deployment. Once the client has learned an instance ID, it will reject an address that returns another ID.

In **Settings → Instances**, URL overrides belong to one access address. If discovery is unavailable, setting both the API and gateway override allows that address to connect using the manually supplied URLs. This manual fallback has no server identity response to compare.

## Caddy with identical paths

If both public hosts expose the same paths, route them to the same backend services:

```caddyfile
a.example.com, b.example.com {
   reverse_proxy /api* server:3004
   reverse_proxy /gateway server:3004
   reverse_proxy /cdn* cdn:3002
   reverse_proxy /voice* voice:3003
}
```

The server uses the request `Host` and `X-Forwarded-Proto` headers to build the public URLs. With Caddy handling HTTPS, each address gets URLs on its own public host automatically. Caddy should be the trusted proxy in front of the server; do not expose the server directly when relying on forwarded headers.

## Different paths or an outer TLS proxy

Set `INSTANCE_URLS_BY_HOST` to a JSON object keyed by the public `Host` header. Each entry may provide a public `origin` and override any endpoint URL. For example:

```json
{
   "a.example.com": { "origin": "https://a.example.com" },
   "b.example.com": {
      "origin": "https://b.example.com",
      "cdn": "https://assets-b.example.com/cdn",
      "voice": "wss://calls-b.example.com/voice"
   }
}
```

When this variable is set, the endpoint rejects requests from hosts absent from the map. An `origin` is useful if HTTPS ends before traffic reaches Caddy and the forwarded protocol would otherwise be HTTP. The map can also override `api`, `gateway`, `posthog`, and `otlp`; unspecified URLs use the selected origin and standard paths. Caddy must still route each configured URL to the appropriate service and support WebSocket upgrades for the gateway and voice paths.

Voice media transport addresses are configured separately through `MEDIA_LISTEN_INFOS`. They must remain reachable from users of either access address if voice calls should work after switching.
