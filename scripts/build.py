#!/usr/bin/env python3
"""
Material Database Builder

Builds the material database by loading all YAML files, resolving references,
and outputting flattened JSON files with all references resolved inline.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict

from lib import DatabaseLoader


class Builder:
    """Builds and flattens the material database"""

    def __init__(self, base_path: Path, output_path: Path):
        self.base_path = base_path
        self.output_path = output_path
        self.loader = DatabaseLoader(base_path)
        self.schema = None
        self.data_cache: Dict[str, Dict[str, Any]] = {}

    def load_schema(self) -> bool:
        """Load and parse schema file"""
        if not self.loader.load_schema():
            print(f"Error: {self.loader.errors[0]}")
            return False
        self.schema = self.loader.schema
        return True

    def load_entity_data(self, entity_name: str, entity_def: Dict) -> Dict[str, Any]:
        """Load all data for an entity type"""
        return self.loader.load_entity_data(entity_name, entity_def)

    def resolve_reference(self, value: Any, field_def: Dict) -> Any:
        """Resolve a foreign key reference"""
        if not isinstance(field_def, dict):
            return value

        fk_def = field_def.get('foreign_key')
        if not fk_def or value is None:
            return value

        target_entity = fk_def['entity']
        target_field = fk_def['field']
        target_data = self.data_cache.get(target_entity, {})

        # Handle arrays
        if isinstance(value, list):
            resolved = []
            for item in value:
                if isinstance(item, dict):
                    # Nested object with foreign keys - recurse
                    resolved.append(self.resolve_object(item, field_def.get('items', {})))
                else:
                    # Simple value - resolve the reference
                    if item in target_data:
                        resolved.append(target_data[item])
                    else:
                        resolved.append(item)
            return resolved
        else:
            # Single value
            if value in target_data:
                return target_data[value]
            return value

    def resolve_object(self, obj: Dict, obj_def: Dict) -> Dict:
        """Resolve all foreign keys in an object"""
        if not isinstance(obj, dict):
            return obj

        result = {}
        obj_fields = obj_def.get('fields', {})

        for key, val in obj.items():
            if key in obj_fields:
                field_def = obj_fields[key]
                result[key] = self.resolve_reference(val, field_def)
            else:
                result[key] = val

        return result

    def flatten_entity(self, entity_name: str, entity_def: Dict, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flatten an entity by resolving all foreign keys"""
        fields = entity_def.get('fields', {})
        flattened_data = {}

        for key, entity_obj in entity_data.items():
            flattened_obj = {}

            for field_name, field_value in entity_obj.items():
                if field_name in fields:
                    field_def = fields[field_name]

                    if field_def.get('type') == 'object':
                        # Resolve nested object
                        flattened_obj[field_name] = self.resolve_object(
                            field_value, field_def
                        )
                    elif field_def.get('type') == 'array':
                        # Resolve array items
                        if isinstance(field_value, list):
                            resolved_array = []
                            items_def = field_def.get('items', {})
                            for item in field_value:
                                if isinstance(item, dict):
                                    # Check if items have foreign keys
                                    resolved_array.append(
                                        self.resolve_object(item, items_def)
                                    )
                                else:
                                    # Simple value - resolve reference if needed
                                    resolved_array.append(
                                        self.resolve_reference(item, items_def)
                                    )
                            flattened_obj[field_name] = resolved_array
                        else:
                            flattened_obj[field_name] = field_value
                    else:
                        # Simple field - resolve if foreign key
                        flattened_obj[field_name] = self.resolve_reference(
                            field_value, field_def
                        )
                else:
                    # Unknown field, keep as-is
                    flattened_obj[field_name] = field_value

            flattened_data[key] = flattened_obj

        return flattened_data

    def build(self) -> bool:
        """Build the database"""
        print("Loading schema...")
        if not self.load_schema():
            return False

        print("Loading entity data...")
        entities = self.schema.get('entities', {})

        # Load all entity data first
        for entity_name, entity_def in entities.items():
            print(f"  Loading {entity_name}...")
            self.data_cache[entity_name] = self.load_entity_data(entity_name, entity_def)

        print("Flattening and resolving references...")

        # Create output directory
        self.output_path.mkdir(parents=True, exist_ok=True)

        # Process each entity
        for entity_name, entity_def in entities.items():
            print(f"  Processing {entity_name}...")
            entity_data = self.data_cache.get(entity_name, {})

            # Flatten the entity
            flattened = self.flatten_entity(entity_name, entity_def, entity_data)

            # Create entity output directory
            entity_output_dir = self.output_path / entity_name
            entity_output_dir.mkdir(parents=True, exist_ok=True)

            # Write individual entity files as JSON
            for key, entity_obj in flattened.items():
                output_file = entity_output_dir / f"{key}.json"
                with open(output_file, 'w') as f:
                    json.dump(entity_obj, f, indent=2)

            # Write entity index (all items in one file)
            index_file = self.output_path / f"{entity_name}.json"
            with open(index_file, 'w') as f:
                json.dump(flattened, f, indent=2)

        # Print results
        print("\n" + "="*80)
        if self.loader.errors:
            print(f"\n⚠ {len(self.loader.errors)} errors during build:")
            for error in self.loader.errors:
                print(f"  - {error}")

        print(f"✓ Build complete! Output: {self.output_path}")
        return True


def main():
    """Main entry point"""
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    output_dir = repo_root / "build"

    print(f"Material Database Builder")
    print(f"Repository: {repo_root}")
    print(f"Output: {output_dir}")
    print()

    builder = Builder(repo_root, output_dir)
    success = builder.build()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()