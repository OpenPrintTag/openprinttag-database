#!/usr/bin/env python3
"""
Material Database Validator

Validates YAML data files against the schema definition.
"""

import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple
import yaml


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
        self.schema_path = base_path / "schema.yaml"
        self.schema = None
        self.errors: List[ValidationError] = []
        self.data_cache: Dict[str, Dict] = {}

    def load_schema(self) -> bool:
        """Load and parse schema file"""
        try:
            with open(self.schema_path, 'r') as f:
                self.schema = yaml.safe_load(f)
            return True
        except Exception as e:
            print(f"Error loading schema: {e}")
            return False

    def load_yaml_file(self, path: Path) -> Any:
        """Load a YAML file"""
        try:
            with open(path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.errors.append(ValidationError(
                'error', 'file_parse', 'file', str(path),
                f"Failed to parse YAML: {e}"
            ))
            return None

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
        """Load all data for an entity type"""
        entity_data = {}

        if entity_def.get('type') == 'lookup_table':
            # Load lookup table
            file_path = self.base_path / entity_def['directory'] / entity_def['file']
            if file_path.exists():
                data = self.load_yaml_file(file_path)
                if data:
                    root_key = entity_def.get('root_key')
                    items = data.get(root_key, []) if root_key else data

                    # Get primary key field
                    pk_field = None
                    for field_name, field_def in entity_def.get('fields', {}).items():
                        if field_def.get('required', False):
                            pk_field = field_name
                            break

                    if isinstance(items, list):
                        for item in items:
                            key = item.get(pk_field) if pk_field else None
                            if key:
                                entity_data[key] = item

        else:
            # Load entity files
            base_dir = self.base_path / entity_def['directory']

            # Handle subdirectories
            search_dirs = []
            if entity_def.get('subdirectories'):
                for subdir in entity_def['subdirectories']:
                    search_dirs.append(base_dir / subdir)
            elif entity_def.get('subdirectories_by_brand'):
                # Find all subdirectories (brand folders)
                if base_dir.exists():
                    search_dirs = [d for d in base_dir.iterdir() if d.is_dir()]
            else:
                search_dirs = [base_dir]

            # Load files from all search directories
            for search_dir in search_dirs:
                if not search_dir.exists():
                    continue

                for file_path in search_dir.glob("*.yaml"):
                    data = self.load_yaml_file(file_path)
                    if data:
                        # Validate the file
                        self.validate_entity_file(entity_name, entity_def, file_path, data)

                        # Store by primary key
                        pk_field = entity_def.get('primary_key', 'slug')
                        key = data.get(pk_field)
                        if key:
                            if key in entity_data:
                                self.errors.append(ValidationError(
                                    'error', 'unique_slugs', entity_name, str(file_path),
                                    f"Duplicate {pk_field}: {key}"
                                ))
                            entity_data[key] = data

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
