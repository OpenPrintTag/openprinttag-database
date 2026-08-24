#!/usr/bin/env bash
# Creates one branch per batch of 10 manufacturers removing the top-level
# `url:` field from material YAML files.
set -euo pipefail

MATERIALS_DIR="data/materials"
BATCH_SIZE=10
BRANCH_PREFIX="cleanup/remove-material-url"

# Collect only manufacturers that actually have files with a top-level url: field
mapfile -t MANUFACTURERS < <(
  for dir in "$MATERIALS_DIR"/*/; do
    brand=$(basename "$dir")
    if grep -rl "^url:" "$dir" &>/dev/null; then
      echo "$brand"
    fi
  done | sort
)

TOTAL=${#MANUFACTURERS[@]}
NUM_BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Found $TOTAL manufacturers with url fields → $NUM_BATCHES branches"

for (( batch=0; batch<NUM_BATCHES; batch++ )); do
  start=$(( batch * BATCH_SIZE ))
  end=$(( start + BATCH_SIZE ))
  if (( end > TOTAL )); then end=$TOTAL; fi

  slice=("${MANUFACTURERS[@]:$start:$(( end - start ))}")
  branch="${BRANCH_PREFIX}-batch-$(( batch + 1 ))"

  echo ""
  echo "=== Batch $(( batch + 1 ))/$NUM_BATCHES → $branch ==="
  echo "Manufacturers: ${slice[*]}"

  # Create branch from upstream/main
  git checkout upstream/main -b "$branch" --quiet

  # Remove url: field from all files in this batch
  for brand in "${slice[@]}"; do
    dir="$MATERIALS_DIR/$brand"
    files_with_url=()
    mapfile -t files_with_url < <(grep -rl "^url:" "$dir" 2>/dev/null || true)
    if (( ${#files_with_url[@]} > 0 )); then
      sed -i '/^url: /d' "${files_with_url[@]}"
      git add "${files_with_url[@]}"
    fi
  done

  # Build commit message listing each brand
  brands_list=$(printf '  - %s\n' "${slice[@]}")
  git commit --no-verify -m "cleanup: remove url field from material files

Remove the top-level \`url\` field from materials belonging to:
${brands_list}

The url field pointed to individual product/store pages rather than the
general concept of the filament. URLs will be reassigned to correct
conceptual links by hand in a follow-up pass." --quiet

  git push origin "$branch" --quiet
  echo "Pushed $branch"
done

echo ""
echo "All $NUM_BATCHES branches created and pushed."
