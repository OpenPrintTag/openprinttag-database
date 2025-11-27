#!/bin/bash
# Validation script that automatically uses virtual environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup..."
    bash scripts/setup.sh
fi

# Activate virtual environment and run validator
source venv/bin/activate
python scripts/validate.py
