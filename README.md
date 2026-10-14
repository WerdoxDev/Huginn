# Huginn

Huginn is an open-source, customizable chat app. This monorepo contains its clients, backend services, TypeScript API client, website, and documentation.

- [Website](https://huginn.dev/) · [Open in browser](https://huginn.dev/app) · [Download](https://huginn.dev/download)
- [Documentation](https://huginn.dev/docs/) · [API documentation](https://huginn.dev/docs/api/)

## Repository

| Path | Contents |
| --- | --- |
| [`packages/huginn-app`](packages/huginn-app) | Web, Electron desktop, and Android client |
| [`packages/huginn-server`](packages/huginn-server), [`huginn-cdn`](packages/huginn-cdn), [`huginn-voice`](packages/huginn-voice) | API, file delivery, and voice services |
| [`packages/huginn-api`](packages/huginn-api) | Published `@huginnjs/api` TypeScript client |
| [`packages/huginn-website`](packages/huginn-website), [`huginn-docs`](packages/huginn-docs) | Public website and documentation |
| [`packages/huginn-tui`](packages/huginn-tui) | Terminal client |
| [`packages/huginn-shared`](packages/huginn-shared), [`huginn-frontend-shared`](packages/huginn-frontend-shared), [`huginn-backend-shared`](packages/huginn-backend-shared) | Shared code used across packages |

## Development

The workspace uses [pnpm](https://pnpm.io/) for dependencies and [Bun](https://bun.sh/) for several package scripts. From the repository root:

```sh
pnpm install
pnpm --filter @huginn/website dev
```

To run the website and browser app on one local origin, use:

```sh
bun run dev:browser
```

Open `http://localhost:5173` for the website or `http://localhost:5173/app/` for the app. The website dev server proxies `/app/*` to the app dev server, so both pages share cookies and browser storage. Browser OAuth callbacks use `http://localhost:5173/redirect` in development.

To work on the documentation, run `pnpm --filter @huginn/docs docs:dev`. Package-specific scripts and configuration are in each package's `package.json`.

## Voice relay

The voice server issues ICE server credentials at the authenticated `GET /voice/ice-servers` endpoint. To use Cloudflare TURN, set `CLOUDFLARE_TURN_ID` and `CLOUDFLARE_TURN_TOKEN` in the **voice** environment (for a Docker deployment, in `backend_secrets`). Leave both unset to use direct voice connections. The client never needs a TURN provider key.

Clients can enable **Force relay for calls** in Audio & Video settings. It applies to the next call and prevents a direct media connection; a call fails if the instance has no working TURN relay. This setting is local to the client. The endpoint returns standard `iceServers`, so another TURN provider can be added on the server without changing clients. Cloudflare Tunnel, if used for the web API, does not relay WebRTC media.

Huginn is licensed under [GPL-3.0](LICENSE).
