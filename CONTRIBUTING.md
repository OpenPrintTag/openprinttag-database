# Contributing to OpenPrintTag Database

Thank you for your interest in contributing! This guide will walk you through adding brands, materials, and submitting your changes.

---

## Table of Contents

- [Before You Start](#before-you-start)
- [How to Add a New Brand](#how-to-add-a-new-brand)
- [How to Add a New Material](#how-to-add-a-new-material)
- [How to Edit Existing Data](#how-to-edit-existing-data)
- [How to Submit Your Changes (Pull Request)](#how-to-submit-your-changes-pull-request)
- [Validation](#validation)
- [Getting Help](#getting-help)

---

## Before You Start

### Choose Your Method

There are three ways to contribute:

| Method | Best For | Difficulty |
|--------|----------|------------|
| **GitHub Web Editor** | Small edits, typo fixes | ⭐ Easiest |
| **UI Editor (Local)** | Adding multiple items, complex changes | ⭐⭐ Intermediate |
| **Direct YAML Editing** | Batch changes, scripting | ⭐⭐⭐ Advanced |

### File Format

All data is stored in YAML files. Here's what you need to know:

```yaml
# This is a comment
field_name: value
nested:
  field: value
list:
- item1
- item2
```

### Slugs

Slugs are URL-friendly identifiers. They must be:
- **Lowercase** letters only
- **Hyphens** to separate words (no spaces or underscores)
- **Unique** within their category

Examples:
- ✅ `prusament-pla-galaxy-black`
- ✅ `hatchbox`
- ❌ `Prusament_PLA Galaxy Black` (wrong: uppercase, underscore, spaces)

---

## How to Add a New Brand

### Method 1: GitHub Web Editor (Easiest)

1. Go to the [data/brands](https://github.com/OpenPrintTag/openprinttag-database/tree/main/data/brands) folder
2. Click **"Add file"** → **"Create new file"**
3. Name it `{brand-slug}.yaml` (e.g., `my-brand.yaml`)
4. Add the content:

```yaml
uuid: ""  # Leave empty - will be auto-generated
slug: my-brand
name: My Brand
countries_of_origin:
- US
```

5. Scroll down and click **"Propose new file"**
6. Follow the prompts to create a Pull Request

> **Note:** The UUID will be auto-generated during validation. You can leave it as an empty string or omit it entirely.

### Method 2: UI Editor

The UI editor can be used to browse and edit existing brands, but new brands must be created using YAML files (see Method 3 below).

1. **Clone the repository:**
   ```bash
   git clone https://github.com/OpenPrintTag/openprinttag-database.git
   cd openprinttag-database
   ```

2. **Start the editor:**
   ```bash
   make editor
   ```
   This checks for Node.js 18+, installs dependencies, and opens the editor.

3. **Open http://localhost:3000** in your browser

4. Use the editor to browse existing brands and edit them, or create the brand file manually (see Method 3).

### Method 3: Direct YAML Editing

1. Create a new file at `data/brands/{slug}.yaml`
2. Add the required fields:

```yaml
uuid: ""  # Or generate with: python -c "import uuid; print(uuid.uuid4())"
slug: my-brand
name: My Brand
countries_of_origin:
- US
website: https://example.com  # Optional
```

3. Run validation:
   ```bash
   make validate
   ```

### Brand Fields Reference

| Field | Required | Description |
|-------|----------|-------------|
| `uuid` | Yes* | Unique identifier (auto-generated if empty) |
| `slug` | Yes | URL-friendly identifier |
| `name` | Yes | Display name |
| `countries_of_origin` | Yes | List of ISO 3166-1 alpha-2 country codes |
| `website` | No | Brand's website URL |
| `link_patterns` | No | URL patterns for product pages |

---

## How to Add a New Material

Materials belong to brands. Make sure the brand exists first!

### Method 1: GitHub Web Editor

1. Navigate to `data/materials/{brand-slug}/`
2. If the folder doesn't exist, create it along with the file
3. Create a new file named `{material-slug}.yaml`
4. Add the content:

```yaml
uuid: ""
slug: my-brand-pla-blue
brand:
  slug: my-brand
name: PLA Blue
class: FFF
type: PLA
abbreviation: PLA
primary_color:
  color_rgba: '#0066ffff'
properties:
  density: 1.24
  min_print_temperature: 200
  max_print_temperature: 220
  min_bed_temperature: 50
  max_bed_temperature: 60
```

5. Propose the new file and create a Pull Request

### Method 2: UI Editor (Recommended)

1. Start the editor (see above)
2. Navigate to **Brands** → Click on the brand
3. In the **Materials** section, click **"+ Add Material"**
4. Fill in the form:

   **Basic Info:**
   - **Name:** Material display name (e.g., "PLA Blue")
   - **Type:** Select from dropdown (PLA, PETG, ASA, etc.)
   - **Class:** FFF for filaments, SLA for resins

   **Colors:**
   - Click the color picker to set the primary color
   - Optionally add secondary colors for multi-color materials

   **Properties:**
   - **Print Temperature:** Min/max nozzle temperatures
   - **Bed Temperature:** Min/max bed temperatures
   - **Density:** Material density in g/cm³

   **Optional:**
   - **Tags:** Special properties (e.g., industrially_compostable)
   - **Certifications:** Certifications (e.g., ul_2904)
   - **Photos:** URLs to product images

5. Click **Save**

### Method 3: Direct YAML Editing

Create `data/materials/{brand-slug}/{material-slug}.yaml`:

```yaml
uuid: ""
slug: my-brand-pla-blue
brand:
  slug: my-brand
name: PLA Blue
class: FFF
type: PLA
abbreviation: PLA
primary_color:
  color_rgba: '#0066ffff'
transmission_distance: 6.0  # Optional: light transmission depth
tags:
- industrially_compostable  # Optional
certifications:
- ul_2904  # Optional
photos:
- url: https://example.com/image.jpg
  type: unspecified
properties:
  density: 1.24
  hardness_shore_d: 75
  min_print_temperature: 200
  max_print_temperature: 220
  preheat_temperature: 170
  min_bed_temperature: 50
  max_bed_temperature: 60
  chamber_temperature: 25
  min_chamber_temperature: 20
  max_chamber_temperature: 40
```

### Material Fields Reference

| Field | Required | Description |
|-------|----------|-------------|
| `uuid` | Yes* | Unique identifier |
| `slug` | Yes | URL-friendly identifier (usually `{brand}-{type}-{color}`) |
| `brand.slug` | Yes | Reference to the brand |
| `name` | Yes | Display name |
| `class` | Yes | `FFF` for filaments, `SLA` for resins |
| `type` | Yes | Material type (PLA, PETG, ASA, TPU, etc.) |
| `abbreviation` | Yes | Short material name |
| `primary_color.color_rgba` | No | Primary color in `#rrggbbaa` format |
| `properties` | No | Physical and printing properties |
| `tags` | No | Special material properties |
| `certifications` | No | Material certifications |

---

## How to Add a Material Package

Packages represent physical products (spools you can buy). They reference a material and container.

### Using the UI Editor

1. Navigate to **Brands** → Click on the brand
2. In the **Packages** section, click **"+ Add Package"**
3. Fill in:
   - **Material:** Select from the brand's materials
   - **Container:** Select spool type (e.g., "1000g")
   - **Nominal Weight:** Net material weight in grams
   - **Filament Diameter:** 1750 (1.75mm) or 2850 (2.85mm)
   - **GTIN:** Barcode number (optional but helpful!)
4. Click **Save**

### Direct YAML

Create `data/material-packages/{brand-slug}/{package-slug}.yaml`:

```yaml
uuid: ""
slug: my-brand-pla-blue-1000-spool
class: FFF
material:
  slug: my-brand-pla-blue
nominal_netto_full_weight: 1000
gtin: "1234567890123"
container:
  slug: 1000g
filament_diameter: 1750
```

---

## How to Edit Existing Data

### Quick Edits via GitHub

1. Navigate to the file you want to edit in the GitHub repository
2. Click the **pencil icon** ✏️ to edit
3. Make your changes
4. Scroll down, add a commit message describing your change
5. Click **"Propose changes"**
6. Create a Pull Request

### Using the UI Editor

1. Start the editor
2. Navigate to the entity (brand, material, package)
3. Click on it to open the detail view
4. Click **"Edit"** button
5. Make your changes
6. Click **"Save"**

### Direct File Editing

1. Open the YAML file in your editor
2. Make changes
3. Validate: `make validate`
4. Commit and push

---

## How to Submit Your Changes (Pull Request)

### If You Made Changes on GitHub Web

GitHub automatically guides you through creating a Pull Request after proposing changes.

### If You Made Local Changes

1. **Create a fork** (if you haven't already):
   - Go to the repository on GitHub
   - Click **"Fork"** button

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/openprinttag-database.git
   cd openprinttag-database
   ```

3. **Create a branch:**
   ```bash
   git checkout -b add-my-brand
   ```

4. **Make your changes** using the UI editor or direct editing

5. **Validate your changes:**
   ```bash
   make validate
   ```

6. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add My Brand with PLA materials"
   ```

7. **Push to your fork:**
   ```bash
   git push origin add-my-brand
   ```

8. **Create Pull Request:**
   - Go to your fork on GitHub
   - Click **"Compare & pull request"**
   - Fill in the description explaining what you added/changed
   - Click **"Create pull request"**

9. **Wait for review:**
   - Automated validation will run
   - Maintainers will review your changes
   - You may be asked to make adjustments

---

## Validation

Before submitting, always validate your changes:

```bash
# Setup (first time only)
make setup

# Fetch schemas (first time or when schemas update)
make fetch-schemas

# Validate all data
make validate
```

### Common Validation Errors

| Error | Solution |
|-------|----------|
| `Missing required field` | Add the missing field to your YAML |
| `Invalid reference` | Check that the referenced slug exists (e.g., brand.slug) |
| `Invalid enum value` | Use values from the allowed list (check Enum tab in UI) |
| `Invalid UUID format` | Leave UUID empty - it will be auto-generated |
| `Invalid GTIN` | GTINs must be 8, 12, 13, or 14 digits |

---

## Getting Help

- **Schema Documentation:** [arch.openprinttag.org](https://arch.openprinttag.org)
- **Allowed Values:** Run the UI editor and check the **Enum** tab
- **Issues:** Open an issue on GitHub
- **Questions:** Start a discussion on GitHub

---

## Tips for Good Contributions

**Do:**
- Use official product names and specifications
- Include GTIN/barcode numbers when available
- Add photos from official sources (with proper URLs)
- Test your changes with `make validate`
- Write clear commit messages

**Don't:**
- Guess specifications — only add what you know
- Include copyrighted content without permission
- Create duplicate entries — search first!
- Modify UUIDs of existing entities

---

## Thank You!

Every contribution makes this database more valuable for the 3D printing community. Whether you're adding a single material or an entire brand catalog, we appreciate your help!
