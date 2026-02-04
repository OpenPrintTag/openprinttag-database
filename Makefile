.PHONY: help setup fetch-schemas validate update-stats update-manifest import clean clean-import test editor check-node

VENV_DIR := venv
PYTHON := $(VENV_DIR)/bin/python
SCRIPTS_DIR := scripts
EDITOR_DIR := ui-editor
NODE_MIN_VERSION := 18

help:
	@echo "Material Database - Available Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup & Environment:"
	@echo "  make setup         - Set up virtual environment with dependencies"
	@echo "  make editor        - Launch the UI editor (installs deps if needed)"
	@echo ""
	@echo "Main Commands:"
	@echo "  make fetch-schemas   - Fetch JSON schemas for validation"
	@echo "  make update-stats    - Update statistics in README.md"
	@echo "  make update-manifest - Update data manifest (hash + timestamp)"
	@echo "  make validate        - Validate the material database against schemas"
	@echo "  make clean         - Clean the data directory"
	@echo "  make clean-import  - Clean data directory and import from JSON"
	@echo "  make test          - Run unit tests"
	@echo ""

setup: $(VENV_DIR)/bin/activate
	@echo "✓ Setup complete!"

$(VENV_DIR)/bin/activate:
	@echo "Setting up Python virtual environment..."
	@PYTHON_CMD=$$(python3 -c "import sys; min_ver = (3, 12); sys.exit(0 if sys.version_info >= min_ver else 1)" 2>/dev/null && echo python3 || \
	             (command -v python3.14 || command -v python3.13 || command -v python3.12 || \
	              (echo "Error: Python 3.12+ required (see pyproject.toml). Current python3 is $$(python3 --version 2>&1)" >&2; exit 1)) | head -n1); \
	$$PYTHON_CMD -m venv $(VENV_DIR)
	@echo "✓ Virtual environment created"
	@echo "Installing project in editable mode..."
	@$(VENV_DIR)/bin/pip install -q -e .
	@echo "✓ Project installed with all dependencies"

fetch-schemas:
	@bash $(SCRIPTS_DIR)/fetch_schemas.sh

update-stats:
	@echo "Updating statistics in README.md..."
	@$(PYTHON) $(SCRIPTS_DIR)/update_stats.py

update-manifest:
	@echo "Updating data manifest..."
	@$(PYTHON) $(SCRIPTS_DIR)/update_manifest.py

validate: setup fetch-schemas update-stats
	@echo "Validating material database..."
	@$(PYTHON) $(SCRIPTS_DIR)/validate_json_schema.py

clean:
	@echo "Cleaning data directory..."
	@rm -rf data/brands data/materials data/material-packages data/material-containers data/lookup-tables
	@echo "✓ Data directory cleaned!"

clean-import: clean import
	@echo "✓ Clean import complete!"

test: setup
	@echo "Running unit tests..."
	@$(PYTHON) -m unittest discover tests -v

# ============================================================================
# UI Editor
# ============================================================================

check-node:
	@echo "Checking Node.js..."
	@command -v node >/dev/null 2>&1 || { \
		echo ""; \
		echo "ERROR: Node.js is not installed."; \
		echo ""; \
		echo "Please install Node.js $(NODE_MIN_VERSION)+ from:"; \
		echo "  https://nodejs.org/"; \
		echo ""; \
		echo "Or use a version manager:"; \
		echo "  - nvm:  https://github.com/nvm-sh/nvm"; \
		echo "  - fnm:  https://github.com/Schniz/fnm"; \
		echo "  - asdf: https://asdf-vm.com/"; \
		echo ""; \
		exit 1; \
	}
	@NODE_VERSION=$$(node -v | sed 's/v//' | cut -d. -f1); \
	if [ "$$NODE_VERSION" -lt "$(NODE_MIN_VERSION)" ]; then \
		echo ""; \
		echo "ERROR: Node.js version $$(node -v) is too old."; \
		echo "       Required: v$(NODE_MIN_VERSION).0.0 or higher"; \
		echo ""; \
		echo "Please upgrade Node.js from:"; \
		echo "  https://nodejs.org/"; \
		echo ""; \
		exit 1; \
	fi
	@echo "✓ Node.js $$(node -v) detected"
	@echo "Checking pnpm..."
	@command -v pnpm >/dev/null 2>&1 || { \
		echo ""; \
		echo "pnpm is not installed. Installing via corepack..."; \
		corepack enable 2>/dev/null || npm install -g pnpm; \
	}
	@echo "✓ pnpm $$(pnpm -v) detected"

editor: check-node fetch-schemas
	@echo ""
	@echo "Starting UI Editor..."
	@echo "====================="
	@if [ ! -d "$(EDITOR_DIR)/node_modules" ]; then \
		echo "Installing dependencies (first run)..."; \
		cd $(EDITOR_DIR) && pnpm install; \
	fi
	@echo ""
	@cd $(EDITOR_DIR) && pnpm dev
