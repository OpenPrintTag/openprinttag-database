#!/usr/bin/env python3
"""
Material Database Validator

Validates YAML data files against the schema definition.
"""

import re
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple

from lib import DatabaseLoader
from uuid_utils import (
    validate_brand_uuid,
    validate_material_uuid,
    validate_material_package_uuid,
    validate_palette_color_uuid,
)


class ValidationError:
    """Represents a validation error or warning"""

    def __init__(self, level: str, rule: str, entity: str, file: str, message: str):
        self.level = level  # error, warning, info
        self.rule = rule
        self.entity = entity
        self.file = file
        self.message = message

    def __str__(self):
        return f"[{self.level.upper()}] {self.entity} ({self.file}): {self.message} [rule: {self.rule}]"


class Validator:
    """Validates material database against schema"""

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.loader = DatabaseLoader(base_path)
        self.schema = None
        self.errors: List[ValidationError] = []
        self.data_cache: Dict[str, Dict] = {}

    def load_schema(self) -> bool:
        """Load and parse schema file"""
        if not self.loader.load_schema():
            print(f"Error: {self.loader.errors[0]}")
            return False
        self.schema = self.loader.schema
        return True

    def load_yaml_file(self, path: Path) -> Any:
        """Load a YAML file"""
        data = self.loader.load_yaml_file(path)
        if data is None and self.loader.errors:
            self.errors.append(ValidationError(
                'error', 'file_parse', 'file', str(path),
                f"Failed to parse YAML: {self.loader.errors[-1]}"
            ))
        return data

    def validate_field_type(self, value: Any, field_def: Dict, field_name: str) -> Tuple[bool, str]:
        """Validate a field value against its type definition"""
        field_type = field_def.get('type')

        if value is None:
            if field_def.get('required', False):
                return False, f"Required field '{field_name}' is missing or null"
            return True, ""

        # Check basic types
        if field_type == 'string':
            if not isinstance(value, str):
                return False, f"Field '{field_name}' must be a string"
            max_length = field_def.get('max_length')
            if max_length and len(value) > max_length:
                return False, f"Field '{field_name}' exceeds max length of {max_length}"

        elif field_type == 'integer':
            if not isinstance(value, int):
                return False, f"Field '{field_name}' must be an integer"

        elif field_type == 'number':
            if not isinstance(value, (int, float)):
                return False, f"Field '{field_name}' must be a number"

        elif field_type == 'boolean':
            if not isinstance(value, bool):
                return False, f"Field '{field_name}' must be a boolean"

        elif field_type == 'array':
            if not isinstance(value, list):
                return False, f"Field '{field_name}' must be an array"

        elif field_type == 'object':
            if not isinstance(value, dict):
                # For optional fields, suggest omitting invalid values
                if not field_def.get('required', False):
                    return False, f"Field '{field_name}' must be an object (or omitted if not applicable)"
                return False, f"Field '{field_name}' must be an object"

        elif field_type == 'enum':
            if value not in field_def.get('values', []):
                return False, f"Field '{field_name}' must be one of {field_def.get('values')}"

        # Check pattern-based types
        elif field_type in self.schema.get('field_types', {}):
            pattern = self.schema['field_types'][field_type].get('pattern')
            if pattern and not re.match(pattern, str(value)):
                return False, f"Field '{field_name}' does not match pattern for type {field_type}"

        return True, ""

    def validate_entity_file(self, entity_name: str, entity_def: Dict, file_path: Path, data: Dict) -> None:
        """Validate a single entity file"""
        fields = entity_def.get('fields', {})

        # Check that filename slug matches the slug in the entity contents
        filename_slug = file_path.stem  # Get filename without extension
        pk_field = entity_def.get('primary_key', 'slug')
        content_slug = data.get(pk_field)
        if content_slug and content_slug != filename_slug:
            self.errors.append(ValidationError(
                'error', 'slug_mismatch', entity_name, str(file_path),
                f"Filename slug '{filename_slug}' does not match {pk_field} in file '{content_slug}'"
            ))

        # Check for deprecated directus_uuid field
        if 'directus_uuid' in data:
            self.errors.append(ValidationError(
                'warning', 'deprecated_field', entity_name, str(file_path),
                "Field 'directus_uuid' is deprecated and will be removed before release. This is a temporary back-reference to legacy Directus database entries."
            ))

        # Check all defined fields
        for field_name, field_def in fields.items():
            value = data.get(field_name)

            # Validate field type
            is_valid, error_msg = self.validate_field_type(value, field_def, field_name)
            if not is_valid:
                self.errors.append(ValidationError(
                    'error', 'field_types', entity_name, str(file_path),
                    error_msg
                ))

            # Check foreign keys (basic check - detailed check happens later)
            if value and 'foreign_key' in field_def:
                # We'll do comprehensive FK validation in a separate pass
                pass

            # Validate array items
            if field_def.get('type') == 'array' and isinstance(value, list):
                items_def = field_def.get('items', {})
                for i, item in enumerate(value):
                    is_valid, error_msg = self.validate_field_type(
                        item, items_def, f"{field_name}[{i}]"
                    )
                    if not is_valid:
                        self.errors.append(ValidationError(
                            'error', 'field_types', entity_name, str(file_path),
                            error_msg
                        ))

            # Validate object fields
            if field_def.get('type') == 'object' and isinstance(value, dict):
                obj_fields = field_def.get('fields', {})
                for obj_field_name, obj_field_def in obj_fields.items():
                    obj_value = value.get(obj_field_name)
                    is_valid, error_msg = self.validate_field_type(
                        obj_value, obj_field_def, f"{field_name}.{obj_field_name}"
                    )
                    if not is_valid:
                        self.errors.append(ValidationError(
                            'error', 'field_types', entity_name, str(file_path),
                            error_msg
                        ))

    def load_entity_data(self, entity_name: str, entity_def: Dict) -> Dict[str, Any]:
        """Load all data for an entity type with validation"""
        entity_data = self.loader.load_entity_data(entity_name, entity_def)

        # Add validation logic for lookup tables
        if entity_def.get('type') == 'lookup_table':
            # Get primary key field (first required field)
            pk_field = None
            for field_name, field_def in entity_def.get('fields', {}).items():
                if field_def.get('required', False):
                    pk_field = field_name
                    break

            # Validate lookup table file
            file_path = self.base_path / entity_def['directory'] / entity_def['file']
            if file_path.exists():
                data = self.load_yaml_file(file_path)
                if data:
                    root_key = entity_def.get('root_key')
                    items = data.get(root_key, []) if root_key else data
                    if isinstance(items, list):
                        fields = entity_def.get('fields', {})
                        seen_keys = {}
                        for idx, item in enumerate(items):
                            # Check for duplicate primary keys
                            if pk_field:
                                key = item.get(pk_field) if pk_field else None
                                if key:
                                    if key in seen_keys:
                                        self.errors.append(ValidationError(
                                            'error', 'unique_keys', entity_name, str(file_path),
                                            f"Duplicate {pk_field} '{key}' at index {idx} (first seen at index {seen_keys[key]})"
                                        ))
                                    else:
                                        seen_keys[key] = idx
                            
                            # Validate each field in the item
                            for field_name, field_def in fields.items():
                                value = item.get(field_name)
                                
                                # Validate field type
                                is_valid, error_msg = self.validate_field_type(value, field_def, field_name)
                                if not is_valid:
                                    item_id = item.get(pk_field, f"index {idx}")
                                    self.errors.append(ValidationError(
                                        'error', 'field_types', entity_name, str(file_path),
                                        f"Item {item_id}: {error_msg}"
                                    ))
                                
                                # Validate array items
                                if field_def.get('type') == 'array' and isinstance(value, list):
                                    items_def = field_def.get('items', {})
                                    for i, array_item in enumerate(value):
                                        is_valid, error_msg = self.validate_field_type(
                                            array_item, items_def, f"{field_name}[{i}]"
                                        )
                                        if not is_valid:
                                            item_id = item.get(pk_field, f"index {idx}")
                                            self.errors.append(ValidationError(
                                                'error', 'field_types', entity_name, str(file_path),
                                                f"Item {item_id}: {error_msg}"
                                            ))
                                
                                # Validate object fields
                                if field_def.get('type') == 'object' and isinstance(value, dict):
                                    obj_fields = field_def.get('fields', {})
                                    for obj_field_name, obj_field_def in obj_fields.items():
                                        obj_value = value.get(obj_field_name)
                                        is_valid, error_msg = self.validate_field_type(
                                            obj_value, obj_field_def, f"{field_name}.{obj_field_name}"
                                        )
                                        if not is_valid:
                                            item_id = item.get(pk_field, f"index {idx}")
                                            self.errors.append(ValidationError(
                                                'error', 'field_types', entity_name, str(file_path),
                                                f"Item {item_id}: {error_msg}"
                                            ))

        # Add validation logic for non-lookup tables
        if entity_def.get('type') != 'lookup_table':
            search_dirs = self.loader.get_search_dirs(entity_def)
            seen_keys = set()

            # Validate all files (already loaded by loader, just validate structure)
            for search_dir in search_dirs:
                if not search_dir.exists():
                    continue

                for file_path in search_dir.glob("*.yaml"):
                    data = self.load_yaml_file(file_path)
                    if data:
                        # Validate the file structure
                        self.validate_entity_file(entity_name, entity_def, file_path, data)

                        # Check for duplicates
                        pk_field = entity_def.get('primary_key', 'slug')
                        key = data.get(pk_field)
                        if key:
                            if key in seen_keys:
                                self.errors.append(ValidationError(
                                    'error', 'unique_slugs', entity_name, str(file_path),
                                    f"Duplicate {pk_field}: {key}"
                                ))
                            seen_keys.add(key)

        return entity_data

    def validate_foreign_keys(self):
        """Validate all foreign key references"""
        entities = self.schema.get('entities', {})

        for entity_name, entity_def in entities.items():
            entity_data = self.data_cache.get(entity_name, {})
            fields = entity_def.get('fields', {})

            for entity_key, entity_obj in entity_data.items():
                for field_name, field_def in fields.items():
                    fk_def = field_def.get('foreign_key')
                    if not fk_def:
                        continue

                    value = entity_obj.get(field_name)
                    if value is None:
                        continue

                    target_entity = fk_def['entity']
                    target_field = fk_def['field']
                    target_data = self.data_cache.get(target_entity, {})

                    # Handle arrays
                    values_to_check = value if isinstance(value, list) else [value]

                    for val in values_to_check:
                        # For nested objects in arrays
                        if isinstance(val, dict) and 'foreign_key' in field_def.get('items', {}):
                            items_fk = field_def['items']['foreign_key']
                            for item_field_name, item_field_def in field_def.get('items', {}).get('fields', {}).items():
                                if 'foreign_key' in item_field_def:
                                    item_val = val.get(item_field_name)
                                    if item_val and item_val not in self.data_cache.get(item_field_def['foreign_key']['entity'], {}):
                                        self.errors.append(ValidationError(
                                            'error', 'foreign_key_exists', entity_name, entity_key,
                                            f"Foreign key {field_name}.{item_field_name}={item_val} not found in {item_field_def['foreign_key']['entity']}"
                                        ))
                        elif val not in target_data:
                            self.errors.append(ValidationError(
                                'error', 'foreign_key_exists', entity_name, entity_key,
                                f"Foreign key {field_name}={val} not found in {target_entity}"
                            ))

    def validate_uuids(self):
        """Validate UUIDs match their derived values according to uuid.md specification"""

        # Validate brands
        brands_data = self.data_cache.get('brands', {})
        for brand_slug, brand_data in brands_data.items():
            is_valid, expected_uuid, error_msg = validate_brand_uuid(brand_data)
            if not is_valid:
                self.errors.append(ValidationError(
                    'error', 'uuid_derivation', 'brands', brand_slug,
                    error_msg
                ))

        # Validate materials (need brand UUID)
        materials_data = self.data_cache.get('materials', {})
        for material_slug, material_data in materials_data.items():
            brand_slug = material_data.get('brand_slug')
            if not brand_slug:
                continue

            brand_data = brands_data.get(brand_slug)
            if not brand_data or 'uuid' not in brand_data:
                # FK validation will catch missing brand
                continue

            try:
                brand_uuid = uuid.UUID(brand_data['uuid'])
                is_valid, expected_uuid, error_msg = validate_material_uuid(material_data, brand_uuid)
                if not is_valid:
                    self.errors.append(ValidationError(
                        'error', 'uuid_derivation', 'materials', material_slug,
                        error_msg
                    ))
            except (ValueError, TypeError) as e:
                # UUID format validation will catch this
                pass

        # Validate material packages (need brand UUID)
        packages_data = self.data_cache.get('material_packages', {})
        for package_slug, package_data in packages_data.items():
            brand_slug = package_data.get('brand_slug')
            if not brand_slug:
                continue

            brand_data = brands_data.get(brand_slug)
            if not brand_data or 'uuid' not in brand_data:
                # FK validation will catch missing brand
                continue

            # Check if GTIN is missing - emit warning and skip UUID validation
            if 'gtin' not in package_data or not package_data.get('gtin'):
                # self.errors.append(ValidationError(
                #     'warning', 'uuid_derivation', 'material_packages', package_slug,
                #     "Missing gtin field (required for UUID derivation, skipping UUID validation)"
                # ))
                continue

            try:
                brand_uuid = uuid.UUID(brand_data['uuid'])
                is_valid, expected_uuid, error_msg = validate_material_package_uuid(package_data, brand_uuid)
                if not is_valid:
                    self.errors.append(ValidationError(
                        'error', 'uuid_derivation', 'material_packages', package_slug,
                        error_msg
                    ))
            except (ValueError, TypeError) as e:
                # UUID format validation will catch this
                pass
        
        # TODO: Uncomment this when we have palette colors UUID
        # Validate palette colors
        # palette_colors_data = self.data_cache.get('palette_colors', {})
        # for color_key, color_data in palette_colors_data.items():
        #     is_valid, expected_uuid, error_msg = validate_palette_color_uuid(color_data)
        #     if not is_valid:
        #         self.errors.append(ValidationError(
        #             'error', 'uuid_derivation', 'palette_colors', color_key,
        #             error_msg
        #         ))

    def validate(self) -> bool:
        """Run all validations"""
        print("Loading schema...")
        if not self.load_schema():
            return False

        print("Loading and validating entity data...")
        entities = self.schema.get('entities', {})

        # Load all entity data first
        for entity_name, entity_def in entities.items():
            print(f"  Loading {entity_name}...")
            self.data_cache[entity_name] = self.load_entity_data(entity_name, entity_def)

        print("Validating foreign key references...")
        self.validate_foreign_keys()

        print("Validating UUIDs...")
        self.validate_uuids()

        # Print results
        print("\n" + "="*80)
        if not self.errors:
            print("✓ Validation passed! No errors found.")
            return True

        # Group errors by level
        errors = [e for e in self.errors if e.level == 'error']
        warnings = [e for e in self.errors if e.level == 'warning']
        infos = [e for e in self.errors if e.level == 'info']

        if errors:
            print(f"\n✗ ERRORS ({len(errors)}):")
            for error in errors:
                print(f"  {error}")

        if warnings:
            print(f"\nWARNINGS ({len(warnings)}):")
            for warning in warnings:
                print(f"  {warning}")

        if infos:
            print(f"\nINFO ({len(infos)}):")
            for info in infos:
                print(f"  {info}")

        print("\n" + "="*80)
        print(f"Summary: {len(errors)} errors, {len(warnings)} warnings, {len(infos)} info")

        return len(errors) == 0


def main():
    """Main entry point"""
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    print(f"Material Database Validator")
    print(f"Repository: {repo_root}")
    print()

    validator = Validator(repo_root)
    success = validator.validate()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
