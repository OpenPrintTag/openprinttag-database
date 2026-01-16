# 🖥️ OpenPrintTag Database Editor

A visual editor for managing the OpenPrintTag Database. Built with TanStack Router, React, and TypeScript.

---

## Overview

This editor provides a user-friendly interface for:

- **Managing Brands** — Add, edit, and view material manufacturers
- **Managing Materials** — Create materials with detailed properties, colors, and specifications
- **Managing Packages** — Define physical products with GTINs/barcodes
- **Managing Containers** — Specify spool dimensions and weights
- **Viewing Enums** — Browse allowed values for material types, tags, certifications

The editor reads and writes directly to the `data/` directory, making it easy to prepare contributions for the main repository.

---

## Quick Start

### Recommended: Use Make (from repository root)

```bash
# From the repository root
make editor
```

This automatically checks for Node.js 18+, installs pnpm and dependencies if needed, and starts the editor.

### Manual Installation

**Prerequisites:**
- Node.js 18+
- pnpm

```bash
cd ui-editor
pnpm install
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Usage

### Navigation

The editor has three main sections accessible from the top navigation:

| Section | Description |
|---------|-------------|
| **Brands** | Browse and manage material manufacturers. Click a brand to see its materials and packages. |
| **Containers** | View and edit spool/container specifications. |
| **Enum** | Browse allowed values for fields like material types, tags, and certifications. |

### Adding a New Brand

1. Navigate to **Brands**
2. Click the **"+ Add Brand"** button
3. Fill in the required fields:
   - **Name** — Display name (e.g., "Prusament")
   - **Slug** — URL-friendly identifier (auto-generated from name)
   - **Countries of Origin** — Where the brand manufactures
4. Click **Save**

The editor creates `data/brands/{slug}.yaml` automatically.

### Adding a New Material

1. Navigate to **Brands** → Click on a brand
2. Find the **Materials** section
3. Click **"+ Add Material"**
4. Fill in material details:
   - **Name** — Material name (e.g., "PLA Galaxy Black")
   - **Type** — Material type (PLA, PETG, ASA, etc.)
   - **Class** — FFF for filaments, SLA for resins
   - **Colors** — Primary and secondary colors
   - **Properties** — Print temperatures, density, etc.
5. Click **Save**

The editor creates `data/materials/{brand-slug}/{material-slug}.yaml`.

### Adding a New Package

1. Navigate to **Brands** → Click on a brand
2. Find the **Packages** section
3. Click **"+ Add Package"**
4. Fill in package details:
   - **Material** — Select the material this package contains
   - **Container** — Select the spool type
   - **Weight** — Net weight in grams
   - **GTIN** — Barcode number (optional)
   - **Filament Diameter** — Usually 1750 (1.75mm) or 2850 (2.85mm)
5. Click **Save**

The editor creates `data/material-packages/{brand-slug}/{package-slug}.yaml`.

### Editing Existing Data

1. Navigate to the entity you want to edit
2. Click on it to open the detail view
3. Click **"Edit"** to enter edit mode
4. Make your changes
5. Click **Save**

---

## Project Structure

```
ui-editor/
├── src/
│   ├── components/       # UI components
│   │   ├── brand-sheet/  # Brand detail views
│   │   ├── material-sheet/# Material detail views
│   │   ├── package-sheet/ # Package detail views
│   │   ├── container-sheet/# Container detail views
│   │   └── ui/           # Shared UI components (buttons, dialogs)
│   ├── hooks/            # React hooks for data fetching
│   ├── routes/           # TanStack Router routes
│   │   ├── api/          # Server API endpoints
│   │   └── brands/       # Brand-related pages
│   ├── server/           # Server-side utilities
│   └── utils/            # Helper functions
├── public/               # Static assets
└── package.json
```

---

## Development

### Available Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm typecheck    # Run TypeScript type checking
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues automatically
pnpm format       # Format code with Prettier
```

### Tech Stack

- **[TanStack Router](https://tanstack.com/router)** — File-based routing with full type safety
- **[TanStack Query](https://tanstack.com/query)** — Data fetching and caching
- **[React 19](https://react.dev)** — UI framework
- **[Tailwind CSS 4](https://tailwindcss.com)** — Styling
- **[Radix UI](https://radix-ui.com)** — Accessible UI primitives
- **[Vite](https://vitejs.dev)** — Build tool and dev server

---

## How It Works

The editor runs as a full-stack application:

1. **Frontend** renders the UI and handles user interactions
2. **API routes** (`src/routes/api/`) read and write YAML files in the `data/` directory
3. **Schemas** are loaded from `openprinttag/schema/` to validate and inform the UI

Changes are saved directly to disk, so you can:
1. Edit data in the UI
2. See the changes reflected in the YAML files
3. Commit the changes to Git
4. Submit a Pull Request

---

## Troubleshooting

### "Cannot find schema" error

Make sure you've fetched the schemas from the repository root:

```bash
cd ..
make fetch-schemas
```

### Validation errors

The editor validates data against the OpenPrintTag schema. If you see validation errors:

1. Check the error message for which field is invalid
2. Refer to the [Architecture Docs](https://arch.openprinttag.org) for field requirements
3. Fix the invalid field and try saving again

### Data not appearing

Try refreshing the page. If the issue persists:

1. Check the browser console for errors
2. Verify the YAML files exist in the `data/` directory
3. Ensure the YAML syntax is valid

---

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on submitting changes to the database.

For issues specific to the editor UI, please open an issue on GitHub.
