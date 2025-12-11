# Material Database

An open-source, human-readable database of 3D printing materials, filament spools, and slicing profiles.

## Pre-Release Todo

Steps to be completed before release:

1. Remove import script (`scripts/import_from_json.py`)
2. Remove import script from Makefile
3. Squash commits
4. Chose and provide info about licence in ui-editor folder 

## Overview

This repository contains a comprehensive catalog of 3D printing materials and related data, stored as YAML files for maximum readability and Git-friendliness. The data is organized to be:

- **Human-readable**: YAML format with descriptive slugs
- **Tech-agnostic**: Can be imported into any database system
- **Git-friendly**: One file per entity enables clear diffs and easy reviews
- **Community-driven**: Accepts pull requests for updates and additions
- **Well-structured**: Comprehensive schema with validation

## Structure

```
data/
├── brands/                          # Material brands
├── materials/                       # Material definitions (organized by brand)
├── material-packages/               # Filament spools, resin bottles, etc.
├── material-containers/             # Spool and bottle specifications
├── devices/                         # Printers and accessories
│   ├── printers/
│   └── accessories/
├── slicing-profiles/                # General slicing profiles
│   ├── prusaslicer/
│   └── orcaslicer/
├── material-slicing-profiles/       # Material-specific slicing settings
├── print-sheet-types/               # Build plate types
└── lookup-tables/                   # Reference data
    ├── material-types.yaml
    ├── material-tags.yaml
    ├── material-certifications.yaml
    ├── countries.yaml
    ├── palette-colors.yaml
    └── sla-container-connectors.yaml
```

## File Naming Convention

All entity files use **slugified, human-readable names**:

- Lowercase alphanumeric characters
- Words separated by hyphens
- Example: `prusament-pla-galaxy-black.yaml`

Files are organized by brand when applicable:

- `materials/prusa-research/prusament-pla-galaxy-black.yaml`
- `material-packages/polymaker/polyterra-pla-army-green-1kg-spool.yaml`

## Entity Types

### Brands

Define material manufacturers and their product line information.

**Location**: `data/brands/{slug}.yaml`

**Key Fields**:

- `uuid`: Unique identifier
- `slug`: Human-readable identifier
- `name`: Brand name
- `countries`: List of country codes where available
- `link_patterns`: URL patterns for brand detection

### Materials

Individual material definitions (e.g., "Prusament PLA Galaxy Black").

**Location**: `data/materials/{brand-slug}/{material-slug}.yaml`

**Key Fields**:

- `uuid`: Unique identifier
- `slug`: Human-readable identifier
- `brand_slug`: Reference to brand
- `class`: FFF or SLA
- `type_id`: Reference to material type
- `properties`: Material-specific properties (temperatures, speeds, mechanical properties)
- `tags`: Material characteristics (UV-resistant, high-strength, etc.)
- `certifications`: Safety certifications (REACH, RoHS, FDA, etc.)
- `print_sheet_compatibility`: Build plate compatibility

### Material Packages

Physical products (spools, bottles) containing materials.

**Location**: `data/material-packages/{brand-slug}/{package-slug}.yaml`

**Key Fields**:

- `uuid`: Unique identifier
- `slug`: Human-readable identifier
- `gtin`: GTIN/EAN barcode
- `material_slug`: Reference to material
- `container_slug`: Reference to container
- `nominal_netto_full_weight`: Net weight in grams
- `filament_diameter`: Diameter in micrometers (FFF only)

### Material Containers

Spool and bottle specifications.

**Location**: `data/material-containers/{slug}.yaml`

**Key Fields**:

- Physical dimensions (diameter, width, height)
- Weight when empty
- Capacity (for SLA bottles)
- Connector type (for SLA bottles)

### Devices

Printers and accessories (wash/cure stations).

**Location**: `data/devices/printers/{slug}.yaml` or `data/devices/accessories/{slug}.yaml`

**Key Fields**:

- `type`: Device type (fff_printer, sla_printer, sla_wash_cure)
- `brand_slug`: Reference to brand
- Build volume dimensions
- Technical specifications

### Slicing Profiles

Print profiles for specific printers and materials.

**Generic Profiles**: `data/slicing-profiles/{slicer}/{slug}.yaml`

- Printer + quality level + material type

**Material-Specific Profiles**: `data/material-slicing-profiles/{slug}.yaml`

- Fine-tuned settings for specific material + printer combinations

### Lookup Tables

Reference data shared across entities:

