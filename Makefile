.PHONY: help setup fetch-schemas validate import clean clean-import test

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
	@echo "  make fetch-schemas - Fetch JSON schemas for validation"
	@echo "  make validate      - Validate the material database against schemas"
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

validate: setup fetch-schemas
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

