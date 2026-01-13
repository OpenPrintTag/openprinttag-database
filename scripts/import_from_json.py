#!/usr/bin/env python3
"""
Import and Transform JSON Export to YAML Files

Transforms a db-export.json file into the expected YAML file structure
according to the schema.yaml specification.

Usage:
    python scripts/import_from_json.py

Requirements:
    - db-export.json file in the repository root
    - PyYAML (install via: make setup or pip install PyYAML)

The script will:
    1. Load db-export.json from the repository root
    2. Transform entities according to schema.yaml
    3. Generate slugs from names
    4. Generate UUIDs deterministically (UUIDv5) according to specification
    5. Resolve UUID references to slugs
    6. Map material types and certifications to OpenPrintTag IDs
    7. Validate tags against OpenPrintTag schema
    8. Write YAML files to data/ directory structure

Output structure:
    data/
    ├── brands/
    ├── materials/{brand-slug}/
    ├── material-packages/{brand-slug}/
    ├── material-containers/
    └── lookup-tables/

Note:
    UUIDs are now generated deterministically during import, so the
    fix-uuids step is no longer required.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml

from uuid_utils import (
	generate_brand_uuid,
	generate_material_uuid,
	generate_material_package_uuid,
)


def slugify(text: str) -> str:
	"""Convert text to a slug (lowercase alphanumeric with hyphens)"""
	if not text:
		return ""
	# Convert to lowercase
	text = text.lower()
	# Replace spaces and underscores with hyphens
	text = re.sub(r'[\s_]+', '-', text)
	# Remove all non-alphanumeric characters except hyphens
	text = re.sub(r'[^a-z0-9\-]', '', text)
	# Replace multiple hyphens with single hyphen
	text = re.sub(r'-+', '-', text)
	# Remove leading/trailing hyphens
	text = text.strip('-')
	return text


def create_uuid_map(data: Dict, key_field: str = 'uuid') -> Dict[str, Any]:
	"""Create a map from UUID to entity for quick lookup"""
	uuid_map = {}
	for item in data:
		uuid_val = item.get(key_field)
		if uuid_val:
			uuid_map[uuid_val] = item
	return uuid_map


def resolve_uuid_reference(uuid_val: Any, uuid_map: Dict[str, Any], field: str = None) -> Any:
	"""Resolve a UUID reference to the actual entity or a specific field"""
	if not uuid_val:
		return None
	if isinstance(uuid_val, list):
		return [resolve_uuid_reference(u, uuid_map, field) for u in uuid_val if u]
	entity = uuid_map.get(uuid_val)
	if not entity:
		return None
	if field:
		return entity.get(field)
	return entity


def transform_brand(brand: Dict, countries_map: Dict[str, Any]) -> Dict[str, Any]:
	"""Transform a brand from JSON to YAML format"""
	brand_name = brand.get('name', '')
	result = {
		'uuid': str(generate_brand_uuid(brand_name)),
		'slug': slugify(brand_name),
		'name': brand_name,
	}
	
	# Keywords
	if brand.get('keywords'):
		result['keywords'] = brand['keywords']
	
	# URL templates
	if brand.get('material_url_template'):
		result['material_url_template'] = brand['material_url_template']
	if brand.get('material_package_url_template'):
		result['material_package_url_template'] = brand['material_package_url_template']
	if brand.get('material_package_instance_url_template'):
		result['material_package_instance_url_template'] = brand['material_package_instance_url_template']
	
	# Link patterns
	if brand.get('link_patterns'):
		result['link_patterns'] = brand['link_patterns']
	
	# Countries of origin
	if brand.get('country_uuid'):
		country = countries_map.get(brand['country_uuid'])
		if country and country.get('code'):
			result['countries_of_origin'] = [country['code']]
	
	return result


def transform_color(color: Dict) -> Dict[str, Any]:
	"""Transform a color from JSON to YAML format"""
	result = {
		'uuid': color.get('uuid'),
		'name': color.get('name', ''),
	}
	
	# Calculate rgba from rgba_r, rgba_g, rgba_b, rgba_a
	rgba_r = color.get('rgba_r')
	rgba_g = color.get('rgba_g')
	rgba_b = color.get('rgba_b')
	rgba_a = color.get('rgba_a', 255)  # Default to 255 if not provided
	
	# Convert to integers if they're strings
	if rgba_r is not None:
		if isinstance(rgba_r, str):
			try:
				rgba_r = int(rgba_r)
			except (ValueError, TypeError):
				rgba_r = None
	if rgba_g is not None:
		if isinstance(rgba_g, str):
			try:
				rgba_g = int(rgba_g)
			except (ValueError, TypeError):
				rgba_g = None
	if rgba_b is not None:
		if isinstance(rgba_b, str):
			try:
				rgba_b = int(rgba_b)
			except (ValueError, TypeError):
				rgba_b = None
	if rgba_a is not None:
		if isinstance(rgba_a, str):
			try:
				rgba_a = int(rgba_a)
			except (ValueError, TypeError):
				rgba_a = 255
	
	# Format as #rrggbbaa hex string
	if rgba_r is not None and rgba_g is not None and rgba_b is not None:
		if rgba_a is None:
			rgba_a = 255
		rgba_hex = f"#{rgba_r:02x}{rgba_g:02x}{rgba_b:02x}{rgba_a:02x}"
		result['color_rgba'] = rgba_hex
	
	return result


def transform_material(
	material: Dict,
	brands_map: Dict[str, Any],
	material_types_map: Dict[str, Any],
	tags_map: Dict[str, Any],
	certifications_map: Dict[str, Any],
	certification_name_mapping: Dict[str, str],  # certification name/slug -> OpenPrintTag name mapping
	colors_map: Dict[str, Any],
	material_colors_id_to_uuid_map: Dict[int, str],  # materials_colors ID -> color UUID
	photos_map: Dict[str, Any],
	material_properties_map: Dict[str, Any],  # properties_uuid -> properties object
	fff_material_properties_map: Dict[str, Any],  # fff_properties_uuid -> fff properties
	material_tags_map: Dict[str, List[str]],  # material_uuid -> list of tag UUIDs
	material_certifications_map: Dict[str, List[int]],  # material_uuid -> list of cert IDs
	material_photos_map: Dict[str, List[int]],  # material_uuid -> list of photo IDs
	valid_tag_names: set,  # Valid tag names from OpenPrintTag
	valid_type_abbreviations: set,  # Valid type abbreviations from OpenPrintTag
	tag_warnings: List[str],  # List to collect warnings
	certification_warnings: List[str],  # List to collect certification warnings
	type_warnings: List[str],  # List to collect type validation warnings
) -> Optional[Dict[str, Any]]:
	"""Transform a material from JSON to YAML format"""
	brand = resolve_uuid_reference(material.get('brand'), brands_map)
	if not brand:
		return None

	brand_name = brand.get('name', '')
	brand_slug = slugify(brand_name)
	material_name = material.get('name', '')

	# Generate UUID deterministically from brand UUID + material name
	brand_uuid = generate_brand_uuid(brand_name)
	material_uuid = generate_material_uuid(brand_uuid, material_name)

	result = {
		'uuid': str(material_uuid),
		'slug': slugify(f"{brand_slug}-{material_name}"),
		'brand': {'slug': brand_slug},
		'name': material_name,
		'class': material.get('class', 'FFF'),
	}
	
	if material.get('brand_specific_id'):
		result['brand_specific_id'] = material['brand_specific_id']

	# Type - get abbreviation from material_types table and validate against OpenPrintTag
	material_type_abbrev = None
	if material.get('type'):
		mt_uuid = material['type']
		mt = resolve_uuid_reference(mt_uuid, material_types_map)
		if mt and mt.get('abbreviation'):
			material_type_abbrev = mt['abbreviation']
			# Validate type against OpenPrintTag
			if material_type_abbrev not in valid_type_abbreviations:
				type_warnings.append(f"Material '{material_name}': invalid type '{material_type_abbrev}' (not in OpenPrintTag) - skipping material")
				return None
			result['type'] = material_type_abbrev

	# Abbreviation - use material's own abbreviation if available, otherwise use type's abbreviation
	abbreviation = ''
	if material.get('abbreviation'):
		abbreviation = material['abbreviation']
	elif material_type_abbrev:
		abbreviation = material_type_abbrev

	# Always set abbreviation (required field) - use empty string if not found
	result['abbreviation'] = abbreviation
	
	# URL
	if material.get('url'):
		result['url'] = material['url']
	
	# Colors - primary_color and secondary_colors
	# These reference the colors table which has rgba values
	if material.get('primary_color'):
		primary_color = resolve_uuid_reference(material['primary_color'], colors_map)
		if primary_color:
			# Build color_rgba from color object
			color_rgba = primary_color.get('color_rgba')
			if color_rgba:
				result['primary_color'] = {'color_rgba': color_rgba}
	
	secondary_colors = []
	if material.get('secondary_colors') and isinstance(material['secondary_colors'], list):
		for color_ref in material['secondary_colors']:
			# secondary_colors can be either UUIDs or IDs from materials_colors table
			color_uuid = None
			if isinstance(color_ref, int):
				# It's an ID from materials_colors table, look it up
				color_uuid = material_colors_id_to_uuid_map.get(color_ref)
			elif isinstance(color_ref, str):
				# It's already a UUID
				color_uuid = color_ref
			
			if color_uuid:
				color = colors_map.get(color_uuid)
				if color:
					color_rgba = color.get('color_rgba')
					if color_rgba:
						secondary_colors.append({'color_rgba': color_rgba})
	if secondary_colors:
		result['secondary_colors'] = secondary_colors
	
	# Get material UUID for relationship lookups
	material_uuid = material.get('uuid')
	
	# Optical properties - convert to numbers if they're strings
	if material.get('transmission_distance') is not None:
		td = material['transmission_distance']
		# Convert string to number if needed
		if isinstance(td, str):
			try:
				td = float(td)
			except (ValueError, TypeError):
				td = None
		if td is not None:
			result['transmission_distance'] = td
	
	if material.get('refractive_index') is not None:
		ri = material['refractive_index']
		# Convert string to number if needed
		if isinstance(ri, str):
			try:
				ri = float(ri)
			except (ValueError, TypeError):
				ri = None
		if ri is not None:
			result['refractive_index'] = ri
	
	# Tags - resolve from material_tags relationship table
	# Tags to be transformed to 'contains_organic_material'
	organic_material_tags = {
		'contains_distillery_waste',
		'contains_hemp',
		'contains_linen',
		'contains_mineral',
		'contains_olive_bones',
		'contains_plant',
	}

	tags = []
	raw_tags = []  # Collect raw tag names for validation

	if material_uuid and material_uuid in material_tags_map:
		for tag_uuid in material_tags_map[material_uuid]:
			tag = resolve_uuid_reference(tag_uuid, tags_map)
			if tag:
				tag_slug = tag.get('name', '')
				if tag_slug:
					raw_tags.append(tag_slug)

	# Also check if material has direct tags field (fallback)
	if not raw_tags and material.get('tags'):
		for tag_ref in material['tags']:
			if isinstance(tag_ref, str):
				# It's a UUID, resolve it
				tag = resolve_uuid_reference(tag_ref, tags_map)
				if tag:
					tag_slug = tag.get('name', '')
					if tag_slug:
						raw_tags.append(tag_slug)
			elif isinstance(tag_ref, dict):
				# It's already a tag object
				tag_slug = tag_ref.get('name', '')
				if tag_slug:
					raw_tags.append(tag_slug)

	# Validate and transform tags
	has_organic_material = False
	for tag_name in raw_tags:
		# Check if tag should be transformed to contains_organic_material
		if tag_name in organic_material_tags:
			has_organic_material = True
			tag_warnings.append(f"Material '{material_name}': transformed tag '{tag_name}' → 'contains_organic_material'")
			continue

		# Check if tag is valid according to OpenPrintTag
		if tag_name not in valid_tag_names:
			tag_warnings.append(f"Material '{material_name}': dropped invalid tag '{tag_name}' (not in OpenPrintTag)")
			continue

		# Tag is valid, add it
		tags.append(tag_name)

	# Add contains_organic_material if any organic tags were found
	if has_organic_material:
		tags.append('contains_organic_material')

	if tags:
		result['tags'] = tags
	
	# Certifications - resolve to names from OpenPrintTag
	certifications = []
	if material_uuid and material_uuid in material_certifications_map:
		for cert_id in material_certifications_map[material_uuid]:
			# Look up certification by ID
			cert = certifications_map.get(cert_id)
			if cert:
				cert_name = cert.get('name', '')

				# Strip common prefixes like "Certificate - " before processing
				cert_name_cleaned = cert_name
				if cert_name.startswith('Certificate - '):
					cert_name_cleaned = cert_name[len('Certificate - '):]

				# Try to map to OpenPrintTag certification name
				# First try slugified cleaned name
				cert_slug = slugify(cert_name_cleaned)
				openprinttag_cert_name = certification_name_mapping.get(cert_slug)

				# If not found, try slugified cleaned name with hyphens replaced by underscores
				if openprinttag_cert_name is None:
					cert_slug_underscore = cert_slug.replace('-', '_')
					openprinttag_cert_name = certification_name_mapping.get(cert_slug_underscore)

				# If not found, try original cleaned name as fallback
				if openprinttag_cert_name is None and cert_name_cleaned:
					openprinttag_cert_name = certification_name_mapping.get(cert_name_cleaned)

				# If still not found, try with original name (including prefix)
				if openprinttag_cert_name is None:
					cert_slug_original = slugify(cert_name)
					openprinttag_cert_name = certification_name_mapping.get(cert_slug_original)

				if openprinttag_cert_name is None and cert_name:
					openprinttag_cert_name = certification_name_mapping.get(cert_name)

				if openprinttag_cert_name is not None:
					certifications.append(openprinttag_cert_name)
				else:
					# Log warning if certification not found in OpenPrintTag
					certification_warnings.append(
						f"Material '{material_name}': dropped certification '{cert_name}' "
						f"(cleaned: '{cert_name_cleaned}', slug: '{cert_slug}') - not found in OpenPrintTag"
					)
	if certifications:
		result['certifications'] = certifications
	
	# Photos
	photos = []
	if material_uuid and material_uuid in material_photos_map:
		for photo_id in material_photos_map[material_uuid]:
			photo = photos_map.get(photo_id)
			if photo and photo.get('url'):
				# Map photo type to schema values
				photo_type = photo.get('type', 'unspecified')
				type_mapping = {
					'gallery': 'unspecified',
					'print': 'print',
					'package': 'package',
					'filament_colors_sample': 'filament_colors_sample',
				}
				photo_obj = {
					'url': photo['url'],
					'type': type_mapping.get(photo_type, 'unspecified'),
				}
				photos.append(photo_obj)
	if photos:
		result['photos'] = photos
	
	# Properties - resolve from material_properties table if it's a UUID
	properties = {}
	properties_uuid = material.get('properties')
	
	if properties_uuid and isinstance(properties_uuid, str):
		# It's a UUID reference, look it up
		material_props = material_properties_map.get(properties_uuid)
		if material_props:
			# Copy all properties, converting strings to numbers where appropriate
			for key, value in material_props.items():
				if key in ['uuid', 'fff_material_properties', 'sla_material_properties']:
					continue
				if value is not None:
					# Try to convert numeric strings to numbers
					if isinstance(value, str):
						try:
							# Try float first (handles decimals)
							if '.' in value:
								value = float(value)
							else:
								value = int(value)
						except ValueError:
							# Keep as string if conversion fails
							pass
					properties[key] = value
			
			# Also check for FFF-specific properties
			if material.get('class') == 'FFF' and material_props.get('fff_material_properties'):
				fff_props_uuid = material_props['fff_material_properties']
				fff_props = fff_material_properties_map.get(fff_props_uuid)
				if fff_props:
					for key, value in fff_props.items():
						if key != 'uuid' and value is not None:
							if isinstance(value, str):
								try:
									if '.' in value:
										value = float(value)
									else:
										value = int(value)
								except ValueError:
									pass
							properties[key] = value
	elif properties_uuid and isinstance(properties_uuid, dict):
		# Already a dict, use it directly
		properties = properties_uuid
	
	# Always set properties as an object (even if empty)
	result['properties'] = properties
	
	return result


def transform_material_package(
	package: Dict,
	brands_map: Dict[str, Any],
	materials_map: Dict[str, Any],
	containers_map: Dict[str, Any],
	fff_packages_map: Dict[str, Any],
) -> tuple[Optional[Dict[str, Any]], Optional[str], Optional[str]]:
	"""Transform a material package from JSON to YAML format"""
	brand = None
	material = None

	# Get brand from material
	if package.get('material_uuid'):
		material = materials_map.get(package['material_uuid'])
		if material and material.get('brand'):
			brand = brands_map.get(material['brand'])

	if not brand or not material:
		return None, None, None

	brand_name = brand.get('name', '')
	brand_slug = slugify(brand_name)
	material_name = material.get('name', '')
	material_slug = slugify(f"{brand_slug}-{material_name}")

	# Get FFF package details
	fff_package = None
	if package.get('fff_material_package'):
		fff_package_uuid = package['fff_material_package']
		fff_package = fff_packages_map.get(fff_package_uuid)

	# Generate UUID deterministically from brand UUID + GTIN
	gtin = package.get('gtin')
	brand_uuid = generate_brand_uuid(brand_name)
	package_uuid = generate_material_package_uuid(brand_uuid, gtin) if gtin else None

	result = {
		'uuid': str(package_uuid) if package_uuid else package.get('uuid'),  # fallback to original if no GTIN
		'slug': slugify(f"{material_slug}-{package.get('nominal_netto_full_weight', '1kg')}-spool"),
		'class': material.get('class', 'FFF'),
		'material': {'slug': material_slug},
		'nominal_netto_full_weight': package.get('nominal_netto_full_weight', 1000),
	}
	
	if package.get('brand_specific_id'):
		result['brand_specific_id'] = package['brand_specific_id']

	# Convert GTIN to number - if it fails, return None to skip this package
	if package.get('gtin'):
		gtin_value = package['gtin']
		try:
			# Try to convert to integer
			if isinstance(gtin_value, str):
				gtin_value = int(gtin_value)
			elif not isinstance(gtin_value, int):
				# If it's not a string or int, it's invalid
				# Build entity identifier for warning
				package_uuid = package.get('uuid', 'unknown')
				material_name = material.get('name', '')
				weight = package.get('nominal_netto_full_weight', '1kg')
				entity_identifier = f"{material_name} {weight} [{package_uuid}]"
				return None, None, f"Material Package {entity_identifier}: invalid GTIN type"
			result['gtin'] = gtin_value
		except (ValueError, TypeError):
			# Invalid GTIN - skip this package
			# Build entity identifier for warning
			package_uuid = package.get('uuid', 'unknown')
			material_name = material.get('name', '')
			weight = package.get('nominal_netto_full_weight', '1kg')
			entity_identifier = f"{material_name} {weight} [{package_uuid}]"
			return None, None, f"Material Package {entity_identifier}: invalid GTIN value (conversion failed)"

	if package.get('url'):
		result['url'] = package['url']
	
	# Container
	if package.get('container'):
		container = containers_map.get(package['container'])
		if container:
			container_slug = slugify(container.get('name', ''))
			if container_slug:
				result['container'] = {'slug': container_slug}
	
	# FFF-specific fields
	if fff_package:
		if fff_package.get('filament_diameter'):
			# Convert mm to micrometers (e.g., "1.75" -> 1750)
			diameter = fff_package['filament_diameter']
			if isinstance(diameter, str):
				try:
					diameter = float(diameter) * 1000
				except ValueError:
					diameter = None
			if diameter:
				result['filament_diameter'] = int(diameter)
		if fff_package.get('filament_diameter_tolerance'):
			tolerance = fff_package['filament_diameter_tolerance']
			if isinstance(tolerance, str):
				try:
					tolerance = float(tolerance) * 1000
				except ValueError:
					tolerance = None
			if tolerance:
				result['filament_diameter_tolerance'] = int(tolerance)
		if fff_package.get('nominal_full_length'):
			result['nominal_full_length'] = fff_package['nominal_full_length']

	# Check for required filament_diameter field - skip package if missing
	if 'filament_diameter' not in result:
		# Build entity identifier for warning
		package_uuid = package.get('uuid', 'unknown')
		material_name = material.get('name', '')
		weight = package.get('nominal_netto_full_weight', '1kg')
		entity_identifier = f"{material_name} {weight} [{package_uuid}]"
		return None, None, f"Material Package {entity_identifier}: missing filament_diameter in transformed result"

	return result, brand_slug, None


def transform_material_container(
	container: Dict,
	brands_map: Dict[str, Any],
	fff_containers_map: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
	"""Transform a material container from JSON to YAML format"""
	brand = None
	if container.get('brand'):
		brand = brands_map.get(container['brand'])
	
	result = {
		'uuid': container.get('uuid'),
		'slug': slugify(container.get('name', '')),
		'name': container.get('name', ''),
		'class': container.get('class', 'FFF'),
	}

	if brand:
		result['brand'] = {'slug': slugify(brand.get('name', ''))}
	if container.get('brand_specific_id'):
		result['brand_specific_id'] = container['brand_specific_id']
	
	# Get FFF container details
	fff_container = None
	if container.get('fff_material_container'):
		fff_container = fff_containers_map.get(container['fff_material_container'])
	
	if fff_container:
		if fff_container.get('volumetric_capacity'):
			result['volumetric_capacity'] = fff_container['volumetric_capacity']
		if fff_container.get('empty_weight'):
			result['empty_weight'] = fff_container['empty_weight']
		if fff_container.get('hole_diameter'):
			result['hole_diameter'] = fff_container['hole_diameter']
		if fff_container.get('inner_diameter'):
			result['inner_diameter'] = fff_container['inner_diameter']
		if fff_container.get('outer_diameter'):
			result['outer_diameter'] = fff_container['outer_diameter']
		if fff_container.get('width'):
			result['width'] = fff_container['width']
		if fff_container.get('length'):
			result['length'] = fff_container['length']
		if fff_container.get('height'):
			result['height'] = fff_container['height']
	
	return result


def build_relationship_maps(data: Dict) -> Dict[str, Dict[str, List]]:
	"""Build maps for many-to-many relationships"""
	maps = {
		'material_tags': {},  # material_uuid -> [tag_uuids]
		'material_certifications': {},  # material_uuid -> [cert_ids]
		'material_photos': {},  # material_uuid -> [photo_ids]
	}
	
	# Material tags - check multiple possible field names
	material_tags_data = None
	if 'material_tags' in data:
		material_tags_data = data['material_tags']
	elif 'materials_tags' in data:
		material_tags_data = data['materials_tags']
	
	if material_tags_data:
		for mt in material_tags_data:
			# Try multiple field name variations
			material_uuid = mt.get('material_uuid') or mt.get('materials_uuid') or mt.get('material')
			tag_uuid = mt.get('tag_uuid') or mt.get('tags_uuid') or mt.get('tag')
			
			if material_uuid and tag_uuid:
				if material_uuid not in maps['material_tags']:
					maps['material_tags'][material_uuid] = []
				maps['material_tags'][material_uuid].append(tag_uuid)
	
	# Material certifications
	if 'materials_certifications_2' in data:
		for mc in data['materials_certifications_2']:
			material_uuid = mc.get('materials_uuid')
			cert_id = mc.get('certifications_id')
			if material_uuid and cert_id:
				# Store the certification ID directly (certifications use IDs, not UUIDs)
				if material_uuid not in maps['material_certifications']:
					maps['material_certifications'][material_uuid] = []
				maps['material_certifications'][material_uuid].append(cert_id)
	
	# Material photos
	if 'material_photos' in data:
		for mp in data['material_photos']:
			material_uuid = mp.get('material_uuid')
			photo_id = mp.get('id')
			if material_uuid and photo_id:
				if material_uuid not in maps['material_photos']:
					maps['material_photos'][material_uuid] = []
				maps['material_photos'][material_uuid].append(photo_id)
	
	return maps


def main():
	"""Main entry point"""
	script_dir = Path(__file__).parent
	repo_root = script_dir.parent
	json_file = repo_root / "db-export.json"
	output_dir = repo_root / "data"
	
	if not json_file.exists():
		print(f"Error: {json_file} not found")
		sys.exit(1)
	
	print(f"Loading {json_file}...")
	with open(json_file, 'r') as f:
		data = json.load(f)

	# Load OpenPrintTag material tags for validation
	openprinttag_tags_file = repo_root / "openprinttag" / "data" / "material_tags.yaml"
	if not openprinttag_tags_file.exists():
		print(f"Error: OpenPrintTag material tags file not found at {openprinttag_tags_file}")
		sys.exit(1)

	print(f"Loading OpenPrintTag material tags from {openprinttag_tags_file}...")
	with open(openprinttag_tags_file, 'r') as f:
		openprinttag_tags = yaml.safe_load(f)

	valid_tag_names = set()
	if openprinttag_tags:
		for tag in openprinttag_tags:
			if tag.get('name'):
				valid_tag_names.add(tag['name'])
	print(f"  Loaded {len(valid_tag_names)} valid tag names from OpenPrintTag")

	# Load OpenPrintTag material types for validation
	openprinttag_types_file = repo_root / "openprinttag" / "data" / "material_types.yaml"
	if not openprinttag_types_file.exists():
		print(f"Error: OpenPrintTag material types file not found at {openprinttag_types_file}")
		sys.exit(1)

	print(f"Loading OpenPrintTag material types from {openprinttag_types_file}...")
	with open(openprinttag_types_file, 'r') as f:
		openprinttag_types = yaml.safe_load(f)

	valid_type_abbreviations = set()
	if openprinttag_types:
		for mt in openprinttag_types:
			if mt.get('abbreviation'):
				valid_type_abbreviations.add(mt['abbreviation'])
	print(f"  Loaded {len(valid_type_abbreviations)} valid type abbreviations from OpenPrintTag")

	# Load OpenPrintTag certifications for ID mapping
	openprinttag_certifications_file = repo_root / "openprinttag" / "data" / "material_certifications.yaml"
	if not openprinttag_certifications_file.exists():
		print(f"Error: OpenPrintTag material certifications file not found at {openprinttag_certifications_file}")
		sys.exit(1)

	print(f"Loading OpenPrintTag material certifications from {openprinttag_certifications_file}...")
	with open(openprinttag_certifications_file, 'r') as f:
		openprinttag_certifications = yaml.safe_load(f)

	# Create a set of valid certification names from OpenPrintTag
	valid_certification_names = set()
	# Also create a mapping from database cert names/slugs to OpenPrintTag names
	certification_name_mapping = {}
	if openprinttag_certifications:
		for cert in openprinttag_certifications:
			cert_name = cert.get('name')
			if cert_name:
				valid_certification_names.add(cert_name)
				# Map by name itself
				certification_name_mapping[cert_name] = cert_name
				# Also map by display_name (e.g., "UL 94 V0" -> "ul_94_v0")
				if cert.get('display_name'):
					certification_name_mapping[cert['display_name']] = cert_name
					# Also add slugified version of display_name
					slugified = slugify(cert['display_name'])
					certification_name_mapping[slugified] = cert_name
					# Also add version without separators (e.g., "ul-2904" -> "ul2904")
					# to handle cases like "UL2904" vs "UL 2904"
					no_separators = slugified.replace('-', '').replace('_', '')
					certification_name_mapping[no_separators] = cert_name

	# Manual mappings for certifications with naming mismatches
	# Maps database certification slugs/names to OpenPrintTag certification names
	manual_cert_mappings = {
		'ul94-v0': 'ul_94_v0',  # Database has "UL94 V0", OpenPrintTag has "ul_94_v0"
	}

	# Apply manual mappings
	for db_slug, opt_name in manual_cert_mappings.items():
		if opt_name in valid_certification_names:
			certification_name_mapping[db_slug] = opt_name

	print(f"  Loaded {len(openprinttag_certifications)} certifications from OpenPrintTag ({len(certification_name_mapping)} name mappings)")

	print("Building lookup maps...")
	# Create UUID maps for quick lookup
	brands_map = create_uuid_map(data.get('brands', []))
	materials_map = create_uuid_map(data.get('materials', []))
	material_types_map = create_uuid_map(data.get('material_types', []))
	tags_map = create_uuid_map(data.get('tags', []))
	# Certifications use 'id' instead of 'uuid'
	certifications_map = {}
	for cert in data.get('certifications', []):
		cert_id = cert.get('id')
		if cert_id:
			certifications_map[cert_id] = cert
	countries_map = create_uuid_map(data.get('countries', []))
	containers_map = create_uuid_map(data.get('material_container', []))
	fff_containers_map = create_uuid_map(data.get('fff_material_container', []))
	fff_packages_map = create_uuid_map(data.get('fff_material_package', []))
	tag_categories_map = {}
	if 'tag_categories' in data:
		for tc in data['tag_categories']:
			if tc.get('id'):
				tag_categories_map[tc['id']] = tc
	
	# Create ID maps for photos
	# material_photos table contains photo data directly
	photos_map = {}
	if 'material_photos' in data:
		for mp in data['material_photos']:
			photo_id = mp.get('id')
			if photo_id:
				photos_map[photo_id] = mp
	
	# Transform colors first so we have rgba values available
	colors_map = {}
	for color in data.get('colors', []):
		transformed_color = transform_color(color)
		if transformed_color and transformed_color.get('uuid'):
			colors_map[transformed_color['uuid']] = transformed_color
	
	# Build a map from materials_colors ID to color UUID
	# This is needed because material.secondary_colors contains IDs from materials_colors table
	material_colors_id_to_uuid_map = {}
	if 'materials_colors' in data:
		for mc in data['materials_colors']:
			mc_id = mc.get('id')
			color_uuid = mc.get('colors_uuid')
			if mc_id and color_uuid:
				material_colors_id_to_uuid_map[mc_id] = color_uuid
	
	# Create material properties maps
	material_properties_map = create_uuid_map(data.get('material_properties', []))
	fff_material_properties_map = create_uuid_map(data.get('fff_material_properties', []))
	
	# Build relationship maps
	relationship_maps = build_relationship_maps(data)
	
	print("Transforming data...")

	# Transform brands
	print("  Transforming brands...")
	brands_output = {}
	for brand in data.get('brands', []):
		transformed = transform_brand(brand, countries_map)
		if transformed and transformed.get('slug'):
			brands_output[transformed['slug']] = transformed

	# Transform materials
	print("  Transforming materials...")
	materials_output = {}  # brand_slug -> {material_slug -> material}
	tag_warnings = []  # Collect tag transformation and validation warnings
	certification_warnings = []  # Collect certification warnings
	type_warnings = []  # Collect type validation warnings
	for material in data.get('materials', []):
		transformed = transform_material(
			material,
			brands_map,
			material_types_map,
			tags_map,
			certifications_map,
			certification_name_mapping,
			colors_map,
			material_colors_id_to_uuid_map,
			photos_map,
			material_properties_map,
			fff_material_properties_map,
			relationship_maps['material_tags'],
			relationship_maps['material_certifications'],
			relationship_maps['material_photos'],
			valid_tag_names,
			valid_type_abbreviations,
			tag_warnings,
			certification_warnings,
			type_warnings,
		)
		if transformed and transformed.get('brand') and transformed.get('slug'):
			brand_slug = transformed['brand']['slug']
			if brand_slug not in materials_output:
				materials_output[brand_slug] = {}
			materials_output[brand_slug][transformed['slug']] = transformed
	
	# Transform material packages
	print("  Transforming material packages...")
	packages_output = {}  # brand_slug -> {package_slug -> package}
	warning_count = 0
	for package in data.get('material_package', []):
		# Validate package before transformation
		skip_reason = None
		entity_identifier = None
		material = None

		# Check material reference
		if not package.get('material_uuid'):
			skip_reason = "missing material reference"
		else:
			material = materials_map.get(package['material_uuid'])
			if not material:
				skip_reason = "invalid material reference"

		# Check brand reference
		if not skip_reason and material:
			if not material.get('brand'):
				skip_reason = "missing brand reference"
			else:
				brand = brands_map.get(material['brand'])
				if not brand:
					skip_reason = "invalid brand reference"

		# Check GTIN presence and validity
		if not skip_reason:
			gtin_value = package.get('gtin')
			if not gtin_value:
				skip_reason = "missing GTIN"
			else:
				try:
					if isinstance(gtin_value, str):
						int(gtin_value)
					elif not isinstance(gtin_value, int):
						skip_reason = "invalid GTIN value"
				except (ValueError, TypeError):
					skip_reason = "invalid GTIN value"

		# Check filament_diameter
		if not skip_reason:
			fff_package_uuid = package.get('fff_material_package')
			fff_package = fff_packages_map.get(fff_package_uuid) if fff_package_uuid else None
			if not fff_package:
				skip_reason = "missing fff_material_package reference"
			elif not fff_package.get('filament_diameter'):
				# Include the actual value for debugging
				actual_value = fff_package.get('filament_diameter', 'not present')
				skip_reason = f"missing filament_diameter field (value: {actual_value})"

		# If validation failed, log and skip
		if skip_reason:
			warning_count += 1

			# Build entity identifier for logging (include both name and UUID)
			package_uuid = package.get('uuid', 'unknown')
			if material:
				material_name = material.get('name', '')
				weight = package.get('nominal_netto_full_weight', '1kg')
				entity_identifier = f"{material_name} {weight} [{package_uuid}]"
			else:
				entity_identifier = f"[{package_uuid}]"

			print(f"    ⚠ Material Package {entity_identifier} was omitted from the import. Reason: {skip_reason}")
			continue

		# Validation passed - transform and add to output
		transformed, brand_slug, warning = transform_material_package(
			package,
			brands_map,
			materials_map,
			containers_map,
			fff_packages_map,
		)

		# Check if transform returned a warning
		if warning:
			warning_count += 1
			print(f"    ⚠ {warning}")
			continue

		if transformed and brand_slug and transformed.get('slug'):
			# Use the brand_slug returned from transform for directory organization
			if brand_slug not in packages_output:
				packages_output[brand_slug] = {}
			packages_output[brand_slug][transformed['slug']] = transformed
	
	# Transform material containers
	print("  Transforming material containers...")
	containers_output = {}
	for container in data.get('material_container', []):
		transformed = transform_material_container(
			container,
			brands_map,
			fff_containers_map,
		)
		if transformed and transformed.get('slug'):
			containers_output[transformed['slug']] = transformed
	
	print("Writing YAML files...")
	
	# Write brands
	brands_dir = output_dir / "brands"
	brands_dir.mkdir(parents=True, exist_ok=True)
	for slug, brand in brands_output.items():
		file_path = brands_dir / f"{slug}.yaml"
		with open(file_path, 'w') as f:
			yaml.dump(brand, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	# Write materials
	materials_dir = output_dir / "materials"
	materials_dir.mkdir(parents=True, exist_ok=True)
	for brand_slug, materials in materials_output.items():
		brand_dir = materials_dir / brand_slug
		brand_dir.mkdir(parents=True, exist_ok=True)
		for material_slug, material in materials.items():
			file_path = brand_dir / f"{material_slug}.yaml"
			with open(file_path, 'w') as f:
				yaml.dump(material, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	# Write material packages
	packages_dir = output_dir / "material-packages"
	packages_dir.mkdir(parents=True, exist_ok=True)
	for brand_slug, packages in packages_output.items():
		brand_dir = packages_dir / brand_slug
		brand_dir.mkdir(parents=True, exist_ok=True)
		for package_slug, package in packages.items():
			file_path = brand_dir / f"{package_slug}.yaml"
			with open(file_path, 'w') as f:
				yaml.dump(package, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	# Write material containers
	containers_dir = output_dir / "material-containers"
	containers_dir.mkdir(parents=True, exist_ok=True)
	for slug, container in containers_output.items():
		file_path = containers_dir / f"{slug}.yaml"
		with open(file_path, 'w') as f:
			yaml.dump(container, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

	print(f"\n✓ Transformation complete! Output: {output_dir}")
	print(f"  - Brands: {len(brands_output)}")
	print(f"  - Materials: {sum(len(m) for m in materials_output.values())}")
	print(f"  - Material Packages: {sum(len(p) for p in packages_output.values())}")
	print(f"  - Material Containers: {len(containers_output)}")

	# Print tag warnings
	if tag_warnings:
		print(f"\n⚠ Tag transformation and validation warnings ({len(tag_warnings)} total):")
		for warning in tag_warnings:
			print(f"    ⚠ {warning}")

	# Print certification warnings
	if certification_warnings:
		print(f"\n⚠ Certification warnings ({len(certification_warnings)} total):")
		for warning in certification_warnings:
			print(f"    ⚠ {warning}")

	# Print type validation warnings
	if type_warnings:
		print(f"\n⚠ Type validation warnings ({len(type_warnings)} total):")
		for warning in type_warnings:
			print(f"    ⚠ {warning}")

	if warning_count > 0:
		print(f"\n⚠ Total package warnings: {warning_count}")


if __name__ == '__main__':
	main()
