# Huginn

Huginn is an open-source, customizable chat app. This monorepo contains its clients, backend services, TypeScript API client, website, and documentation.

- [Website](https://huginn.dev/) · [Open in browser](https://huginn.dev/app) · [Download](https://huginn.dev/download)
- [Documentation](https://huginn.dev/docs/) · [API documentation](https://huginn.dev/docs/api/)

## Repository

| Path                                                                                                                                                                       | Contents                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [`packages/huginn-app`](packages/huginn-app)                                                                                                                               | Web, Electron desktop, and Android client   |
| [`packages/huginn-server`](packages/huginn-server), [`huginn-cdn`](packages/huginn-cdn), [`huginn-voice`](packages/huginn-voice)                                           | API, file delivery, and voice services      |
| [`packages/huginn-api`](packages/huginn-api)                                                                                                                               | Published `@huginnjs/api` TypeScript client |
| [`packages/huginn-website`](packages/huginn-website), [`huginn-docs`](packages/huginn-docs)                                                                                | Public website and documentation            |
| [`packages/huginn-tui`](packages/huginn-tui)                                                                                                                               | Terminal client                             |
| [`packages/huginn-shared`](packages/huginn-shared), [`huginn-frontend-shared`](packages/huginn-frontend-shared), [`huginn-backend-shared`](packages/huginn-backend-shared) | Shared code used across packages            |

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

Run `pnpm --dir packages/huginn-app test:run` for the app's Vitest tests, or append `<test-file>` for a focused run. These tests run in jsdom without a browser installation. Use `pnpm --dir packages/huginn-app test` for watch mode.

The `smoke` workflow runs the app tests alongside web, desktop, and Android startup smoke tests. Playwright is used only for the web and desktop startup smoke tests, available locally as `pnpm --dir packages/huginn-app smoke:web` and `smoke:electron`.

## PostgreSQL in Docker Swarm

`docker-stack.yaml` includes PostgreSQL 18 on a private overlay network, with no published database port. Its external volume, `huginn_postgres_data`, survives stack removal. Label the node holding that volume with `huginn.postgres=true`; moving the service to another node requires moving the data too.

Before the first deployment, create the volume and two external Docker secrets on the target Swarm:

```sh
docker volume create huginn_postgres_data
docker node update --label-add huginn.postgres=true <database-node>
docker secret create postgres_password <private-password-file>
docker secret create postgres_connection <private-connection-url-file>
```

The backend image references omit an explicit tag, so Docker uses `latest` for both builds and deployments. `bun run deploy` builds and pushes the application and backup images, then deploys both stacks. It requires `RESTIC_REPOSITORY` and the backup secrets described below. On a single node, `bun run deploy local` builds and runs local images without publishing them. `bun run redeploy` reuses the images already on the Docker host, redeploys the application stack, and updates the separate backup stack in place. It also requires `RESTIC_REPOSITORY` and the backup secrets described below.

Use the same password in both files. The connection secret contains a raw URL of the form `postgresql://huginn:<URL-encoded-password>@postgres:5432/huginn?sslmode=disable`. The application entrypoint exports this URL before migrations and startup, overriding the old `POSTGRESQL_URL` in `backend_secrets`. Rebuild all three backend images before deploying this stack. A failed migration stops startup and lets Swarm retry.

To export Neon, use a private environment file containing the source database's `POSTGRESQL_URL`:

```sh
bun scripts/backup-neon.ts <source.env>
```

The command selects Neon's direct endpoint and writes a private custom-format archive plus a SHA-256 checksum under `.data/backups/`. It validates the archive with `pg_restore --list` and removes partial exports after failure. Neon must allow connections for export. Pause application writers before the final export, restore into the empty PostgreSQL database, and compare table counts before switching the app. Keep the Neon source and the backup until the replacement is verified.

For subsequent PostgreSQL backups, run on the database node:

```sh
umask 077
container=$(docker ps -q --filter label=com.docker.swarm.service.name=huginn-backend_postgres)
docker exec "$container" pg_dump -U huginn -d huginn --format=custom --no-owner --no-acl > "huginn-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Keep a copy away from the database host. Stack deployment scripts currently recreate the stack, which briefly stops PostgreSQL along with the application; the external volume remains intact.

### Automated backups to Backblaze B2

The separate `huginn-backups` stack has one service, built from [`Dockerfile.huginn-backup`](Dockerfile.huginn-backup). PostgreSQL 18 Alpine supplies `pg_dump`; [`backup.sh`](ops/postgres-backup/backup.sh) streams its uncompressed custom-format output straight into restic, which encrypts, deduplicates, compresses, and uploads it to B2. There is no local backup repository or dump staging volume. Restic checks the dump process's exit status before saving a snapshot.

The service backs up immediately on startup, then waits **one hour after each completed run**. Set `BACKUP_INTERVAL_SECONDS` to change the interval. After each successful upload, it keeps **24 hourly, 14 daily, 8 weekly, and 12 monthly** snapshots and prunes unused data. Any backup or retention failure exits the process; Swarm restarts it after 60 seconds. The container runs as `postgres`, has no Docker socket mount, and uses Docker secrets for credentials.

#### Configure B2 and deploy

Create a private B2 bucket dedicated to these backups and an application key restricted to that bucket, with read, write, list, and delete access. Use the bucket's **S3 endpoint** with restic, as recommended by [restic's B2 documentation](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html#backblaze-b2). Configure B2's lifecycle to **Keep only the last version of the file**, so hidden versions of objects removed by restic are eventually deleted. Do not configure age-based deletion of current repository objects; restic manages retention.

On the target Swarm, create these secrets from private files containing only their respective values:

```sh
docker secret create postgres_backup_b2_key_id <private-b2-key-id-file>
docker secret create postgres_backup_b2_application_key <private-b2-application-key-file>
docker secret create postgres_backup_password <private-restic-password-file>
```

`postgres_password` already exists for the database. If `postgres_backup_password` already exists, reuse it and keep its recovery copy. Save the B2 key and restic password in your password manager; neither is stored in the image or stack file.

Deploy through a Swarm manager using the current Docker context:

```sh
export RESTIC_REPOSITORY='s3:https://s3.eu-central-003.backblazeb2.com/YOUR-BUCKET/restic'
bun run deploy
docker service logs --follow huginn-backups_postgres-backup
```

The deploy script builds and pushes `ghcr.io/werdoxdev/huginn-backup:b2` alongside the application images, then updates `huginn-backups` in place after deploying the application stack. Use `bun run deploy local` to build and deploy without pushing on a single-node Swarm; the build must target the node labeled `huginn.postgres=true`. `skip:huginn-backup` skips rebuilding and pushing the backup image but still deploys its stack using the existing image.

Replace the example endpoint with the bucket's actual S3 endpoint. Restic initializes an absent repository automatically, but refuses to initialize after authentication or network errors. Restic uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` internally for B2's S3 API; no AWS account or services are involved.

The backup stack remains separate from application deployments. Scheduled dumps recover to the start of a successful dump, so potential data loss includes the interval, backup duration, and any failed runs. Arrange external monitoring for missing successful backups. This service does not send alerts or automatically verify database restores.

This replaces the former AWS backup worker. Existing AWS resources and old local backup volumes are not removed by deploying the new stack. Keep their snapshots and recovery credentials until a B2 backup has been restored successfully, then retire the old resources separately.

#### Inspect and restore

On the node running the backup service:

```sh
container=$(docker ps -q --filter label=com.docker.swarm.service.name=huginn-backups_postgres-backup)
docker exec "$container" backup.sh restic snapshots --host huginn-postgres --tag huginn-postgres
docker exec "$container" backup.sh restic check --read-data-subset=10%
```

For disaster recovery, use the same image on another machine. Create a private `recovery.env` containing the repository URL and the recovered B2 credentials:

```dotenv
RESTIC_REPOSITORY=s3:https://s3.eu-central-003.backblazeb2.com/YOUR-BUCKET/restic
AWS_ACCESS_KEY_ID=YOUR_B2_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_B2_APPLICATION_KEY
```

Put the restic password in a private file named `restic-password`. Download a snapshot with:

```sh
mkdir -m 700 recovery
docker run --rm --user "$(id -u):$(id -g)" --env-file recovery.env \
  -e RESTIC_PASSWORD_FILE=/run/secrets/restic-password \
  -v "$PWD/restic-password:/run/secrets/restic-password:ro" \
  -v "$PWD/recovery:/restore" \
  ghcr.io/werdoxdev/huginn-backup:b2 restic restore latest \
  --host huginn-postgres --tag huginn-postgres --target /restore
```

The archive is `recovery/huginn.dump`. Restore it into an empty PostgreSQL 18 database with `pg_restore --exit-on-error --no-owner --no-acl --dbname <empty-database-url> recovery/huginn.dump`. The database and `huginn` role are recreated through the normal deployment setup; the dump excludes ownership and grants and does not preserve cluster roles or role passwords. Periodically restore into a disposable database and verify application data before relying on this recovery path. Keep the original database intact until the replacement is verified.

## Voice relay

The voice server issues ICE server credentials at the authenticated `GET /voice/ice-servers` endpoint. To use Cloudflare TURN, set `CLOUDFLARE_TURN_ID` and `CLOUDFLARE_TURN_TOKEN` in the **voice** environment (for a Docker deployment, in `backend_secrets`). Leave both unset to use direct voice connections. The client never needs a TURN provider key.

Clients can enable **Force relay for calls** in Audio & Video settings. It applies to the next call and prevents a direct media connection; a call fails if the instance has no working TURN relay. This setting is local to the client. The endpoint returns standard `iceServers`, so another TURN provider can be added on the server without changing clients. Cloudflare Tunnel, if used for the web API, does not relay WebRTC media.

Huginn is licensed under [GPL-3.0](LICENSE).