- **material-types.yaml**: Material type definitions (PLA, PETG, ASA, etc.)
- **material-tags.yaml**: Tags with relationships (implies, hints)
- **material-certifications.yaml**: Safety certifications
- **countries.yaml**: ISO country codes
- **palette-colors.yaml**: Pantone/RAL color references
- **sla-container-connectors.yaml**: SLA bottle connector types

## Setup

First-time setup to install dependencies:

```bash
make setup
```

This creates a Python virtual environment and installs required packages (PyYAML).

## Validation

Validate all data files against the schema:

```bash
make validate
```

The validator checks:

- Required fields presence
- Field type correctness
- Foreign key references
- Enum value validity
- Unique constraints
- Pattern matching (UUIDs, slugs, URLs, etc.)
- **UUID derivation** (ensures UUIDs match their derived values per specification)

### UUID Generation

UUIDs in the database follow a deterministic generation scheme using **UUIDv5** (SHA1-based) according to RFC 4122, section 4.3. This ensures that UUIDs can be derived from known parameters in a standardized manner.

See `uuid.md` for the complete specification. In summary:

| Entity                    | Derivation Formula                                          |
| ------------------------- | ----------------------------------------------------------- |
| Brand                     | `Namespace + Brand name (UTF-8)`                            |
| Material                  | `Namespace + Brand UUID (bytes) + Material name (UTF-8)`    |
| Material Package          | `Namespace + Brand UUID (bytes) + GTIN (UTF-8)`             |
| Material Package Instance | `Namespace + NFC tag UID (bytes)`                           |
| Palette Color             | `Namespace + Palette name (UTF-8) + Canonical name (UTF-8)` |

The validation script automatically verifies that all UUIDs match their expected derived values.

### Fixing Incorrect UUIDs

If UUIDs don't match their derived values, you can fix them automatically:

```bash
make fix-uuids
```

This will update all incorrect UUIDs in the YAML files to match the specification.

## Building

Build the flattened JSON database:

```bash
make build
```

This generates a flattened JSON representation of the database in the `build/` directory.

## All Commands

Run setup, validation, and build in one command:

```bash
make all
```

See all available commands:

```bash
make help
```

## Contributing

### Adding a New Material

1. Create a material file: `data/materials/{brand-slug}/{material-slug}.yaml`
2. Add material packages: `data/material-packages/{brand-slug}/{package-slug}.yaml`
3. Optionally add slicing profiles
4. Run validation: `make validate`
5. Submit a pull request

### Adding a New Brand

1. Create a brand file: `data/brands/{brand-slug}.yaml`
2. Create brand subdirectories in `materials/` and `material-packages/`
3. Add materials and packages
4. Run validation: `make validate`
5. Submit a pull request

**Note**: When adding entities, you can either manually generate UUIDs following the specification in `uuid.md`, or create placeholder UUIDs and run `make fix-uuids` to automatically generate the correct ones.

## Schema

The database schema is defined in `schema.yaml` at the repository root. It specifies:

- Entity types and their fields
- Field types and validation rules
- Foreign key relationships
- File naming patterns
- Directory structure

## Deprecated Fields

### directus_uuid (Deprecated)

The `directus_uuid` field is a temporary back-reference to legacy Directus database entries and will be removed before the first release. This field is optional and only present in data imported from the legacy system.

**Affected entities**:

- brands
- material_containers
- devices
- materials
- material_packages

**Note**: The `directus_uuid` field is distinct from the primary `uuid` field and should not be confused with it. When validating data, the validator will emit a warning if this deprecated field is present. Do not add this field to new entries.

## Data Format Guidelines

### Colors

Colors are specified in RGBA hex format: `#rrggbbaa`

Example:

```yaml
primary_color:
  rgba: "#1a1a1aff"
```

### References

Entities reference each other using slugs (for human readability) and UUIDs (for database import).

Example:

```yaml
material_slug: prusament-pla-galaxy-black
brand_slug: prusa-research
```

### Arrays

Many-to-many relationships are represented as arrays:

```yaml
tags:
  - uv-resistant
  - high-detail
  - decorative-finish

certifications:
  - reach
  - rohs
```

### Properties

Material properties are stored as flexible objects:

```yaml
properties:
  nozzle_temperature_default: 215
  bed_temperature_default: 60
  tensile_strength: 50
  density: 1.24
  # ... additional properties
```

## License

[Specify your license here - e.g., CC BY-SA 4.0, MIT, etc.]

## Community

[Add links to discussion forums, contribution guidelines, etc.]
