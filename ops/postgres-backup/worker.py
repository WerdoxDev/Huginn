#!/usr/bin/env python3
"""Encrypted PostgreSQL snapshots, optional S3 replication, and restore checks."""

import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import uuid

UTC = dt.timezone.utc
HOST = "huginn-postgres"
TAG = "huginn-postgres"
RETENTION = ["--keep-daily", "14", "--keep-weekly", "8", "--keep-monthly", "12"]


def now():
    return dt.datetime.now(UTC)


def stamp(value=None):
    return (value or now()).isoformat()


def parse_time(value):
    return dt.datetime.fromisoformat(value) if value else None


def digest(path):
    checksum = hashlib.sha256()
    with Path(path).open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            checksum.update(chunk)
    return checksum.hexdigest()


def emit(event, **fields):
    print(json.dumps({"time": stamp(), "event": event, **fields}), flush=True)


class Backup:
    def __init__(self):
        os.umask(0o077)
        self.state_dir = Path(os.environ.get("BACKUP_STATE_DIR", "/state"))
        self.work_dir = Path(os.environ.get("BACKUP_WORK_DIR", "/work"))
        self.local = os.environ.get("RESTIC_LOCAL_REPOSITORY", "/repository")
        self.password_file = os.environ.get("RESTIC_PASSWORD_FILE", "/run/secrets/postgres_backup_password")
        self.cache_dir = os.environ.get("RESTIC_CACHE_DIR", "/cache")
        config_file = Path(os.environ.get("BACKUP_CONFIG_FILE", "/run/secrets/postgres_backup_config"))
        self.config = json.loads(config_file.read_text())
        self.remote = self.config.get("repository", "")
        if self.remote and not self.remote.startswith("s3:https://"):
            raise ValueError("Offsite repository must use S3 over HTTPS")
        self.region = self.config.get("region", "eu-central-1")
        self.instance = self.config.get("instance", "midgard")
        self.metrics = self.config.get("cloudwatch", bool(self.remote))
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.env = os.environ.copy()
        self.env["AWS_DEFAULT_REGION"] = self.region
        self.env["AWS_REGION"] = self.region
        self.env["AWS_EC2_METADATA_DISABLED"] = "true"
        self.env["PGSSLMODE"] = "disable"
        self.env["PGPASSWORD"] = Path(os.environ.get("PGPASSWORD_FILE", "/run/secrets/postgres_password")).read_text().strip()
        self.env["PGAPPNAME"] = "huginn-postgres-backup"
        self.env["PGCONNECT_TIMEOUT"] = os.environ.get("PGCONNECT_TIMEOUT", "15")
        self.env["AWS_SHARED_CREDENTIALS_FILE"] = os.environ.get("AWS_SHARED_CREDENTIALS_FILE", "/run/secrets/postgres_backup_aws")
        self.stopping = False

    def state(self):
        path = self.state_dir / "status.json"
        return json.loads(path.read_text()) if path.exists() else {}

    def save(self, state):
        state["offsite_configured"] = bool(self.remote)
        state["instance"] = self.instance
        state["updated_at"] = stamp()
        target = self.state_dir / "status.json"
        temporary = self.state_dir / "status.json.tmp"
        temporary.write_text(json.dumps(state, indent=2) + "\n")
        temporary.replace(target)

    def command(self, args, *, check=True, stdout=None, timeout=3600):
        result = subprocess.run(args, env=self.env, stdout=stdout or subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=timeout)
        if check and result.returncode:
            # pg_restore errors can contain database rows; don't expose them in logs.
            raise RuntimeError(f"{Path(args[0]).name} failed (exit {result.returncode})")
        return result

    def restic(self, repo, *args, check=True):
        return self.command(["restic", "--repo", repo, "--password-file", self.password_file,
                             "--cache-dir", self.cache_dir, "--retry-lock", "2m", *args], check=check)

    def ensure_repository(self, repo):
        result = self.restic(repo, "cat", "config", check=False)
        if result.returncode == 10:  # restic: repository does not exist
            self.restic(repo, "init", "--repository-version", "2")
        elif result.returncode:
            raise RuntimeError(f"Cannot open restic repository (exit {result.returncode}); not initializing over an access error")

    def snapshots(self, repo):
        return json.loads(self.restic(repo, "snapshots", "--json", "--host", HOST, "--tag", TAG).stdout)

    def retain(self, repo):
        self.restic(repo, "forget", "--host", HOST, "--tag", TAG, "--group-by", "host,paths", *RETENTION, "--prune")

    def metric(self, name):
        if not self.remote or not self.metrics:
            return
        import boto3
        from botocore.config import Config
        client = boto3.Session(region_name=self.region).client(
            "cloudwatch", config=Config(connect_timeout=10, read_timeout=15, retries={"max_attempts": 2}))
        client.put_metric_data(Namespace="Huginn/PostgresBackups", MetricData=[{
            "MetricName": name, "Value": 1, "Unit": "Count",
            "Dimensions": [{"Name": "Instance", "Value": self.instance}],
        }])

    def job(self, name, action):
        state = self.state()
        state.setdefault(name, {})["last_attempt"] = stamp()
        self.save(state)
        emit("job_started", job=name)
        try:
            details = action() or {}
            state = self.state()
            state[name].update(last_success=stamp(), result="ok", details=details)
            state[name].pop("error", None)
            self.save(state)
            emit("job_succeeded", job=name, **details)
            return True
        except Exception as error:
            message = str(error) if isinstance(error, (RuntimeError, ValueError)) else type(error).__name__
            state = self.state()
            state[name].update(result="failed", error=message)
            self.save(state)
            emit("job_failed", job=name, error=message)
            try:
                self.metric("BackupFailure")
            except Exception as metric_error:
                emit("alert_delivery_failed", error=type(metric_error).__name__)
            return False

    def backup(self):
        self.ensure_repository(self.local)
        with tempfile.TemporaryDirectory(prefix="snapshot-", dir=self.work_dir) as scratch:
            # Restic receives a stable path for deduplication and retention grouping.
            snapshot = self.work_dir / "snapshot"
            snapshot.mkdir(exist_ok=True)
            dump = snapshot / "huginn.dump"
            roles = snapshot / "roles.sql"
            manifest = snapshot / "manifest.json"
            try:
                self.command(["pg_dump", "--format=custom", "--compress=0", "--no-owner", "--no-acl",
                              "--lock-wait-timeout=30s", "--file", str(dump)])
                self.command(["pg_restore", "--list", str(dump)])
                with roles.open("wb") as output:
                    self.command(["pg_dumpall", "--globals-only", "--no-role-passwords"], stdout=output)
                version = self.command(["psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", "show server_version"]).stdout.decode().strip()
                manifest.write_text(json.dumps({"created_at": stamp(), "database": self.env.get("PGDATABASE", "huginn"),
                                                "server_version": version, "sha256": digest(dump),
                                                "roles_sha256": digest(roles)}, indent=2) + "\n")
                result = self.restic(self.local, "backup", "--json", "--host", HOST, "--tag", TAG, str(snapshot))
                summaries = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
                summary = next(row for row in reversed(summaries) if row.get("message_type") == "summary")
                snapshot_id = summary["snapshot_id"]
                self.retain(self.local)
                return {"snapshot": snapshot_id, "dump_bytes": dump.stat().st_size, "sha256": digest(dump)}
            finally:
                for path in (dump, roles, manifest):
                    path.unlink(missing_ok=True)

    def sync(self):
        if not self.remote:
            raise ValueError("S3 is not configured")
        backup = self.state().get("backup", {})
        success = parse_time(backup.get("last_success"))
        if not success or now() - success > dt.timedelta(hours=26):
            raise RuntimeError("Refusing to report a stale local backup as an offsite success")
        self.ensure_repository(self.remote)
        self.restic(self.remote, "copy", "--from-repo", self.local, "--from-password-file", self.password_file)
        self.retain(self.remote)
        snapshots = self.snapshots(self.remote)
        if not snapshots:
            raise RuntimeError("S3 repository has no PostgreSQL snapshots")
        latest = max(snapshots, key=lambda item: item["time"])
        source_id = backup.get("details", {}).get("snapshot")
        matching = [item for item in snapshots if source_id in (item.get("id"), item.get("original"))]
        if not matching:
            raise RuntimeError("Latest local snapshot was not found in S3 after replication")
        self.metric("OffsiteBackupSuccess")
        return {"snapshot": latest["id"], "source_snapshot": source_id, "repository": self.remote}

    def check(self):
        self.restic(self.local, "check", "--read-data-subset=10%")
        if self.remote:
            self.restic(self.remote, "check", "--read-data-subset=10%")
        return {"repository": self.remote or self.local, "data_sample": "10%"}

    def verify(self):
        repo = self.remote or self.local
        snapshots = self.snapshots(repo)
        if not snapshots:
            raise RuntimeError("No snapshot is available for restore verification")
        latest = max(snapshots, key=lambda item: item["time"])
        database = "huginn_backup_verify_" + uuid.uuid4().hex[:16]
        with tempfile.TemporaryDirectory(prefix="restore-", dir=self.work_dir) as directory:
            self.restic(repo, "restore", latest["id"], "--target", directory)
            snapshot = Path(directory) / str(self.work_dir).lstrip("/") / "snapshot"
            manifest = json.loads((snapshot / "manifest.json").read_text())
            archive = snapshot / "huginn.dump"
            if digest(archive) != manifest["sha256"] or digest(snapshot / "roles.sql") != manifest["roles_sha256"]:
                raise RuntimeError("Restored archive checksum does not match the manifest")
            self.command(["pg_restore", "--list", str(archive)])
            created = False
            try:
                self.command(["createdb", "--maintenance-db=postgres", "--", database])
                created = True
                self.command(["pg_restore", "--exit-on-error", "--no-owner", "--no-acl", "--dbname", database, str(archive)])
                count = self.command(["psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "--dbname", database,
                                      "-c", "select count(*) from pg_tables where schemaname='public'"]).stdout.decode().strip()
                if int(count) == 0:
                    raise RuntimeError("Restored database contains no application tables")
            finally:
                if created:
                    self.command(["dropdb", "--maintenance-db=postgres", "--force", "--", database])
        return {"snapshot": latest["id"], "tables": int(count), "repository": repo}

    def due(self, name, current=None):
        current = current or now()
        record = self.state().get(name, {})
        attempt = parse_time(record.get("last_attempt"))
        if attempt and current - attempt < dt.timedelta(hours=1):
            return False
        last = parse_time(record.get("last_success"))
        if not last or record.get("result") == "failed":
            return True
        if name == "backup":
            return (current - last >= dt.timedelta(hours=26)
                    or current.hour >= 2 and last.date() < current.date())
        if name == "sync":
            source = self.state().get("backup", {}).get("details", {}).get("snapshot")
            return (record.get("details", {}).get("source_snapshot") != source
                    or record.get("details", {}).get("repository") != self.remote)
        if record.get("details", {}).get("repository") != (self.remote or self.local):
            return True
        if name == "check":
            return current - last >= dt.timedelta(days=7)
        return (current.year, current.month) != (last.year, last.month) and current.hour >= 4

    def healthy(self):
        state = self.state()
        for name, maximum in (("backup", 26), ("check", 8 * 24), ("verify", 35 * 24)):
            record = state.get(name, {})
            success = parse_time(record.get("last_success"))
            if not success or now() - success > dt.timedelta(hours=maximum) or record.get("result") == "failed":
                return False
        if self.remote:
            record = state.get("sync", {})
            success = parse_time(record.get("last_success"))
            if not success or now() - success > dt.timedelta(hours=26) or record.get("result") == "failed":
                return False
        return True

    @contextlib.contextmanager
    def lock(self):
        with (self.state_dir / "operation.lock").open("a") as handle:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            try:
                yield
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)

    def run(self):
        signal.signal(signal.SIGTERM, lambda *_: setattr(self, "stopping", True))
        signal.signal(signal.SIGINT, lambda *_: setattr(self, "stopping", True))
        emit("scheduler_started", backup_time="02:00 UTC", offsite_configured=bool(self.remote),
             retention={"daily": 14, "weekly": 8, "monthly": 12})
        if not self.remote:
            emit("aws_setup_required", message="Snapshots are encrypted locally; offsite replication and AWS alerts await configuration")
        while not self.stopping:
            try:
                with self.lock():
                    jobs = ["backup"] + (["sync"] if self.remote else []) + ["check", "verify"]
                    for name in jobs:
                        if self.stopping:
                            break
                        if self.due(name):
                            self.job(name, getattr(self, name))
            except BlockingIOError:
                pass  # A manual operation is already running.
            for _ in range(60):
                if self.stopping:
                    break
                time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["run", "backup", "sync", "check", "verify", "snapshots", "status", "health"])
    action = parser.parse_args().action
    worker = Backup()
    if action == "run":
        worker.run()
    elif action == "status":
        print(json.dumps(worker.state(), indent=2))
    elif action == "health":
        return 0 if worker.healthy() else 1
    elif action == "snapshots":
        print(json.dumps(worker.snapshots(worker.remote or worker.local), indent=2))
    else:
        with worker.lock():
            success = worker.job(action, getattr(worker, action))
            if action == "backup" and success and worker.remote:
                success = worker.job("sync", worker.sync)
            return 0 if success else 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except BlockingIOError:
        emit("operation_busy", message="Another backup operation holds the lock; retry later")
        sys.exit(75)
    except Exception as error:
        emit("fatal", error=type(error).__name__)
        sys.exit(1)
