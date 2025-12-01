"""
Shared library for Material Database scripts

Provides common functionality for schema loading, entity loading, and data handling.
"""

from pathlib import Path
from typing import Any, Dict
import yaml


class DatabaseLoader:
    """Loads schema and entity data from YAML files"""

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.schema_path = base_path / "schema.yaml"
        self.schema = None
        self.errors: list[str] = []

    def load_schema(self) -> bool:
        """Load and parse schema file"""
        try:
            with open(self.schema_path, 'r') as f:
                self.schema = yaml.safe_load(f)
            return True
        except Exception as e:
            self.errors.append(f"Error loading schema: {e}")
            return False

    def load_yaml_file(self, path: Path) -> Any:
        """Load a YAML file"""
        try:
            with open(path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.errors.append(f"Failed to parse YAML {path}: {e}")
            return None

    def get_search_dirs(self, entity_def: Dict) -> list[Path]:
        """Get list of directories to search for entity files"""
        base_dir = self.base_path / entity_def['directory']
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

        return search_dirs

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
            search_dirs = self.get_search_dirs(entity_def)

            # Load files from all search directories
            for search_dir in search_dirs:
                if not search_dir.exists():
                    continue

                for file_path in search_dir.glob("*.yaml"):
                    data = self.load_yaml_file(file_path)
                    if data:
                        # Store by primary key
                        pk_field = entity_def.get('primary_key', 'slug')
                        key = data.get(pk_field)
                        if key:
                            entity_data[key] = data

        return entity_data

    def load_all_entities(self) -> Dict[str, Dict[str, Any]]:
        """Load all entity data"""
        data_cache = {}
        entities = self.schema.get('entities', {})

        for entity_name, entity_def in entities.items():
            data_cache[entity_name] = self.load_entity_data(entity_name, entity_def)

        return data_cache