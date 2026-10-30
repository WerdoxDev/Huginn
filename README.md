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

## PostgreSQL in Docker Swarm

`docker-stack.yaml` includes PostgreSQL 18 on a private overlay network, with no published database port. Its external volume, `huginn_postgres_data`, survives stack removal. Label the node holding that volume with `huginn.postgres=true`; moving the service to another node requires moving the data too.

Before the first deployment, create the volume and two external Docker secrets on the target Swarm:

```sh
docker volume create huginn_postgres_data
docker node update --label-add huginn.postgres=true <database-node>
docker secret create postgres_password <private-password-file>
docker secret create postgres_connection <private-connection-url-file>
```

The backend image tag defaults to `postgres`; set `HUGINN_BACKEND_TAG` to override it for both the stack and build script. On a single node, `bun run deploy local` builds and runs local images without publishing them. `bun run redeploy` reuses the images already on the Docker host.

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

### Automated snapshots

The separate `huginn-backups` stack runs `docker-stack.backup.yaml` and stays running during application deployments. It makes an initial backup, then a daily backup at **02:00 UTC**, keeping **14 daily, 8 weekly, and 12 monthly** snapshots in an encrypted restic repository. It checks repository integrity and reads a random 10% of stored data weekly. It verifies a full restore into a uniquely named temporary PostgreSQL database initially and monthly, then removes that temporary database. Application writes continue during backups.

Dumps, role definitions without role passwords, and a checksum manifest are staged in a private 256 MiB memory filesystem and removed after each backup. The memory limit means a dump larger than that will fail visibly; increase `/work` and the worker memory limit before the database outgrows it. Persistent encrypted snapshots live in the external `huginn_postgres_backup_repository` volume; status and cache have separate external volumes. The worker uses PostgreSQL's network connection and has no Docker socket mount.

Bootstrap encrypted local snapshots using the current Docker context:

```sh
bun scripts/configure-postgres-backups.ts --local
```

This creates a random encryption password, stores it in Docker secret `postgres_backup_password`, and keeps a private recovery copy at `.data/postgres-backup/restic-password`. **Save that password in your password manager.** It is required to restore snapshots after losing the host. Local snapshots alone do not protect against loss of the database host. S3 replication remains explicitly unconfigured until the following AWS setup is completed.

### AWS setup for offsite backups

Use an AWS administrator in **eu-central-1** to create a CloudFormation stack from [`infra/postgres-backup.aws.yaml`](infra/postgres-backup.aws.yaml), named `huginn-postgres-backups`. Set `Instance` to `midgard` and `NotificationEmail` to your alert email. Acknowledge creation of IAM resources. The template creates:

- A dedicated private S3 bucket with Block Public Access, TLS enforcement, server-side encryption, and versioning. Previous object versions expire after 90 days; current repository objects do not have an S3 expiry rule. Restic manages snapshot retention.
- An IAM user restricted to this backup bucket's `restic/` objects and the `Huginn/PostgresBackups` CloudWatch metric namespace. It cannot delete previous S3 object versions.
- An SNS topic and CloudWatch alarms for job failures and roughly 26 hours without a fresh offsite snapshot. Confirm the SNS email subscription to receive alerts. Without an email subscription, alarms are visible in CloudWatch only.

In IAM, create an access key for the user named by the stack's `BackupUserName` output (application running outside AWS). Do not use or broaden the application's existing IAM credentials. Keep the backup credentials in a private, Git-ignored file:

```sh
cp ops/postgres-backup/config.example .env.postgres-backup
chmod 600 .env.postgres-backup
```

Fill in `RESTIC_REPOSITORY` and `AWS_DEFAULT_REGION` from the stack's `ResticRepository` and `Region` outputs, then add the restricted user's access key and secret key. Wait for initial S3 versioning setup to propagate (AWS recommends 15 minutes before first writes). Enable replication using:

```sh
bun scripts/configure-postgres-backups.ts .env.postgres-backup
```

The script builds the worker on the Docker host, rotates its configuration and AWS credential secrets without printing their values, and deploys the backup stack without publishing any images. If the Docker SSH context fails while reading system SSH configuration, append `--ssh-config ~/.ssh/config` to use your user SSH configuration directly. It preserves the encryption password and all existing local snapshots. The worker copies retained encrypted snapshots to S3, applies the same retention there, reports successful uploads to CloudWatch, and verifies restores from S3 once it is configured. Failed jobs retry hourly; scheduling and success timestamps survive restarts.

### Inspecting and recovering backups

Run these commands on the backup node, or through its Docker context:

```sh
container=$(docker ps -q --filter label=com.docker.swarm.service.name=huginn-backups_postgres-backup)
docker exec "$container" python3 /opt/backup/worker.py status
docker exec "$container" python3 /opt/backup/worker.py snapshots
docker exec "$container" python3 /opt/backup/worker.py backup
docker exec "$container" python3 /opt/backup/worker.py verify
docker service logs --tail 50 huginn-backups_postgres-backup
```

`backup` also replicates to S3 when configured. `verify` restores from S3 when configured, otherwise from the local encrypted repository. Operations are locked to prevent overlap. Status includes `offsite_configured`, each job's last success and error, and the last verified snapshot. Docker health reports failed or overdue jobs; AWS alarms detect failures and a missing host once S3 and notifications are configured. No application downtime is required for a test restore.

For disaster recovery on another machine, retrieve the backup user's AWS credentials and the restic password from your password manager. Put the credentials and repository URL in `.env.postgres-backup`, the restic password in a private file named `restic-password`, and run on that recovery machine:

```sh
mkdir -m 700 recovery
docker run --rm --env-file .env.postgres-backup \
  -e RESTIC_PASSWORD_FILE=/run/secrets/restic-password \
  -v "$PWD/restic-password:/run/secrets/restic-password:ro" \
  -v "$PWD/recovery:/restore" \
  restic/restic:0.19.1 restore latest --host huginn-postgres --tag huginn-postgres --target /restore
```

The database archive is `recovery/work/snapshot/huginn.dump`; compare its SHA-256 with `manifest.json`. Create an empty PostgreSQL 18 database and restore with `pg_restore --exit-on-error --no-owner --no-acl --dbname <empty-database> huginn.dump`. Review `roles.sql` if additional database roles are needed; it excludes role passwords. Keep the original database intact until the replacement is verified. S3 version history provides another recovery option for accidental deletion or damaged repository objects; it requires administrator access rather than the backup user's credentials.

Validate worker changes with `python -m unittest discover -s ops/postgres-backup -p '*_test.py'` and a real backup/restore check against a temporary database.


## Voice relay

The voice server issues ICE server credentials at the authenticated `GET /voice/ice-servers` endpoint. To use Cloudflare TURN, set `CLOUDFLARE_TURN_ID` and `CLOUDFLARE_TURN_TOKEN` in the **voice** environment (for a Docker deployment, in `backend_secrets`). Leave both unset to use direct voice connections. The client never needs a TURN provider key.

Clients can enable **Force relay for calls** in Audio & Video settings. It applies to the next call and prevents a direct media connection; a call fails if the instance has no working TURN relay. This setting is local to the client. The endpoint returns standard `iceServers`, so another TURN provider can be added on the server without changing clients. Cloudflare Tunnel, if used for the web API, does not relay WebRTC media.

Huginn is licensed under [GPL-3.0](LICENSE).
