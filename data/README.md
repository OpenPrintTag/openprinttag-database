# Material Database

An open-source, human-readable database of 3D printing materials, filament spools, and slicing profiles.

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
bash scripts/setup.sh
```

This creates a Python virtual environment and installs required packages (PyYAML).

## Validation

Validate all data files against the schema:

```bash
# Quick way (auto-activates virtual environment)
./scripts/validate.sh

# Or manual way
source venv/bin/activate
python scripts/validate.py
```

The validator checks:
- Required fields presence
- Field type correctness
- Foreign key references
- Enum value validity
- Unique constraints
- Pattern matching (UUIDs, slugs, URLs, etc.)

## Contributing

### Adding a New Material

1. Create a material file: `data/materials/{brand-slug}/{material-slug}.yaml`
2. Add material packages: `data/material-packages/{brand-slug}/{package-slug}.yaml`
3. Optionally add slicing profiles
4. Run validation: `python3 scripts/validate.py`
5. Submit a pull request

### Adding a New Brand

1. Create a brand file: `data/brands/{brand-slug}.yaml`
2. Create brand subdirectories in `materials/` and `material-packages/`
3. Add materials and packages
4. Run validation
5. Submit a pull request

## Schema

The database schema is defined in `schema.yaml` at the repository root. It specifies:

- Entity types and their fields
- Field types and validation rules
- Foreign key relationships
- File naming patterns
- Directory structure

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
