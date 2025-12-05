.PHONY: help setup validate build clean build-clean fix-uuids fix-slugs transform all

VENV_DIR := venv
PYTHON := $(VENV_DIR)/bin/python
SCRIPTS_DIR := scripts

help:
	@echo "Material Database - Available Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup & Environment:"
	@echo "  make setup         - Set up virtual environment with dependencies"
	@echo ""
	@echo "Main Commands:"
	@echo "  make validate      - Validate the material database"
	@echo "  make build         - Build and flatten the database to JSON"
	@echo "  make transform     - Import JSON, fix UUIDs, and fix slugs"
	@echo "  make fix-uuids     - Fix UUIDs to match derived values"
	@echo "  make fix-slugs     - Fix duplicate slugs by appending numbers"
	@echo "  make all           - Setup, validate, and build"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         - Remove build artifacts and cache"
	@echo "  make build-clean   - Remove build output directory only"
	@echo ""

setup: $(VENV_DIR)/bin/activate
	@echo "✓ Setup complete!"

$(VENV_DIR)/bin/activate:
	@echo "Setting up Python virtual environment..."
	@python3 -m venv $(VENV_DIR)
	@echo "✓ Virtual environment created"
	@echo "Installing dependencies..."
	@$(VENV_DIR)/bin/pip install -q -r requirements.txt
	@echo "✓ Dependencies installed"

validate: setup
	@echo "Validating material database..."
	@$(PYTHON) $(SCRIPTS_DIR)/validate.py

import: setup
	@echo "Importing data from JSON..."
	@$(PYTHON) $(SCRIPTS_DIR)/import_from_json.py
	@echo "✓ Import complete!"
	@echo "Fix slugs..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_slugs.py
	@echo "✓ Fix slugs complete!"
	@echo "Fix UUIDs..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_uuids.py
	@echo "✓ Fix UUIDs complete!"

build: setup
	@echo "Building material database..."
	@$(PYTHON) $(SCRIPTS_DIR)/build.py

fix-uuids: setup
	@echo "Fixing UUIDs to match derived values..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_uuids.py

fix-slugs: setup
	@echo "Fixing duplicate slugs..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_slugs.py

transform: setup
	@echo "Transforming database (import -> fix-uuids -> fix-slugs)..."
	@echo ""
	@echo "Step 1: Importing from JSON..."
	@$(PYTHON) $(SCRIPTS_DIR)/import_from_json.py
	@echo ""
	@echo "Step 2: Fixing duplicate slugs..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_slugs.py
	@echo ""
	@echo "Step 2: Fixing UUIDs..."
	@$(PYTHON) $(SCRIPTS_DIR)/fix_uuids.py
	@echo ""
	@echo "✓ Transformation complete!"

all: setup validate build
	@echo "All tasks completed successfully!"

build-clean:
	@echo "Removing build output directory..."
	@rm -rf build
	@echo "Build output cleaned."

clean: build-clean
	@echo "Removing cache and temporary files..."
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Cache cleaned."
