#!/bin/bash

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/schema_version.conf"

if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
else
  echo "Error: $CONFIG_FILE not found"
  exit 1
fi

TEMP_DIR=".tmp_schemas"
DATA_SPARSE_PATH="data"

echo "Fetching schemas and data from commit: $SCHEMA_COMMIT"

# Clean up
rm -rf "$TEMP_DIR" "$SCHEMA_TARGET_DIR"

# Clone and checkout specific commit
git clone \
  --filter=blob:none \
  --sparse \
  --no-checkout \
  "$SCHEMA_REPO_URL" \
  "$TEMP_DIR"

cd "$TEMP_DIR"
git fetch origin "$SCHEMA_COMMIT"
git checkout "$SCHEMA_COMMIT"
git sparse-checkout set "$SCHEMA_SPARSE_PATH" "$DATA_SPARSE_PATH"
cd ..

# Create target directory structure
mkdir -p "$SCHEMA_TARGET_DIR/schema"
mkdir -p "$SCHEMA_TARGET_DIR/data"

# Copy schema files
cp -r "$TEMP_DIR/$SCHEMA_SPARSE_PATH"/* "$SCHEMA_TARGET_DIR/schema/"

# Copy data files
if [ -d "$TEMP_DIR/$DATA_SPARSE_PATH" ]; then
  cp -r "$TEMP_DIR/$DATA_SPARSE_PATH"/* "$SCHEMA_TARGET_DIR/data/"
fi

# Save metadata
echo "$SCHEMA_COMMIT" > "$SCHEMA_TARGET_DIR/.schema-version"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✓ Schemas and data updated successfully"
