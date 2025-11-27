#!/usr/bin/env python3
"""
Update statistics in README.md with current counts from data directory.
"""

import re
import sys
from pathlib import Path


def count_yaml_files(directory: Path) -> int:
    """Count all .yaml files in a directory (recursively).

    Args:
        directory: Path to the directory to search.

    Returns:
        Number of .yaml files found, or 0 if directory doesn't exist.
    """
    if not directory.exists():
        return 0
    return len(list(directory.rglob("*.yaml")))


def update_readme_stats(readme_path: Path, data_dir: Path) -> bool:
    """Update statistics in README.md with current counts.

    Args:
        readme_path: Path to README.md file.
        data_dir: Path to data directory.

    Returns:
        True if update was successful, False otherwise.
    """
    if not readme_path.exists():
        print(f"Error: {readme_path} not found", file=sys.stderr)
        return False

    # Count files
    brands_count = count_yaml_files(data_dir / "brands")
    materials_count = count_yaml_files(data_dir / "materials")
    packages_count = count_yaml_files(data_dir / "material-packages")
    containers_count = count_yaml_files(data_dir / "material-containers")

    # Read README
    try:
        content = readme_path.read_text(encoding="utf-8")
    except IOError as e:
        print(f"Error: Failed to read {readme_path}: {e}", file=sys.stderr)
        return False

    # Pattern to match the stats section
    # Matches: - **NUMBER+ brands** — description (with or without +)
    patterns = [
        (r"- \*\*\d+[\d,]*\+? brands\*\*", f"- **{brands_count:,} brands**"),
        (
            r"- \*\*\d+[\d,]*\+? materials\*\*",
            f"- **{materials_count:,} materials**",
        ),
        (r"- \*\*\d+[\d,]*\+? packages\*\*", f"- **{packages_count:,} packages**"),
        (
            r"- \*\*\d+[\d,]*\+? containers\*\*",
            f"- **{containers_count:,} containers**",
        ),
    ]

    updated = False
    for pattern, replacement in patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            updated = True

    if updated:
        try:
            readme_path.write_text(content, encoding="utf-8")
            print("✓ Updated README.md statistics:")
            print(f"  - Brands: {brands_count:,}")
            print(f"  - Materials: {materials_count:,}")
            print(f"  - Packages: {packages_count:,}")
            print(f"  - Containers: {containers_count:,}")
            return True
        except IOError as e:
            print(f"Error: Failed to write {readme_path}: {e}", file=sys.stderr)
            return False
    else:
        print(
            "Warning: Could not find statistics section in README.md",
            file=sys.stderr,
        )
        return False


def main() -> int:
    """Main entry point.

    Returns:
        Exit code: 0 on success, 1 on error.
    """
    # Get project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    readme_path = project_root / "README.md"
    data_dir = project_root / "data"

    if not data_dir.exists():
        print(f"Error: {data_dir} not found", file=sys.stderr)
        return 1

    success = update_readme_stats(readme_path, data_dir)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
