#!/usr/bin/env python3
"""
Fix UUIDs Script

Generates correct UUIDs according to uuid.md specification and updates YAML files.
"""

import sys
from pathlib import Path
import yaml

from lib import DatabaseLoader
from uuid_utils import (
    generate_brand_uuid,
    generate_material_uuid,
    generate_material_package_uuid,
    generate_palette_color_uuid,
)


def load_yaml(path: Path):
    """Load YAML file preserving formatting"""
    with open(path, 'r') as f:
        return yaml.safe_load(f)


def save_yaml(path: Path, data):
    """Save YAML file"""
    with open(path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def update_uuid_in_file(file_path: Path, old_uuid: str, new_uuid: str, entity_key: str) -> None:
    """
    Update UUID in a YAML file by replacing the old value with the new one.

    Args:
        file_path: Path to the YAML file
        old_uuid: Current UUID value
        new_uuid: New UUID value
        entity_key: Entity identifier for logging
    """
    print(f"  {entity_key}: {old_uuid} -> {new_uuid}")

    with open(file_path, 'r') as f:
        content = f.read()

    content = content.replace(f"uuid: {old_uuid}", f"uuid: {new_uuid}")

    with open(file_path, 'w') as f:
        f.write(content)


def fix_brand_uuids(base_path: Path, loader: DatabaseLoader):
    """Fix brand UUIDs"""
    brands = loader.load_entity_data('brands', loader.schema['entities']['brands'])

    print("Fixing brand UUIDs...")
    fixed_count = 0
    for brand_slug, brand_data in brands.items():
        correct_uuid = generate_brand_uuid(brand_data['name'])
        if str(correct_uuid) != brand_data.get('uuid'):
            file_path = base_path / 'data' / 'brands' / f'{brand_slug}.yaml'
            update_uuid_in_file(file_path, brand_data['uuid'], str(correct_uuid), brand_slug)
            fixed_count += 1

    if fixed_count == 0:
        print("  No changes needed")
    return fixed_count


def fix_material_uuids(base_path: Path, loader: DatabaseLoader):
    """Fix material UUIDs"""
    brands = loader.load_entity_data('brands', loader.schema['entities']['brands'])
    materials = loader.load_entity_data('materials', loader.schema['entities']['materials'])

    print("Fixing material UUIDs...")
    fixed_count = 0
    for material_slug, material_data in materials.items():
        brand_slug = material_data.get('brand_slug')
        if not brand_slug or brand_slug not in brands:
            continue

        brand_data = brands[brand_slug]
        brand_uuid = generate_brand_uuid(brand_data['name'])

        correct_uuid = generate_material_uuid(brand_uuid, material_data['name'])
        if str(correct_uuid) != material_data.get('uuid'):
            file_path = base_path / 'data' / 'materials' / brand_slug / f'{material_slug}.yaml'
            update_uuid_in_file(file_path, material_data['uuid'], str(correct_uuid), material_slug)
            fixed_count += 1

    if fixed_count == 0:
        print("  No changes needed")
    return fixed_count


def fix_material_package_uuids(base_path: Path, loader: DatabaseLoader):
    """Fix material package UUIDs"""
    brands = loader.load_entity_data('brands', loader.schema['entities']['brands'])
    packages = loader.load_entity_data('material_packages', loader.schema['entities']['material_packages'])

    print("Fixing material package UUIDs...")
    fixed_count = 0
    for package_slug, package_data in packages.items():
        brand_slug = package_data.get('brand_slug')
        if not brand_slug or brand_slug not in brands:
            continue

        brand_data = brands[brand_slug]
        brand_uuid = generate_brand_uuid(brand_data['name'])

        correct_uuid = generate_material_package_uuid(brand_uuid, package_data['gtin'])
        if str(correct_uuid) != package_data.get('uuid'):
            file_path = base_path / 'data' / 'material-packages' / brand_slug / f'{package_slug}.yaml'
            update_uuid_in_file(file_path, package_data['uuid'], str(correct_uuid), package_slug)
            fixed_count += 1

    if fixed_count == 0:
        print("  No changes needed")
    return fixed_count


def fix_palette_color_uuids(base_path: Path):
    """Fix palette color UUIDs"""
    file_path = base_path / 'data' / 'lookup-tables' / 'palette-colors.yaml'

    print("Fixing palette color UUIDs...")
    data = load_yaml(file_path)
    fixed_count = 0

    for color in data.get('colors', []):
        correct_uuid = generate_palette_color_uuid(
            color['palette'],
            color['canonical_name']
        )

        if str(correct_uuid) != color.get('uuid'):
            print(f"  {color['palette']}-{color['canonical_name']}: {color.get('uuid')} -> {correct_uuid}")
            color['uuid'] = str(correct_uuid)
            fixed_count += 1

    if fixed_count > 0:
        save_yaml(file_path, data)
    else:
        print("  No changes needed")

    return fixed_count


def main():
    """Main entry point"""
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    print(f"UUID Fix Script")
    print(f"Repository: {repo_root}")
    print()

    # Load schema
    loader = DatabaseLoader(repo_root)
    if not loader.load_schema():
        print(f"Error loading schema: {loader.errors[0]}")
        sys.exit(1)

    # Fix UUIDs
    total_fixed = 0
    total_fixed += fix_brand_uuids(repo_root, loader)
    total_fixed += fix_material_uuids(repo_root, loader)
    total_fixed += fix_material_package_uuids(repo_root, loader)
    total_fixed += fix_palette_color_uuids(repo_root)

    print()
    if total_fixed > 0:
        print(f"✓ Fixed {total_fixed} UUID(s)")
        print("Run 'make validate' to verify.")
    else:
        print("✓ All UUIDs are correct!")


if __name__ == '__main__':
    main()