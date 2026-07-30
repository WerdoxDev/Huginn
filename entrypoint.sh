#!/bin/sh
set -e

SOURCE_FILE="/run/secrets/backend_secrets"

WORKING_DIR="$1"
SCRIPT="$2"
RUNNER="${3:-bun}"

# Map the runtime to its "execute a package binary" command
case "$RUNNER" in
  bun)
    RUNNER_EXEC="bunx"
    ;;
  npm)
    RUNNER_EXEC="npx"
    ;;
  pnpm)
    RUNNER_EXEC="pnpm dlx"
    ;;
  yarn)
    RUNNER_EXEC="yarn dlx"
    ;;
  *)
    echo "Unknown runner '$RUNNER', defaulting RUNNER_EXEC to npx" >&2
    RUNNER_EXEC="npx"
    ;;
esac

export RUNNER_EXEC

# Write content to .env
cat "$SOURCE_FILE" > "$WORKING_DIR/.env"
cat "$SOURCE_FILE" > "packages/huginn-backend-shared/.env"

echo "Successfully wrote content of '$SOURCE_FILE' to .env"
echo "$WORKING_DIR"
echo "$SCRIPT"
echo "Runner: $RUNNER | Exec command: $RUNNER_EXEC"

(cd packages/huginn-backend-shared && $RUNNER_EXEC prisma migrate deploy) || true
# Execute the provided command
exec $RUNNER run "$SCRIPT"
