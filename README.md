> ### BEFORE_PUBLISHING
> - Remove import scripts from Directus db
> - Document the role of the UI editor in this repo
> - Squash commits

# OpenPrintTag Material Database

An open-source material database for 3D printing, maintained by the community as part of the [OpenPrintTag](https://openprinttag.org) initiative.

## Overview

This repository contains a comprehensive, community-driven database of 3D printing materials, brands, and packaging information stored in a plain, well-structured YAML format. The database is designed for both personal and commercial use, enabling anyone to:

- Access detailed material specifications and properties
- Contribute new materials and brands
- Build applications and services using standardized material data
- Integrate with OpenPrintTag-compatible systems

All data strictly adheres to the format defined by the [OpenPrintTag Architecture](https://github.com/OpenPrintTag/openprinttag-architecture). For complete schema documentation, see [arch.openprinttag.org](https://arch.openprinttag.org/#/).

## Key Features

- **Open and Accessible**: Free to use for personal and commercial applications
- **Human-Readable**: YAML format with descriptive naming conventions
- **Git-Friendly**: One file per entity enables clear diffs and easy reviews
- **Community-Driven**: Open to contributions from manufacturers, users, and developers
- **Validated**: Strict schema validation against OpenPrintTag standards
- **Tech-Agnostic**: Can be imported into any database system or application

## Data Structure

```
data/
├── brands/                   # Material manufacturers and suppliers
├── materials/                # Material definitions (organized by brand)
├── material-packages/        # Physical products (spools, bottles, etc.)
└── material-containers/      # Container specifications (spool dimensions, etc.)
```

### Entity Types

#### Brands
Define material manufacturers and suppliers.

**Location**: `data/brands/{slug}.yaml`

Example: `data/brands/prusament.yaml`

#### Materials
Individual material definitions with properties and specifications.

**Location**: `data/materials/{brand-slug}/{material-slug}.yaml`

Example: `data/materials/prusament/prusament-pla-galaxy-black.yaml`

#### Material Packages
Physical products containing materials (spools, bottles, etc.) with GTINs/barcodes.

**Location**: `data/material-packages/{brand-slug}/{package-slug}.yaml`

Example: `data/material-packages/prusament/prusament-pla-galaxy-black-1kg.yaml`

#### Material Containers
Spool and container specifications (dimensions, weight, capacity).

**Location**: `data/material-containers/{slug}.yaml`

Example: `data/material-containers/1000g.yaml`

## File Naming Convention

All entity files use **slugified, human-readable names**:

- Lowercase alphanumeric characters
- Words separated by hyphens
- Example: `prusament-pla-galaxy-black.yaml`

## Getting Started

### Prerequisites

- Python 3.12 or higher
- Git

### Setup

First-time setup to install dependencies:

```bash
make setup
```

This creates a Python virtual environment and installs all required dependencies from `pyproject.toml`.

### Fetch Schemas

Before validating or importing data, fetch the latest OpenPrintTag schemas:

```bash
make fetch-schemas
```

This downloads the schema definitions from the [openprinttag-architecture](https://github.com/OpenPrintTag/openprinttag-architecture) repository at the version specified in `schema_version.conf`.

### Validation

Validate all data files against the OpenPrintTag schema:

```bash
make validate
```

The validator checks:
- Required fields presence
- Field type correctness
- Reference integrity (brand_slug, material_slug, etc.)
- Enum value validity
- UUID format and derivation
- Pattern matching (GTINs, URLs, etc.)

### Import Data

Import data from JSON format (generates correct UUIDs):

```bash
make import
```

### Run Tests

Execute unit tests:

```bash
make test
```

### All Commands

See all available commands:

```bash
make help
```

## Workflow

The typical workflow for working with the database:

1. **Setup**: `make setup` - Install dependencies (first time only)
2. **Fetch schemas**: `make fetch-schemas` - Download latest OpenPrintTag schemas
3. **Validate**: `make validate` - Ensure data integrity before making changes
4. **Make changes**: Edit YAML files in the `data/` directory
5. **Validate again**: `make validate` - Verify your changes
6. **Test**: `make test` - Run unit tests
7. **Commit**: Create a pull request with your changes

## Schema Dependency

This project directly depends on the [OpenPrintTag Architecture](https://github.com/OpenPrintTag/openprinttag-architecture) repository for schema validation. The specific schema version is configured in `schema_version.conf`:

```bash
# OpenPrintTag Schema Configuration
SCHEMA_REPO_URL="https://github.com/OpenPrintTag/openprinttag-architecture.git"
SCHEMA_COMMIT="f5cce6db9f75ed215de0eb707af87e6596575fdd"
SCHEMA_SPARSE_PATH="schema/generated/opt_db_schema"
SCHEMA_TARGET_DIR="./openprinttag"
```

To update to a newer schema version, modify the `SCHEMA_COMMIT` in this file and run `make fetch-schemas`.

## Contributing

We welcome contributions from the community! Whether you're a material manufacturer, a 3D printing enthusiast, or a developer, your contributions help make this database more comprehensive and valuable for everyone.

### How to Contribute

Detailed contributing guidelines will be published soon. For now:

1. Fork the repository
2. Create a feature branch
3. Add or update YAML files in the `data/` directory
4. Run `make validate` to ensure your changes conform to the schema
5. Submit a pull request
6. Ensure your pull request passes the automated validation GitHub Action hook

### Adding a New Material

1. Ensure the brand exists in `data/brands/` (or create it)
2. Create a material file: `data/materials/{brand-slug}/{material-slug}.yaml`
3. Optionally add material packages: `data/material-packages/{brand-slug}/{package-slug}.yaml`
4. Run `make validate` to verify
5. Submit a pull request

### Adding a New Brand

1. Create a brand file: `data/brands/{brand-slug}.yaml`
2. Create brand subdirectories in `materials/` and `material-packages/` as needed
3. Add materials and packages
4. Run `make validate` to verify
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright 2025 PRUSA RESEARCH A.S.

## Resources

- **OpenPrintTag Website**: [openprinttag.org](https://openprinttag.org)
- **Architecture Documentation**: [arch.openprinttag.org](https://arch.openprinttag.org/#/)
- **Schema Repository**: [github.com/OpenPrintTag/openprinttag-architecture](https://github.com/OpenPrintTag/openprinttag-architecture)

## Community

Join the OpenPrintTag community to discuss materials, schemas, and integration:

- [OpenPrintTag Website](https://openprinttag.org)
- [Architecture Documentation](https://arch.openprinttag.org/#/)

For issues and feature requests, please use the GitHub issue tracker.
