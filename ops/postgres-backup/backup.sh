#!/bin/sh
set -eu
umask 077

: "${RESTIC_REPOSITORY:?Set RESTIC_REPOSITORY to the B2 S3 repository URL}"

if [ -n "${PGPASSWORD_FILE:-}" ]; then
   PGPASSWORD=$(cat "$PGPASSWORD_FILE")
   export PGPASSWORD
fi
if [ -n "${B2_KEY_ID_FILE:-}" ]; then
   AWS_ACCESS_KEY_ID=$(cat "$B2_KEY_ID_FILE")
   export AWS_ACCESS_KEY_ID
fi
if [ -n "${B2_APPLICATION_KEY_FILE:-}" ]; then
   AWS_SECRET_ACCESS_KEY=$(cat "$B2_APPLICATION_KEY_FILE")
   export AWS_SECRET_ACCESS_KEY
fi
# Restic's S3 backend uses these variable names for B2 credentials too.
export AWS_EC2_METADATA_DISABLED=true
export PGAPPNAME=huginn-postgres-backup

backup() {
   if restic cat config > /dev/null; then
      :
   else
      status=$?
      # Initialize only a missing repository, never an access or network failure.
      if [ "$status" -ne 10 ]; then
         return "$status"
      fi
      restic init
   fi

   echo "$(date -u +%FT%TZ) Backing up PostgreSQL to B2"
   # Restic checks pg_dump's exit status before committing a snapshot.
   restic backup --host huginn-postgres --tag huginn-postgres \
      --stdin-filename huginn.dump --stdin-from-command -- \
      pg_dump --format=custom --compress=0 --no-owner --no-acl --lock-wait-timeout=30s

   restic forget --host huginn-postgres --tag huginn-postgres \
      --group-by host,paths --keep-hourly 24 --keep-daily 14 \
      --keep-weekly 8 --keep-monthly 12 --prune
   echo "$(date -u +%FT%TZ) Backup and retention complete"
}

case "${1:-run}" in
   run)
      interval=${BACKUP_INTERVAL_SECONDS:-3600}
      case "$interval" in
         ''|*[!0-9]*) echo "BACKUP_INTERVAL_SECONDS must be a positive integer" >&2; exit 1 ;;
      esac
      if [ "$interval" -le 0 ]; then
         echo "BACKUP_INTERVAL_SECONDS must be a positive integer" >&2
         exit 1
      fi
      trap 'exit 0' TERM INT
      while :; do
         backup
         sleep "$interval" &
         wait "$!"
      done
      ;;
   once) backup ;;
   restic) shift; exec restic "$@" ;;
   *) echo "Usage: backup.sh [run|once|restic <arguments...>]" >&2; exit 1 ;;
esac
