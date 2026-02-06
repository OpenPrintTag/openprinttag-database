#!/usr/bin/env python3
"""
Material Database JSON Schema Validator

Validates YAML data files against JSON Schema definitions.
"""

import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlparse

import yaml
from jsonschema import validators
from referencing import Registry, Resource

from uuid_utils import (
    generate_brand_uuid,
    generate_material_uuid,
    generate_material_package_uuid
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


class JsonSchemaValidator:
    """Validates material database YAML files against JSON schemas"""

    # Direct mapping of data directories to their JSON schema files
    ENTITY_SCHEMA_MAPPING = {
        'brands': 'brand.schema.json',
        'materials': 'material.schema.json',
        'material-packages': 'material_package.schema.json',
        'material-containers': 'material_container.schema.json',
    }

    # Foreign key definitions: entity -> [(field_path, target_entity, target_field, is_array)]
    FOREIGN_KEY_MAPPING = {
        'materials': [
            (['brand', 'slug'], 'brands', 'slug', False),
            (['type_id'], 'material-types', 'key', False),
            (['certification_ids'], 'material-certifications', 'key', True),
        ],
        'material-packages': [
            (['brand', 'slug'], 'brands', 'slug', False),
            (['material', 'slug'], 'materials', 'slug', False),
            (['container', 'slug'], 'material-containers', 'slug', False),
        ],
        'material-containers': [
            (['brand', 'slug'], 'brands', 'slug', False),
        ],
        'brands': [
            (['countries_of_origin'], 'countries', 'code', True),
        ],
    }

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.schema_dir = base_path / "openprinttag" / "schema"
        self.openprinttag_data_dir = base_path / "openprinttag" / "data"
        self.data_dir = base_path / "data"
        self.errors: List[ValidationError] = []
        self.registry = None
        self.validator_cache: Dict[str, Any] = {}
        self.data_cache: Dict[str, Dict[str, Any]] = {}  # entity_type -> {slug -> data}

    def setup_registry(self) -> None:
        """Set up the schema registry with a retriever function"""
        def retrieve_schema(uri: str) -> Resource:
            """Retrieve a schema resource when resolving $ref"""
            # Parse the URI to get the path
            path = urlparse(uri).path.lstrip('/')

            # If it doesn't end with .schema.json, add it
            if not path.endswith('.schema.json'):
                path = f"{path}.schema.json"

            schema_path = self.schema_dir / path
            schema_contents = json.loads(schema_path.read_text(encoding='utf-8'))

            # Let Resource.from_contents infer the specification from $schema field
            return Resource.from_contents(schema_contents)

        self.registry = Registry(retrieve=retrieve_schema)

    def get_validator(self, schema_filename: str):
        """Get a validator for a schema, creating it if needed"""
        if schema_filename in self.validator_cache:
            return self.validator_cache[schema_filename]

        # Ensure registry is set up
        if self.registry is None:
            self.setup_registry()

        # Get the schema from the registry
        schema = self.registry.get_or_retrieve(schema_filename).value.contents

        # Automatically select the correct validator class based on $schema field
        validator_class = validators.validator_for(schema)
        validator = validator_class(schema, registry=self.registry)

        self.validator_cache[schema_filename] = validator
        return validator

    def load_yaml_file(self, file_path: Path) -> Any:
        """Load a YAML file"""
        try:
            with open(file_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.errors.append(ValidationError(
                'error', 'file_parse', 'file', str(file_path),
                f"Failed to parse YAML: {e}"
            ))
            return None

    def validate_file_against_schema(self, file_path: Path, schema_filename: str, entity_type: str) -> None:
        """Validate a single YAML file against a JSON schema"""
        data = self.load_yaml_file(file_path)
        if data is None:
            return

        try:
            validator = self.get_validator(schema_filename)

            # Collect all validation errors
            errors = list(validator.iter_errors(data))
            for error in errors:
                error_path = ".".join(str(p) for p in error.absolute_path) if error.absolute_path else "root"
                self.errors.append(ValidationError(
                    'error', 'schema_validation', entity_type, str(file_path),
                    f"At '{error_path}': {error.message}"
                ))

        except Exception as e:
            self.errors.append(ValidationError(
                'error', 'validation_failed', entity_type, str(file_path),
                f"Validation failed: {e}"
            ))
            return

        # Check slug matches filename for entities with slugs
        if 'slug' in data:
            filename_slug = file_path.stem
            content_slug = data['slug']
            if content_slug != filename_slug:
                self.errors.append(ValidationError(
                    'error', 'slug_mismatch', entity_type, str(file_path),
                    f"Filename slug '{filename_slug}' does not match slug in file '{content_slug}'"
                ))

        # Cache the data for cross-entity validation
        if entity_type not in self.data_cache:
            self.data_cache[entity_type] = {}

        # Use slug as key if available, otherwise use filename
        cache_key = data.get('slug', file_path.stem)
        self.data_cache[entity_type][cache_key] = data

    def validate_entity_directory(self, entity_dir: str, schema_filename: str) -> int:
        """Validate all YAML files in an entity directory. Returns count of files validated."""
        entity_path = self.data_dir / entity_dir
        files_validated = 0

        if not entity_path.exists():
            print(f"  Warning: Directory {entity_dir} does not exist, skipping...")
            return files_validated

        # Check if this directory has subdirectories (like materials which has brand subdirs)
        subdirs = [d for d in entity_path.iterdir() if d.is_dir()]

        if subdirs:
            # Validate files in subdirectories
            for subdir in subdirs:
                for yaml_file in subdir.glob("*.yaml"):
                    self.validate_file_against_schema(yaml_file, schema_filename, entity_dir)
                    files_validated += 1
        else:
            # Validate files directly in the entity directory
            for yaml_file in entity_path.glob("*.yaml"):
                self.validate_file_against_schema(yaml_file, schema_filename, entity_dir)
                files_validated += 1

        return files_validated

    def load_material_types(self) -> None:
        """Load material types from openprinttag/data/material_types.yaml"""
        material_types_file = self.openprinttag_data_dir / "material_types.yaml"

        if not material_types_file.exists():
            print(f"  Warning: Material types file not found at {material_types_file}")
            return

        data = self.load_yaml_file(material_types_file)
        if data is None or not isinstance(data, list):
            return

        # Store material types indexed by their 'key' field
        self.data_cache['material-types'] = {}
        for material_type in data:
            if isinstance(material_type, dict) and 'key' in material_type:
                # Use the key as the cache key for lookups
                self.data_cache['material-types'][material_type['key']] = material_type

    def load_countries(self) -> None:
        """Load countries from openprinttag/data/countries.yaml"""
        countries_file = self.openprinttag_data_dir / "countries.yaml"

        if not countries_file.exists():
            print(f"  Warning: Countries file not found at {countries_file}")
            return

        data = self.load_yaml_file(countries_file)
        if data is None or not isinstance(data, list):
            return

        self.data_cache['countries'] = {}
        for country in data:
            if isinstance(country, dict) and 'code' in country:
                self.data_cache['countries'][country['code']] = country

    def load_material_certifications(self) -> None:
        """Load material certifications from openprinttag/data/material_certifications.yaml"""
        material_certifications_file = self.openprinttag_data_dir / "material_certifications.yaml"

        if not material_certifications_file.exists():
            print(f"  Warning: Material certifications file not found at {material_certifications_file}")
            return

        data = self.load_yaml_file(material_certifications_file)
        if data is None or not isinstance(data, list):
            return

        # Store material certifications indexed by their 'key' field
        self.data_cache['material-certifications'] = {}
        for certification in data:
            if isinstance(certification, dict) and 'key' in certification:
                # Use the key as the cache key for lookups
                self.data_cache['material-certifications'][certification['key']] = certification

    def get_nested_value(self, data: Dict[str, Any], path: List[str]) -> Any:
        """Get a nested value from a dictionary using a path"""
        value = data
        for key in path:
            if not isinstance(value, dict):
                return None
            value = value.get(key)
            if value is None:
                return None
        return value

    def validate_foreign_keys(self) -> None:
        """Validate all foreign key references exist"""
        for entity_type, fk_definitions in self.FOREIGN_KEY_MAPPING.items():
            entity_data = self.data_cache.get(entity_type, {})

            for entity_key, entity_obj in entity_data.items():
                for field_path, target_entity, target_field, is_array in fk_definitions:
                    value = self.get_nested_value(entity_obj, field_path)

                    if value is None:
                        continue

                    target_data = self.data_cache.get(target_entity, {})

                    # Handle arrays
                    values_to_check = value if is_array else [value]

                    for val in values_to_check:
                        # Check if value exists in target entity
                        found = any(
                            item.get(target_field) == val
                            for item in target_data.values()
                        )
                        if not found:
                            field_name = '.'.join(field_path)
                            self.errors.append(ValidationError(
                                'error', 'foreign_key_exists', entity_type, entity_key,
                                f"Foreign key {field_name}={val} not found in {target_entity}.{target_field}"
                            ))

    def validate_uuids(self) -> None:
        """Validate UUIDs match their derived values according to uuid.md specification"""

        # Validate brands
        brands_data = self.data_cache.get('brands', {})
        for brand_slug, brand_data in brands_data.items():
            expected_uuid = generate_brand_uuid(brand_data['name'])
            is_valid = expected_uuid == uuid.UUID(brand_data['uuid'])
            if not is_valid:
                self.errors.append(ValidationError(
                    'error', 'uuid_derivation', 'brands', brand_slug, 'Invalid UUID'
                ))

        # Validate materials (need brand UUID)
        materials_data = self.data_cache.get('materials', {})
        for material_slug, material_data in materials_data.items():
            # Extract brand slug from format: brand: { slug: "value" }
            brand_ref = material_data.get('brand')
            if not brand_ref or not isinstance(brand_ref, dict):
                continue
            brand_slug = brand_ref.get('slug')
            if not brand_slug:
                continue

            brand_data = brands_data.get(brand_slug)
            if not brand_data or 'uuid' not in brand_data:
                # FK validation will catch missing brand
                continue

            try:
                brand_uuid = uuid.UUID(brand_data['uuid'])
                expected_uuid = generate_material_uuid(brand_uuid, material_data['name'])
                is_valid = expected_uuid == uuid.UUID(material_data['uuid'])
                if not is_valid:
                    self.errors.append(ValidationError(
                        'error', 'uuid_derivation', 'materials', material_slug,'Invalid UUID'
                    ))
            except (ValueError, TypeError):
                # UUID format validation will catch this
                pass

        # Validate material packages (need brand UUID)
        packages_data = self.data_cache.get('material-packages', {})
        for package_slug, package_data in packages_data.items():
            # Extract brand slug from format: brand: { slug: "value" }
            brand_ref = package_data.get('brand')
            if not brand_ref or not isinstance(brand_ref, dict):
                continue
            brand_slug = brand_ref.get('slug')
            if not brand_slug:
                continue

            brand_data = brands_data.get(brand_slug)
            if not brand_data or 'uuid' not in brand_data:
                # FK validation will catch missing brand
                continue

            try:
                brand_uuid = uuid.UUID(brand_data['uuid'])
                expected_uuid = generate_material_package_uuid(brand_uuid, package_data['gtin'])
                is_valid = expected_uuid == uuid.UUID(package_data['uuid'])
                if not is_valid:
                    self.errors.append(ValidationError(
                        'error', 'uuid_derivation', 'material-packages', package_slug, 'Invalid UUID'
                    ))
            except (ValueError, TypeError):
                # UUID format validation will catch this
                pass

    def validate(self) -> bool:
        """Run all validations"""
        print("Material Database JSON Schema Validator")
        print("=" * 80)

        # Check if schema directory exists
        if not self.schema_dir.exists():
            print(f"Error: Schema directory not found at {self.schema_dir}")
            print("Please ensure JSON schemas are present in the /schema directory")
            return False

        print(f"\nSchema directory: {self.schema_dir}")
        print(f"Data directory: {self.data_dir}")
        print(f"\nValidating entity data against schemas...")

        # Validate each entity type
        total_files = 0
        for entity_dir, schema_filename in self.ENTITY_SCHEMA_MAPPING.items():
            print(f"  {entity_dir} -> {schema_filename}...", end=" ")
            count = self.validate_entity_directory(entity_dir, schema_filename)
            total_files += count
            print(f"{count} files")

        print("\nLoading reference data...")
        self.load_material_types()
        self.load_material_certifications()
        self.load_countries()

        print("\nValidating foreign key references...")
        self.validate_foreign_keys()

        print("Validating UUIDs...")
        self.validate_uuids()

        # Print results
        print("\n" + "=" * 80)
        print(f"Validated {total_files} files")
        print()

        if not self.errors:
            print("✓ Validation passed! No errors found.")
            return True

        # Group errors by level
        errors = [e for e in self.errors if e.level == 'error']
        warnings = [e for e in self.errors if e.level == 'warning']
        infos = [e for e in self.errors if e.level == 'info']

        if errors:
            print(f"✗ ERRORS ({len(errors)}):")
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

        print("\n" + "=" * 80)
        print(f"Summary: {len(errors)} errors, {len(warnings)} warnings, {len(infos)} info")

        return len(errors) == 0


def main():
    """Main entry point"""
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    print(f"Repository: {repo_root}\n")

    validator = JsonSchemaValidator(repo_root)
    success = validator.validate()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
