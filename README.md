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

To work on the documentation, run `pnpm --filter @huginn/docs docs:dev`. Package-specific scripts and configuration are in each package's `package.json`.

Huginn is licensed under [GPL-3.0](LICENSE).
