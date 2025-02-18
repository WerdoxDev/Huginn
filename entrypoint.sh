#!/bin/sh


SOURCE_FILE="/run/secrets/backend_secrets"

WORKING_DIR="$1"
SCRIPT="$2"

# Write content to .env
cat "$SOURCE_FILE" > $WORKING_DIR/.env

echo "Successfully wrote content of '$SOURCE_FILE' to .env"
echo $WORKING_DIR
echo $SCRIPT
# Execute the provided command
exec bun run $2
