#!/usr/bin/env python3
"""
Fix Duplicate Slugs Script

Finds and fixes duplicate slugs by appending numbers to make them unique.
Updates both the slug in YAML content and renames files accordingly.
"""

import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple
import yaml

from lib import DatabaseLoader


def load_yaml(path: Path):
	"""Load YAML file"""
	with open(path, 'r') as f:
		return yaml.safe_load(f)


def save_yaml(path: Path, data):
	"""Save YAML file"""
	with open(path, 'w') as f:
		yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def get_new_slug(base_slug: str, existing_slugs: set, counter: int = 2) -> str:
	"""Generate a new unique slug by appending a number"""
	new_slug = f"{base_slug}-{counter}"
	while new_slug in existing_slugs:
		counter += 1
		new_slug = f"{base_slug}-{counter}"
	return new_slug


def fix_entity_slugs(
	base_path: Path,
	loader: DatabaseLoader,
	entity_name: str,
	entity_def: Dict
) -> int:
	"""Fix duplicate slugs for a single entity type"""
	
	if entity_def.get('type') == 'lookup_table':
		# Lookup tables don't use slugs as primary keys
		return 0
	
	# Get all files for this entity type
	search_dirs = loader.get_search_dirs(entity_def)
	pk_field = entity_def.get('primary_key', 'slug')
	
	# Collect all files and their slugs
	files_by_slug: Dict[str, List[Tuple[Path, Dict]]] = defaultdict(list)
	
	for search_dir in search_dirs:
		if not search_dir.exists():
			continue
		
		for file_path in search_dir.glob("*.yaml"):
			data = load_yaml(file_path)
			if not data:
				continue
			
			slug = data.get(pk_field)
			if slug:
				files_by_slug[slug].append((file_path, data))
	
	# Find duplicates and fix them
	fixed_count = 0
	all_slugs = set(files_by_slug.keys())
	
	for slug, file_list in files_by_slug.items():
		if len(file_list) <= 1:
			# No duplicates
			continue
		
		print(f"  Found {len(file_list)} duplicate(s) for slug '{slug}' in {entity_name}")
		
		# Keep the first one, fix the rest
		for i, (file_path, data) in enumerate(file_list):
			if i == 0:
				# Keep first occurrence as-is
				continue
			
			# Generate new unique slug
			new_slug = get_new_slug(slug, all_slugs)
			all_slugs.add(new_slug)
			
			# Update slug in data
			old_slug = data.get(pk_field)
			data[pk_field] = new_slug
			
			# Determine new file path
			if entity_def.get('subdirectories_by_brand'):
				# Files are in brand subdirectories
				brand_slug = data.get('brand_slug', '')
				if brand_slug:
					new_file_path = file_path.parent / f"{new_slug}.yaml"
				else:
					# Fallback: use same directory
					new_file_path = file_path.parent / f"{new_slug}.yaml"
			elif entity_def.get('subdirectories'):
				# Files are in specific subdirectories
				new_file_path = file_path.parent / f"{new_slug}.yaml"
			else:
				# Files are in base directory
				new_file_path = file_path.parent / f"{new_slug}.yaml"
			
			# Save updated data
			save_yaml(new_file_path, data)
			
			# Remove old file if path changed
			if new_file_path != file_path:
				file_path.unlink()
				print(f"    {old_slug} -> {new_slug} (renamed {file_path.name} -> {new_file_path.name})")
			else:
				print(f"    {old_slug} -> {new_slug} (updated {file_path.name})")
			
			fixed_count += 1
	
	return fixed_count


def fix_all_slugs(base_path: Path, loader: DatabaseLoader) -> int:
	"""Fix duplicate slugs for all entity types"""
	
	if not loader.load_schema():
		print(f"Error loading schema: {loader.errors[0]}")
		return 0
	
	entities = loader.schema.get('entities', {})
	total_fixed = 0
	
	print("Fixing duplicate slugs...")
	print()
	
	for entity_name, entity_def in entities.items():
		# Skip lookup tables (they use different primary keys)
		if entity_def.get('type') == 'lookup_table':
			continue
		
		print(f"Checking {entity_name}...")
		fixed = fix_entity_slugs(base_path, loader, entity_name, entity_def)
		if fixed > 0:
			print(f"  Fixed {fixed} duplicate(s)")
		else:
			print(f"  No duplicates found")
		total_fixed += fixed
		print()
	
	return total_fixed


def main():
	"""Main entry point"""
	# Find repository root
	script_dir = Path(__file__).parent
	repo_root = script_dir.parent
	
	print(f"Fix Duplicate Slugs Script")
	print(f"Repository: {repo_root}")
	print()
	
	loader = DatabaseLoader(repo_root)
	total_fixed = fix_all_slugs(repo_root, loader)
	
	print("="*80)
	if total_fixed > 0:
		print(f"✓ Fixed {total_fixed} duplicate slug(s)")
		print("Run 'make validate' to verify.")
	else:
		print("✓ No duplicate slugs found!")
	
	sys.exit(0)


if __name__ == '__main__':
	main()
