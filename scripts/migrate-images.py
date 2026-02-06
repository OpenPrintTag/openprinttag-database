#!/usr/bin/env python3
"""
Migration script for downloading material images from YAML files.

This script:
1. Scans all material YAML files in data/materials/
2. Extracts image URLs from the 'photos' field
3. Downloads images and saves them to assets/tmp/BRAND_SLUG/MATERIAL_SLUG/IMG_NAME
4. Uploads images to Google Cloud Storage
5. Updates YAML files with new public URLs

Environment variables required:
- GOOGLE_APPLICATION_CREDENTIALS: Path to GCS service account JSON
Or standard GCS authentication via gcloud
"""

import os
import sys
import yaml
import requests
from pathlib import Path
from urllib.parse import urlparse
from google.cloud import storage


class MaterialImageMigration:
    # Google Cloud Storage configuration
    GCS_BUCKET_NAME = "prusa3d-openprinttag-prod-3e31-material-db"
    PUBLIC_URL_BASE = "https://files.openprinttag.org"

    def __init__(
        self, materials_dir: str = "data/materials", output_dir: str = "assets/tmp"
    ):
        self.materials_dir = Path(materials_dir)
        self.output_dir = Path(output_dir)
        self.stats = {
            "total_materials": 0,
            "materials_with_photos": 0,
            "total_photos": 0,
            "downloaded": 0,
            "skipped": 0,
            "failed": 0,
            "uploaded": 0,
            "upload_failed": 0,
            "yaml_updated": 0,
            "yaml_update_failed": 0,
        }

        # Initialize GCS client
        try:
            self.storage_client = storage.Client()
            self.bucket = self.storage_client.bucket(self.GCS_BUCKET_NAME)
            print(f"✓ Connected to GCS bucket: {self.GCS_BUCKET_NAME}")
        except Exception as e:
            print(f"ERROR: Failed to initialize Google Cloud Storage client: {e}")
            print(
                "Make sure GOOGLE_APPLICATION_CREDENTIALS is set or you're authenticated via gcloud"
            )
            sys.exit(1)

    def run(self):
        """Main execution method."""
        print("Starting material image migration...")
        print(f"Materials directory: {self.materials_dir}")
        print(f"Output directory: {self.output_dir}")
        print("-" * 60)

        if not self.materials_dir.exists():
            print(f"ERROR: Materials directory does not exist: {self.materials_dir}")
            sys.exit(1)

        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Process all brand directories
        for brand_dir in sorted(self.materials_dir.iterdir()):
            if not brand_dir.is_dir():
                continue

            brand_slug = brand_dir.name
            self._process_brand(brand_slug, brand_dir)

        self._print_summary()

    def _process_brand(self, brand_slug: str, brand_dir: Path):
        """Process all materials for a given brand."""
        print(f"\nProcessing brand: {brand_slug}")

        for material_file in sorted(brand_dir.glob("*.yaml")):
            self._process_material(brand_slug, material_file)

    def _process_material(self, brand_slug: str, material_file: Path):
        """Process a single material YAML file."""
        self.stats["total_materials"] += 1

        try:
            with open(material_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)

            if not data:
                return

            material_slug = data.get("slug")
            if not material_slug:
                print(f"  WARNING: No slug found in {material_file}")
                return

            photos = data.get("photos", [])
            if not photos:
                return

            # Check if all URLs are already migrated
            all_migrated = True
            for photo in photos:
                if isinstance(photo, dict):
                    url = photo.get("url", "")
                else:
                    url = photo or ""

                if not url.startswith(self.PUBLIC_URL_BASE):
                    all_migrated = False
                    break

            if all_migrated:
                print(f"  ⏭  Material already migrated: {material_slug}")
                return

            self.stats["materials_with_photos"] += 1
            print(f"  Material: {material_slug} ({len(photos)} photo(s))")

            # Create material directory
            material_output_dir = self.output_dir / brand_slug / material_slug
            material_output_dir.mkdir(parents=True, exist_ok=True)

            # Track if any URLs changed
            urls_changed = False

            # Download, upload, and update each photo
            for idx, photo in enumerate(photos):
                if isinstance(photo, dict):
                    old_url = photo.get("url")
                else:
                    old_url = photo

                if old_url:
                    new_url = self._process_image(
                        old_url, brand_slug, material_slug, material_output_dir, idx
                    )
                    if new_url and new_url != old_url:
                        # Update URL in data structure
                        if isinstance(photo, dict):
                            photo["url"] = new_url
                        else:
                            photos[idx] = new_url
                        urls_changed = True

            # Write back updated YAML if any URLs changed
            if urls_changed:
                self._update_yaml_file(material_file, data)

        except Exception as e:
            print(f"  ERROR processing {material_file}: {e}")
            self.stats["failed"] += 1

    def _process_image(
        self,
        url: str,
        brand_slug: str,
        material_slug: str,
        output_dir: Path,
        index: int,
    ) -> str | None:
        """Download, upload to GCS, and return new public URL."""
        self.stats["total_photos"] += 1

        try:
            # Extract filename from URL
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)

            if not filename:
                filename = f"image_{index}.jpg"

            output_path = output_dir / filename

            # Check if already uploaded to new location
            new_url = f"{self.PUBLIC_URL_BASE}/{brand_slug}/{material_slug}/{filename}"
            if url == new_url:
                print(f"    ✓  Already migrated: {filename}")
                return url

            # Download if not exists locally
            if not output_path.exists():
                print(f"    ⬇  Downloading: {filename}")
                response = requests.get(url, timeout=30, stream=True)
                response.raise_for_status()

                # Save to file and count bytes
                total_bytes = 0
                with open(output_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        total_bytes += len(chunk)

                print(f"    ✓  Downloaded: {filename} ({total_bytes} bytes)")
                self.stats["downloaded"] += 1
            else:
                self.stats["skipped"] += 1

            # Upload to Google Cloud Storage
            gcs_path = f"{brand_slug}/{material_slug}/{filename}"
            blob = self.bucket.blob(gcs_path)

            # Check if already exists in GCS
            if blob.exists():
                print(f"    ⏭  Already in GCS: {gcs_path}")
                return new_url

            print(f"    ⬆  Uploading to GCS: {gcs_path}")
            blob.upload_from_filename(str(output_path))

            # Make blob publicly accessible
            blob.make_public()

            print(f"    ✓  Uploaded to GCS: {new_url}")
            self.stats["uploaded"] += 1

            return new_url

        except requests.exceptions.RequestException as e:
            print(f"    ✗  Failed to download {url}: {e}")
            self.stats["failed"] += 1
            return None
        except Exception as e:
            print(f"    ✗  Error processing {url}: {e}")
            self.stats["upload_failed"] += 1
            return None

    def _update_yaml_file(self, yaml_file: Path, data: dict):
        """Update YAML file with new data."""
        try:
            with open(yaml_file, "w", encoding="utf-8") as f:
                yaml.dump(
                    data,
                    f,
                    allow_unicode=True,
                    sort_keys=False,
                    default_flow_style=False,
                )

            print(f"    ✓  Updated YAML: {yaml_file.name}")
            self.stats["yaml_updated"] += 1

        except Exception as e:
            print(f"    ✗  Failed to update YAML {yaml_file}: {e}")
            self.stats["yaml_update_failed"] += 1

    def _print_summary(self):
        """Print migration summary."""
        print("\n" + "=" * 60)
        print("MIGRATION SUMMARY")
        print("=" * 60)
        print(f"Total materials scanned:      {self.stats['total_materials']}")
        print(f"Materials with photos:        {self.stats['materials_with_photos']}")
        print(f"Total photos found:           {self.stats['total_photos']}")
        print(f"Successfully downloaded:      {self.stats['downloaded']}")
        print(f"Skipped (already local):      {self.stats['skipped']}")
        print(f"Download failed:              {self.stats['failed']}")
        print(f"Uploaded to GCS:              {self.stats['uploaded']}")
        print(f"Upload failed:                {self.stats['upload_failed']}")
        print(f"YAML files updated:           {self.stats['yaml_updated']}")
        print(f"YAML update failed:           {self.stats['yaml_update_failed']}")
        print("=" * 60)


def main():
    """Entry point."""
    migration = MaterialImageMigration()
    migration.run()


if __name__ == "__main__":
    main()
