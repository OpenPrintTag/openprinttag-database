# Contributing to OpenPrintTag Database

Thank you for your interest in contributing! This guide will walk you through adding brands, materials, and submitting your changes.

---

## Table of Contents

- [Before You Start](#before-you-start)
- [How to Contribute](#how-to-contribute)
- [How to Submit Your Changes (Pull Request)](#how-to-submit-your-changes-pull-request)
- [Validation](#validation)
- [Getting Help](#getting-help)

---

## Before You Start

### Understand the Architecture

Before contributing, we recommend familiarizing yourself with the [OpenPrintTag Architecture](https://arch.openprinttag.org). This will help you understand:

- The data structure and relationships between entities
- Required and optional fields for each entity type
- Allowed values for enums and fields
- UUID derivation rules
- Naming conventions and best practices

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

## How to Contribute

You can add or edit data (brands, materials, packages, containers) using any of the three methods below. Choose the one that works best for you!

### Method 1: GitHub Web Editor (Easiest)

Best for: Small edits, typo fixes, quick additions

1. Navigate to the relevant folder in the repository:
   - Brands: `data/brands/`
   - Materials: `data/materials/{brand-slug}/`
   - Packages: `data/material-packages/{brand-slug}/`
   - Containers: `data/material-containers/`

2. Click **"Add file"** → **"Create new file"** (or click ✏️ to edit existing files)

3. Name the file `{slug}.yaml` following the naming convention

4. Add the required fields (see [Schema Documentation](https://arch.openprinttag.org) for details)

5. Scroll down and click **"Propose new file"** or **"Propose changes"**

6. Follow the prompts to create a Pull Request

> **Note:** UUIDs are derived using UUIDv5 (SHA1 hash) according to the [OpenPrintTag Architecture UUID specification](https://arch.openprinttag.org/#/uuid). You can leave UUID fields empty - they will be auto-generated during validation.

### Method 2: UI Editor (Recommended)

Best for: Adding multiple items, complex changes, visual editing

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

4. Use the editor to:
   - Browse existing brands, materials, packages, and containers
   - Add new materials, packages, and containers (via the "+ Add" buttons)
   - Edit existing entries
   - View allowed values in the **Enum** tab

> **Note:** New brands must be created using YAML files (Method 1 or 3), as the UI editor doesn't support brand creation yet.

### Method 3: Direct YAML Editing

Best for: Batch changes, scripting, advanced users

1. Clone the repository and open files in your editor

2. Create or edit YAML files in the appropriate directories:
   - Brands: `data/brands/{slug}.yaml`
   - Materials: `data/materials/{brand-slug}/{material-slug}.yaml`
   - Packages: `data/material-packages/{brand-slug}/{package-slug}.yaml`
   - Containers: `data/material-containers/{slug}.yaml`

3. Follow the [OpenPrintTag Architecture schema](https://arch.openprinttag.org) for field requirements

4. Validate your changes:
   ```bash
   make validate
   ```

5. Commit and push your changes (see [How to Submit Your Changes](#how-to-submit-your-changes-pull-request))

### Important Notes

- **UUIDs**: Leave UUID fields empty - they will be automatically derived according to the [UUID specification](https://arch.openprinttag.org/#/uuid)
- **Slugs**: Must be lowercase, hyphen-separated, and unique within their category
- **Schema**: Always refer to the [OpenPrintTag Architecture documentation](https://arch.openprinttag.org) for current field requirements and allowed values
- **Validation**: Always run `make validate` before submitting changes

---

## How to Submit Your Changes (Pull Request)

### If You Made Changes on GitHub Web

GitHub automatically guides you through creating a Pull Request after proposing changes. Just follow the prompts!

### If You Made Local Changes (UI Editor or Direct YAML)

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
   git checkout -b add-my-contribution
   ```

4. **Make your changes** using Method 2 (UI Editor) or Method 3 (Direct YAML)

5. **Validate your changes:**
   ```bash
   make validate
   ```

6. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add/update: describe your changes"
   git push origin add-my-contribution
   ```

7. **Create Pull Request:**
   - Go to your fork on GitHub
   - Click **"Compare & pull request"**
   - Fill in the description explaining what you added/changed
   - Click **"Create pull request"**

8. **Wait for review:**
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
| `Invalid UUID format` | Leave UUID empty - it will be derived according to the [UUID specification](https://arch.openprinttag.org/#/uuid) |
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
