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
    4. Resolve UUID references to slugs
    5. Assign sequential IDs to material_types and tags
    6. Write YAML files to data/ directory structure

Output structure:
    data/
    ├── brands/
    ├── materials/{brand-slug}/
    ├── material-packages/{brand-slug}/
    ├── material-containers/
    └── lookup-tables/
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml


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
	result = {
		'uuid': brand.get('uuid'),
		'slug': slugify(brand.get('name', '')),
		'name': brand.get('name', ''),
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
	
	# Countries
	if brand.get('country_uuid'):
		country = countries_map.get(brand['country_uuid'])
		if country and country.get('code'):
			result['countries'] = [country['code']]
	
	return result


def transform_material_type(mt: Dict, type_id: int) -> Dict[str, Any]:
	"""Transform a material type from JSON to YAML format"""
	result = {
		'id': type_id,
		'class': mt.get('class', 'FFF'),
		'abbreviation': mt.get('abbreviation') or '',
		'name': mt.get('name', ''),
	}
	
	if mt.get('description'):
		result['description'] = mt['description']
	
	# default_properties must be an object (dict), not a UUID string
	default_props = mt.get('default_properties')
	if default_props and isinstance(default_props, dict):
		result['default_properties'] = default_props
	# If it's a UUID string or other non-object type, omit it (it's optional)
	
	return result


def transform_tag(tag: Dict, tag_id: int, tag_categories_map: Dict[int, Any], tag_categories_tags_map: Dict[str, List[str]]) -> Dict[str, Any]:
	"""Transform a tag from JSON to YAML format"""
	result = {
		'id': tag_id,
		'slug': slugify(tag.get('name', '')),
		'name': tag.get('name', ''),
	}
	
	# Category - check both direct categories field and tag_categories_tags table
	tag_uuid = tag.get('uuid')
	category_name = None
	
	# First check direct categories field
	if tag.get('categories'):
		category_id = tag['categories'][0] if isinstance(tag['categories'], list) else tag['categories']
		category = tag_categories_map.get(category_id)
		if category and category.get('name'):
			category_name = category['name']
	
	# Also check tag_categories_tags table
	# Note: This requires tag_categories_uuid_map which should be passed or built globally
	# For now, we rely on the direct categories field above
	
	if category_name:
		result['category'] = category_name
	
	if tag.get('description'):
		result['description'] = tag['description']
	
	# Implies and hints (resolve to slugs)
	if tag.get('implies'):
		result['implies'] = [slugify(t.get('name', '')) if isinstance(t, dict) else slugify(str(t)) for t in tag['implies']]
	if tag.get('hints'):
		result['hints'] = [slugify(t.get('name', '')) if isinstance(t, dict) else slugify(str(t)) for t in tag['hints']]
	
	return result


def transform_certification(cert: Dict) -> Dict[str, Any]:
	"""Transform a certification from JSON to YAML format"""
	result = {
		'id': cert.get('id'),
		'slug': slugify(cert.get('name', '')),
		'name': cert.get('name', ''),
	}
	
	if cert.get('display_name'):
		result['display_name'] = cert['display_name']
	if cert.get('description'):
		result['description'] = cert['description']
	
	return result


def transform_country(country: Dict) -> Dict[str, Any]:
	"""Transform a country from JSON to YAML format"""
	return {
		'code': country.get('code', ''),
		'name': country.get('name', ''),
	}


def transform_palette_color(color: Dict) -> Dict[str, Any]:
	"""Transform a palette color from JSON to YAML format"""
	result = {
		'uuid': color.get('uuid'),
		'palette': color.get('palette', 'pantone').lower(),
		'canonical_name': color.get('canonical_name', ''),
	}
	
	if color.get('display_name'):
		result['display_name'] = color['display_name']
	if color.get('rgba'):
		result['rgba'] = color['rgba']
	
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
		result['rgba'] = rgba_hex
	
	return result


def transform_material(
	material: Dict,
	brands_map: Dict[str, Any],
	material_types_map: Dict[str, Any],
	material_types_uuid_to_id: Dict[str, int],  # UUID -> ID mapping
	tags_map: Dict[str, Any],
	certifications_map: Dict[str, Any],
	colors_map: Dict[str, Any],
	photos_map: Dict[str, Any],
	material_properties_map: Dict[str, Any],  # properties_uuid -> properties object
	fff_material_properties_map: Dict[str, Any],  # fff_properties_uuid -> fff properties
	material_tags_map: Dict[str, List[str]],  # material_uuid -> list of tag UUIDs
	material_certifications_map: Dict[str, List[str]],  # material_uuid -> list of cert UUIDs
	material_colors_map: Dict[str, List[str]],  # material_uuid -> list of color UUIDs
	material_photos_map: Dict[str, List[int]],  # material_uuid -> list of photo IDs
) -> Optional[Dict[str, Any]]:
	"""Transform a material from JSON to YAML format"""
	brand = resolve_uuid_reference(material.get('brand'), brands_map)
	if not brand:
		return None
	
	brand_slug = slugify(brand.get('name', ''))
	material_name = material.get('name', '')
	
	result = {
		'uuid': material.get('uuid'),
		'slug': slugify(material_name),
		'brand_slug': brand_slug,
		'name': material_name,
		'class': material.get('class', 'FFF'),
	}
	
	if material.get('brand_specific_id'):
		result['brand_specific_id'] = material['brand_specific_id']
	
	# Type - check both direct type field and material_material_types table
	type_id = None
	abbreviation = ''
	
	# First try to use material's own abbreviation if available
	if material.get('abbreviation'):
		abbreviation = material['abbreviation']
	
	# If not available, try to get from material type
	if not abbreviation and material.get('type'):
		mt_uuid = material['type']
		mt = resolve_uuid_reference(mt_uuid, material_types_map)
		if mt:
			# Look up ID from the uuid_to_id map
			type_id = material_types_uuid_to_id.get(mt_uuid)
			if type_id:
				result['type_id'] = type_id
				abbreviation = mt.get('abbreviation') or ''
	
	# Always set abbreviation (required field) - use empty string if not found
	result['abbreviation'] = abbreviation
	
	# URL
	if material.get('url'):
		result['url'] = material['url']
	
	# Colors
	if material.get('primary_color'):
		primary_color = resolve_uuid_reference(material['primary_color'], colors_map)
		if primary_color and primary_color.get('rgba'):
			result['primary_color'] = {'rgba': primary_color['rgba']}
	
	secondary_colors = []
	if material.get('secondary_colors'):
		for color_uuid in material['secondary_colors']:
			color = resolve_uuid_reference(color_uuid, colors_map)
			if color and color.get('rgba'):
				secondary_colors.append({'rgba': color['rgba']})
	if secondary_colors:
		result['secondary_colors'] = secondary_colors
	
	# Material colors - from materials_colors relationship table
	material_uuid = material.get('uuid')
	
	# Colors lookup table references (by UUID)
	material_colors_uuids = []
	# Palette colors (for palette_color_alikes)
	palette_colors = []
	
	if material_uuid and material_uuid in material_colors_map:
		for color_uuid in material_colors_map[material_uuid]:
			color = colors_map.get(color_uuid)
			if color:
				# Add to colors array (reference by UUID from colors lookup table)
				if color.get('uuid'):
					material_colors_uuids.append(color['uuid'])
				# Also check for palette color reference
				if color.get('palette_color_uuid'):
					palette_colors.append(color['palette_color_uuid'])
	
	if material_colors_uuids:
		result['colors'] = material_colors_uuids
	if palette_colors:
		result['palette_color_alikes'] = palette_colors
	
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
	tags = []
	if material_uuid and material_uuid in material_tags_map:
		for tag_uuid in material_tags_map[material_uuid]:
			tag = resolve_uuid_reference(tag_uuid, tags_map)
			if tag:
				tag_slug = slugify(tag.get('name', ''))
				if tag_slug:
					tags.append(tag_slug)
	
	# Also check if material has direct tags field (fallback)
	if not tags and material.get('tags'):
		for tag_ref in material['tags']:
			if isinstance(tag_ref, str):
				# It's a UUID, resolve it
				tag = resolve_uuid_reference(tag_ref, tags_map)
				if tag:
					tag_slug = slugify(tag.get('name', ''))
					if tag_slug:
						tags.append(tag_slug)
			elif isinstance(tag_ref, dict):
				# It's already a tag object
				tag_slug = slugify(tag_ref.get('name', ''))
				if tag_slug:
					tags.append(tag_slug)
	
	if tags:
		result['tags'] = tags
	
	# Certifications
	certifications = []
	if material_uuid and material_uuid in material_certifications_map:
		for cert_uuid in material_certifications_map[material_uuid]:
			cert = resolve_uuid_reference(cert_uuid, certifications_map)
			if cert:
				cert_slug = slugify(cert.get('name', ''))
				if cert_slug:
					certifications.append(cert_slug)
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
) -> Optional[Dict[str, Any]]:
	"""Transform a material package from JSON to YAML format"""
	brand = None
	material = None
	
	# Get brand from material
	if package.get('material_uuid'):
		material = materials_map.get(package['material_uuid'])
		if material and material.get('brand'):
			brand = brands_map.get(material['brand'])
	
	if not brand or not material:
		return None
	
	brand_slug = slugify(brand.get('name', ''))
	material_slug = slugify(material.get('name', ''))
	
	# Get FFF package details
	fff_package = None
	if package.get('fff_material_package'):
		fff_package_uuid = package['fff_material_package']
		fff_package = fff_packages_map.get(fff_package_uuid)
	
	result = {
		'uuid': package.get('uuid'),
		'slug': slugify(f"{material_slug}-{package.get('nominal_netto_full_weight', '1kg')}-spool"),
		'class': material.get('class', 'FFF'),
		'brand_slug': brand_slug,
		'material_slug': material_slug,
		'nominal_netto_full_weight': package.get('nominal_netto_full_weight', 1000),
	}
	
	if package.get('brand_specific_id'):
		result['brand_specific_id'] = package['brand_specific_id']
	if package.get('gtin'):
		result['gtin'] = str(package['gtin'])
	if package.get('url'):
		result['url'] = package['url']
	
	# Container
	if package.get('container'):
		container = containers_map.get(package['container'])
		if container:
			container_slug = slugify(container.get('name', ''))
			if container_slug:
				result['container_slug'] = container_slug
	
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
	
	return result


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
		result['brand_slug'] = slugify(brand.get('name', ''))
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
		'material_certifications': {},  # material_uuid -> [cert_uuids]
		'material_colors': {},  # material_uuid -> [color_ids]
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
				# Find certification by ID
				cert_uuid = None
				for cert in data.get('certifications', []):
					if cert.get('id') == cert_id:
						cert_uuid = cert.get('uuid')
						break
				if cert_uuid:
					if material_uuid not in maps['material_certifications']:
						maps['material_certifications'][material_uuid] = []
					maps['material_certifications'][material_uuid].append(cert_uuid)
	
	# Material colors
	if 'materials_colors' in data:
		for mc in data['materials_colors']:
			material_uuid = mc.get('materials_uuid')
			color_uuid = mc.get('colors_uuid')
			if material_uuid and color_uuid:
				if material_uuid not in maps['material_colors']:
					maps['material_colors'][material_uuid] = []
				maps['material_colors'][material_uuid].append(color_uuid)
	
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
	
	print("Building lookup maps...")
	# Create UUID maps for quick lookup
	brands_map = create_uuid_map(data.get('brands', []))
	materials_map = create_uuid_map(data.get('materials', []))
	material_types_map = create_uuid_map(data.get('material_types', []))
	tags_map = create_uuid_map(data.get('tags', []))
	certifications_map = create_uuid_map(data.get('certifications', []))
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
	
	colors_map = create_uuid_map(data.get('colors', []))
	
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
	
	# Transform lookup tables
	print("  Transforming lookup tables...")
	
	# Material types - assign sequential IDs
	material_types_output = []
	material_types_uuid_to_id = {}  # Map UUID to assigned ID
	type_id_counter = 1
	for mt in data.get('material_types', []):
		mt_uuid = mt.get('uuid')
		if mt_uuid:
			material_types_uuid_to_id[mt_uuid] = type_id_counter
			transformed = transform_material_type(mt, type_id_counter)
			if transformed:
				material_types_output.append(transformed)
				type_id_counter += 1
	material_types_output.sort(key=lambda x: x.get('id', 0))
	
	# Tags - assign sequential IDs and build tag_categories_tags map
	tags_output = []
	tag_id_counter = 1
	tag_categories_tags_map = {}  # tag_uuid -> [category_uuids]
	
	# Build tag categories map by UUID for lookup (used in transform_tag)
	tag_categories_uuid_map = {}
	if 'tag_categories' in data:
		for tc in data['tag_categories']:
			if tc.get('uuid'):
				tag_categories_uuid_map[tc['uuid']] = tc
	
	# Build tag_categories_tags relationship map
	if 'tag_categories_tags' in data:
		for tct in data['tag_categories_tags']:
			tag_uuid = tct.get('tags_uuid') or tct.get('tag_uuid')
			category_uuid = tct.get('tag_categories_uuid') or tct.get('tag_category_uuid')
			if tag_uuid and category_uuid:
				if tag_uuid not in tag_categories_tags_map:
					tag_categories_tags_map[tag_uuid] = []
				tag_categories_tags_map[tag_uuid].append(category_uuid)
	
	# Transform tags
	for tag in data.get('tags', []):
		transformed = transform_tag(tag, tag_id_counter, tag_categories_map, tag_categories_tags_map)
		if transformed:
			tags_output.append(transformed)
			tag_id_counter += 1
	tags_output.sort(key=lambda x: x.get('id', 0) or 0)
	
	# Certifications
	certifications_output = []
	for cert in data.get('certifications', []):
		transformed = transform_certification(cert)
		if transformed:
			certifications_output.append(transformed)
	certifications_output.sort(key=lambda x: x.get('id', 0) or 0)
	
	# Countries
	countries_output = []
	for country in data.get('countries', []):
		transformed = transform_country(country)
		if transformed:
			countries_output.append(transformed)
	countries_output.sort(key=lambda x: x.get('code', ''))
	
	# Palette colors
	palette_colors_output = []
	if 'ral_colors' in data:
		for color in data['ral_colors']:
			transformed = transform_palette_color(color)
			if transformed:
				palette_colors_output.append(transformed)
	
	# Colors
	colors_output = []
	if 'colors' in data:
		for color in data['colors']:
			transformed = transform_color(color)
			if transformed and transformed.get('uuid') and transformed.get('name') and transformed.get('rgba'):
				colors_output.append(transformed)
	colors_output.sort(key=lambda x: x.get('name', ''))
	
	# Transform materials
	print("  Transforming materials...")
	materials_output = {}  # brand_slug -> {material_slug -> material}
	for material in data.get('materials', []):
		transformed = transform_material(
			material,
			brands_map,
			material_types_map,
			material_types_uuid_to_id,
			tags_map,
			certifications_map,
			colors_map,
			photos_map,
			material_properties_map,
			fff_material_properties_map,
			relationship_maps['material_tags'],
			relationship_maps['material_certifications'],
			relationship_maps['material_colors'],
			relationship_maps['material_photos'],
		)
		if transformed and transformed.get('brand_slug') and transformed.get('slug'):
			brand_slug = transformed['brand_slug']
			if brand_slug not in materials_output:
				materials_output[brand_slug] = {}
			materials_output[brand_slug][transformed['slug']] = transformed
	
	# Transform material packages
	print("  Transforming material packages...")
	packages_output = {}  # brand_slug -> {package_slug -> package}
	for package in data.get('material_package', []):
		# Skip packages without GTIN
		if not package.get('gtin'):
			continue

		transformed = transform_material_package(
			package,
			brands_map,
			materials_map,
			containers_map,
			fff_packages_map,
		)
		if transformed and transformed.get('brand_slug') and transformed.get('slug'):
			brand_slug = transformed['brand_slug']
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
	
	# Write lookup tables
	lookup_dir = output_dir / "lookup-tables"
	lookup_dir.mkdir(parents=True, exist_ok=True)
	
	with open(lookup_dir / "material-types.yaml", 'w') as f:
		yaml.dump({'types': material_types_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	with open(lookup_dir / "material-tags.yaml", 'w') as f:
		yaml.dump({'tags': tags_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	with open(lookup_dir / "material-certifications.yaml", 'w') as f:
		yaml.dump({'certifications': certifications_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	with open(lookup_dir / "countries.yaml", 'w') as f:
		yaml.dump({'countries': countries_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	if palette_colors_output:
		with open(lookup_dir / "palette-colors.yaml", 'w') as f:
			yaml.dump({'colors': palette_colors_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
	if colors_output:
		with open(lookup_dir / "colors.yaml", 'w') as f:
			yaml.dump({'colors': colors_output}, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
	
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
	print(f"  - Material Types: {len(material_types_output)}")
	print(f"  - Tags: {len(tags_output)}")
	print(f"  - Material-Tag Relationships: {sum(len(tags) for tags in relationship_maps['material_tags'].values())}")
	print(f"  - Certifications: {len(certifications_output)}")
	print(f"  - Countries: {len(countries_output)}")
	print(f"  - Colors: {len(colors_output)}")


if __name__ == '__main__':
	main()
