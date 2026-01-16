# OpenPrintTag Material Database

An open-source, community-driven database of 3D printing materials, brands, and packaging specifications. Part of the [OpenPrintTag](https://openprinttag.org) initiative.

**[Quick Start](#quick-start)** · **[Data Structure](#data-structure)** · **[Contributing](#contributing)** · **[Detailed Guides](CONTRIBUTING.md)**

---

## What is this?

This repository is a **publicly editable database** of 3D printing materials stored in human-readable YAML files. Think of it as a community wiki for filament specifications, but in a format that machines can also understand.

**What's inside:**
- 🏢 **100+ brands** — Material manufacturers from Prusament to Hatchbox
- 🎨 **10,000+ materials** — PLA, PETG, ASA, TPU and many more with detailed properties
- 📦 **750+ packages** — Physical products with GTINs/barcodes
- 🧵 **60+ containers** — Spool specifications and dimensions

All data follows the [OpenPrintTag Architecture](https://arch.openprinttag.org) schema and can be imported into any database or application.

---

## Quick Start

### Option A: Edit directly on GitHub (easiest)

1. Browse to the `data/` folder
2. Find the file you want to edit (e.g., `data/brands/prusament.yaml`)
3. Click the pencil icon ✏️ to edit
4. Make your changes and submit a Pull Request

→ See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed step-by-step guides.

### Option B: Use the UI Editor (recommended for larger changes)

```bash
# Clone the repository
git clone https://github.com/OpenPrintTag/openprinttag-database.git
cd openprinttag-database

# Start the editor (auto-installs dependencies)
make editor
```

The command checks for Node.js 18+, installs pnpm if needed, and opens the editor at http://localhost:3000.

→ See [ui-editor/README.md](ui-editor/README.md) for more details.

### Option C: Edit YAML files directly

```bash
# Clone and setup
git clone https://github.com/OpenPrintTag/openprinttag-database.git
cd openprinttag-database
make setup

# Validate your changes
make validate
```

---

## Data Structure

```
data/
├── brands/                   # Material manufacturers and suppliers
│   └── {brand-slug}.yaml
├── materials/                # Material definitions with properties
│   └── {brand-slug}/
│       └── {material-slug}.yaml
├── material-packages/        # Physical products (spools, bottles)
│   └── {brand-slug}/
│       └── {package-slug}.yaml
└── material-containers/      # Container specs (spool dimensions)
    └── {container-slug}.yaml
```

### Brands

Manufacturers and suppliers of materials.

```yaml
# data/brands/prusament.yaml
uuid: ae5ff34e-298e-50c9-8f77-92a97fb30b09
slug: prusament
name: Prusament
countries_of_origin:
- CZ
```

### Materials

Individual materials with detailed properties.

```yaml
# data/materials/prusament/prusament-pla-prusa-orange.yaml
uuid: 261ae7e7-20d9-5969-9ed5-dd82eea29bcf
slug: prusament-pla-prusa-orange
brand:
  slug: prusament
name: PLA Prusa Orange
class: FFF
type: PLA
abbreviation: PLA
primary_color:
  color_rgba: '#fe6e32ff'
transmission_distance: 6.6
tags:
- industrially_compostable
certifications:
- ul_2904
properties:
  density: 1.24
  min_print_temperature: 205
  max_print_temperature: 225
  min_bed_temperature: 40
  max_bed_temperature: 60
```

### Material Packages

Physical products you can buy — spools with barcodes.

```yaml
# data/material-packages/prusament/prusament-pla-prusa-orange-1000-spool.yaml
uuid: 6b9c7b1d-0ebe-5177-a6a7-4e3aa38d0a3b
slug: prusament-pla-prusa-orange-1000-spool
class: FFF
material:
  slug: prusament-pla-prusa-orange
nominal_netto_full_weight: 1000
gtin: 8594173675292
container:
  slug: old-prusament-spool-1kg
filament_diameter: 1750
```

### Material Containers

Spool and container specifications.

```yaml
# data/material-containers/1000g.yaml
uuid: 24b4f4e3-3339-452d-964f-6af71695e0cf
slug: 1000g
name: 1000g
class: FFF
```

---

## File Naming Convention

All files use **slugified names**:
- Lowercase letters
- Words separated by hyphens
- No special characters

Example: `prusament-pla-galaxy-black.yaml`

---

## Workflow Overview

### For Contributors

1. **Fork** this repository
2. **Make changes** using the UI editor or directly in YAML
3. **Validate** your changes with `make validate`
4. **Submit** a Pull Request
5. **Wait** for automated validation and review

### For Developers

```bash
# Initial setup
make setup              # Create Python venv and install dependencies
make fetch-schemas      # Download OpenPrintTag schemas

# Working with data
make validate           # Validate all data against schemas
make test               # Run unit tests
make help               # Show all available commands
```

---

## Contributing

We welcome contributions! Whether you want to:

- 🆕 **Add a new brand** — Know a manufacturer not in the database?
- 🎨 **Add materials** — Have specifications for materials we're missing?
- 🔧 **Fix errors** — Spotted a typo or wrong value?
- 📷 **Add photos** — Have product images?

**→ Check out [CONTRIBUTING.md](CONTRIBUTING.md)** for detailed step-by-step guides on:

- How to add a new brand
- How to add a new material
- How to edit existing data
- How to submit your changes as a Pull Request

---

## Schema & Validation

This database follows the [OpenPrintTag Architecture](https://github.com/OpenPrintTag/openprinttag-architecture) schema. The specific version is configured in `schema_version.conf`.

**Schema ensures:**
- Field types are correct
- Required fields are present
- UUIDs are properly formatted
- References (brand_slug, material_slug) are valid
- Enum values match allowed options
- GTINs and URLs follow correct patterns

---

## Resources

| Resource | URL |
|----------|-----|
| OpenPrintTag Website | [openprinttag.org](https://openprinttag.org) |
| Architecture Docs | [arch.openprinttag.org](https://arch.openprinttag.org) |
| Schema Repository | [github.com/OpenPrintTag/openprinttag-architecture](https://github.com/OpenPrintTag/openprinttag-architecture) |

---

## License

MIT License — see [LICENSE](LICENSE) for details.
