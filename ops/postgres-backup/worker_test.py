import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location("backup_worker", Path(__file__).with_name("worker.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BackupSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.directory = Path(self.temporary.name)
        config = self.directory / "config.json"
        config.write_text(json.dumps({"repository": "", "cloudwatch": False}))
        password = self.directory / "pg-password"
        password.write_text("test-only-password")
        self.environment = patch.dict(os.environ, {
            "BACKUP_CONFIG_FILE": str(config), "PGPASSWORD_FILE": str(password),
            "BACKUP_STATE_DIR": str(self.directory / "state"),
            "BACKUP_WORK_DIR": str(self.directory / "work"),
            "RESTIC_LOCAL_REPOSITORY": str(self.directory / "repository"),
        })
        self.environment.start()
        self.worker = module.Backup()

    def tearDown(self):
        self.environment.stop()
        self.temporary.cleanup()

    def test_access_failure_does_not_initialize_repository(self):
        self.worker.restic = Mock(return_value=subprocess.CompletedProcess([], 1, b"", b"access denied"))
        with self.assertRaisesRegex(RuntimeError, "not initializing"):
            self.worker.ensure_repository("s3:https://example.invalid/private")
        self.assertEqual(self.worker.restic.call_count, 1)

    def test_failed_dump_never_creates_snapshot_and_cleans_plaintext(self):
        self.worker.ensure_repository = Mock()
        self.worker.restic = Mock()

        def broken_dump(args, **_):
            Path(args[-1]).write_bytes(b"incomplete sensitive dump")
            raise RuntimeError("pg_dump failed (exit 1)")

        self.worker.command = Mock(side_effect=broken_dump)
        self.assertFalse(self.worker.job("backup", self.worker.backup))
        self.worker.restic.assert_not_called()
        self.assertFalse((self.worker.work_dir / "snapshot" / "huginn.dump").exists())
        self.assertEqual(self.worker.state()["backup"]["result"], "failed")

    def make_restore(self, wrong_checksum=False):
        self.worker.snapshots = Mock(return_value=[{"id": "test-snapshot", "time": module.stamp()}])

        def restore(repo, *args, **_):
            target = Path(args[args.index("--target") + 1]) / str(self.worker.work_dir).lstrip("/") / "snapshot"
            target.mkdir(parents=True)
            dump = target / "huginn.dump"
            roles = target / "roles.sql"
            dump.write_bytes(b"test archive")
            roles.write_bytes(b"test roles")
            (target / "manifest.json").write_text(json.dumps({
                "sha256": "wrong" if wrong_checksum else module.digest(dump),
                "roles_sha256": module.digest(roles),
            }))
            return subprocess.CompletedProcess([], 0, b"", b"")

        self.worker.restic = Mock(side_effect=restore)

    def test_bad_restore_checksum_never_touches_database(self):
        self.make_restore(wrong_checksum=True)
        self.worker.command = Mock()
        with self.assertRaisesRegex(RuntimeError, "checksum"):
            self.worker.verify()
        self.worker.command.assert_not_called()

    def test_failed_restore_drops_only_its_temporary_database(self):
        self.make_restore()

        def command(args, **_):
            if args[0] == "pg_restore" and "--list" not in args:
                raise RuntimeError("pg_restore failed (exit 1)")
            return subprocess.CompletedProcess(args, 0, b"0", b"")

        self.worker.command = Mock(side_effect=command)
        with self.assertRaisesRegex(RuntimeError, "pg_restore"):
            self.worker.verify()
        creates = [call.args[0][-1] for call in self.worker.command.call_args_list if call.args[0][0] == "createdb"]
        drops = [call.args[0][-1] for call in self.worker.command.call_args_list if call.args[0][0] == "dropdb"]
        self.assertEqual(creates, drops)
        self.assertEqual(len(drops), 1)
        self.assertTrue(drops[0].startswith("huginn_backup_verify_"))
        self.assertNotEqual(drops[0], "huginn")

    def test_stale_backup_cannot_send_success_heartbeat(self):
        self.worker.remote = "s3:https://example.invalid/private"
        self.worker.save({"backup": {"last_success": module.stamp(module.now() - dt.timedelta(hours=27))}})
        self.worker.restic = Mock()
        self.worker.metric = Mock()
        with self.assertRaisesRegex(RuntimeError, "stale"):
            self.worker.sync()
        self.worker.restic.assert_not_called()
        self.worker.metric.assert_not_called()

    def test_missing_snapshot_in_s3_cannot_send_success_heartbeat(self):
        self.worker.remote = "s3:https://example.invalid/private"
        self.worker.save({"backup": {"last_success": module.stamp(), "details": {"snapshot": "new"}}})
        self.worker.ensure_repository = Mock()
        self.worker.restic = Mock()
        self.worker.retain = Mock()
        self.worker.snapshots = Mock(return_value=[{"id": "old", "time": module.stamp()}])
        self.worker.metric = Mock()
        with self.assertRaisesRegex(RuntimeError, "not found in S3"):
            self.worker.sync()
        self.worker.metric.assert_not_called()

    def test_enabling_s3_requires_new_restore_verification(self):
        self.worker.save({"verify": {"last_success": module.stamp(module.now() - dt.timedelta(hours=2)),
                                     "result": "ok", "details": {"repository": self.worker.local}}})
        self.worker.remote = "s3:https://example.invalid/private"
        self.assertTrue(self.worker.due("verify"))

    def test_daily_backup_is_due_after_two_utc(self):
        current = dt.datetime(2026, 10, 30, 1, 59, tzinfo=module.UTC)
        self.worker.save({"backup": {"last_success": module.stamp(current - dt.timedelta(days=1)), "result": "ok"}})
        self.assertFalse(self.worker.due("backup", current))
        self.assertTrue(self.worker.due("backup", current.replace(hour=2, minute=0)))

    def test_failed_jobs_retry_after_one_hour(self):
        current = module.now()
        self.worker.save({"backup": {"last_attempt": module.stamp(current), "result": "failed"}})
        self.assertFalse(self.worker.due("backup", current + dt.timedelta(minutes=59)))
        self.assertTrue(self.worker.due("backup", current + dt.timedelta(hours=1)))

    def test_overdue_backup_catches_up_before_scheduled_hour(self):
        current = dt.datetime(2026, 10, 30, 1, 0, tzinfo=module.UTC)
        self.worker.save({"backup": {"last_success": module.stamp(current - dt.timedelta(days=2)), "result": "ok"}})
        self.assertTrue(self.worker.due("backup", current))

    def test_manual_and_scheduled_backups_cannot_overlap(self):
        other = module.Backup()
        with self.worker.lock():
            with self.assertRaises(BlockingIOError):
                with other.lock():
                    self.fail("second operation acquired the lock")


if __name__ == "__main__":
    unittest.main()
