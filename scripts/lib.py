"""
Shared library for Material Database scripts

Provides common functionality for entity loading and data handling.
"""

from pathlib import Path
from typing import Any, Dict
import yaml


class DatabaseLoader:
    """Loads entity data from YAML files"""

    # Entity definitions mapping
    ENTITIES = {
        'brands': {
            'directory': 'data/brands',
            'primary_key': 'slug',
        },
        'materials': {
            'directory': 'data/materials',
            'primary_key': 'slug',
            'subdirectories_by_brand': True,
        },
        'material_packages': {
            'directory': 'data/material-packages',
            'primary_key': 'slug',
            'subdirectories_by_brand': True,
        },
        'material_containers': {
            'directory': 'data/material-containers',
            'primary_key': 'slug',
            'subdirectories_by_brand': True,
        },
    }

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.schema = {'entities': self.ENTITIES}  # For backward compatibility
        self.errors: list[str] = []

    def load_schema(self) -> bool:
        """Load schema - now just validates structure exists"""
        # Schema is now hardcoded, just check data directory exists
        data_dir = self.base_path / 'data'
        if not data_dir.exists():
            self.errors.append(f"Data directory not found: {data_dir}")
            return False
        return True

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

        if entity_def.get('subdirectories_by_brand'):
            # Find all subdirectories (brand folders)
            if base_dir.exists():
                search_dirs = [d for d in base_dir.iterdir() if d.is_dir()]
        else:
            search_dirs = [base_dir]

        return search_dirs

    def load_entity_data(self, entity_name: str, entity_def: Dict) -> Dict[str, Any]:
        """Load all data for an entity type"""
        entity_data = {}

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
        if self.schema is None:
            entities = {}
        else:
            entities = self.schema.get('entities', {})

        for entity_name, entity_def in entities.items():
            data_cache[entity_name] = self.load_entity_data(entity_name, entity_def)

        return data_cache
