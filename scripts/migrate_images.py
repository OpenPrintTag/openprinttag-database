#!/usr/bin/env python3
"""
Migration script for downloading material images from YAML files.

This script:
1. Scans all material YAML files in data/materials/
2. Extracts image URLs from the 'photos' field
3. Downloads images and saves them to tmp/assets/BRAND_SLUG/MATERIAL_SLUG/IMG_NAME
4. Uploads images to Google Cloud Storage
5. Updates YAML files with new public URLs

Environment variables required:
- GOOGLE_APPLICATION_CREDENTIALS: Path to GCS service account JSON
Or standard GCS authentication via gcloud
"""

import argparse
import os
import subprocess
import sys
import yaml
import requests
from pathlib import Path
from google.cloud import storage


class MaterialImageMigration:
    # Google Cloud Storage configuration
    GCS_BUCKET_NAME = "prusa3d-openprinttag-prod-3e31-material-db"
    PUBLIC_URL_BASE = "https://files.openprinttag.org"

    def __init__(
        self,
        materials_dir: str = "data/materials",
        output_dir: str = "tmp/assets",
        dry_run: bool = True,
    ):
        self.materials_dir = Path(materials_dir)
        self.data_dir = self.materials_dir.parent
        self.output_dir = Path(output_dir)
        self.dry_run = dry_run
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
        self.missing_files: list[str] = []

        if dry_run:
            self.storage_client = None
            self.bucket = None
            return

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

    def run(self, files: list[Path] | None = None):
        """Main execution method.

        Args:
            files: Optional list of specific YAML files to process.
                   When None, all files in materials_dir are scanned.
        """
        if self.dry_run:
            print("DRY RUN – no files will be downloaded, uploaded, or modified.")
        print("Starting material image migration...")
        print(f"Materials directory: {self.materials_dir}")
        print(f"Output directory: {self.output_dir}")
        print("-" * 60)

        if not self.materials_dir.exists():
            print(f"ERROR: Materials directory does not exist: {self.materials_dir}")
            sys.exit(1)

        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        if files is not None:
            # Process only the given files
            if not files:
                print("No material files to process.")
                return
            for material_file in sorted(files):
                brand_slug = material_file.parent.name
                self._process_material(brand_slug, material_file)
        else:
            # Process all brand directories
            for brand_dir in sorted(self.materials_dir.iterdir()):
                if not brand_dir.is_dir():
                    continue
                brand_slug = brand_dir.name
                self._process_brand(brand_slug, brand_dir)

        self._print_summary()

        if self.dry_run and self.missing_files:
            print("\nMISSING FILES – the following sources were not found:")
            for path in self.missing_files:
                print(f"  ✗  {path}")
            print(f"\n{len(self.missing_files)} missing file(s). Fix the issues above before running the actual migration.")
            sys.exit(1)

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
            if urls_changed and not self.dry_run:
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
            # Detect whether this is a local file path or a remote URL
            is_local = not url.startswith(("http://", "https://"))

            # Extract filename from path/URL
            filename = os.path.basename(url)
            if not filename:
                filename = f"image_{index}.jpg"

            output_path = self.data_dir / url.lstrip("/") if is_local else output_dir / filename

            # Check if already uploaded to new location
            new_url = f"{self.PUBLIC_URL_BASE}/{brand_slug}/{material_slug}/{filename}"
            if url == new_url:
                print(f"    ✓  Already migrated: {filename}")
                return url

            if self.dry_run:
                if is_local:
                    if output_path.exists():
                        print(f"    📁 Would upload (local): {output_path} → {new_url}")
                        self.stats["skipped"] += 1
                    else:
                        print(f"    ✗  Local file not found: {output_path}")
                        self.stats["failed"] += 1
                        self.missing_files.append(str(output_path))
                else:
                    # HEAD request to verify remote file exists
                    try:
                        response = requests.head(url, timeout=10, allow_redirects=True)
                        if response.ok:
                            print(f"    ✓  Exists (remote): {filename} → would upload to {new_url}")
                            self.stats["skipped"] += 1
                        else:
                            print(f"    ✗  Remote file not found (HTTP {response.status_code}): {url}")
                            self.stats["failed"] += 1
                            self.missing_files.append(url)
                    except requests.exceptions.RequestException as e:
                        print(f"    ✗  Cannot reach remote file: {url}: {e}")
                        self.stats["failed"] += 1
                        self.missing_files.append(url)
                return None

            if is_local:
                # Local path – skip download, upload directly
                if not output_path.exists():
                    print(f"    ✗  Local file not found: {output_path}")
                    self.stats["failed"] += 1
                    return None
                self.stats["skipped"] += 1
            else:
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


def _get_changed_files(base_ref: str, materials_dir: Path) -> list[Path]:
    """Return list of changed YAML files in materials_dir since base_ref."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=ACMR", f"{base_ref}...HEAD",
             "--", str(materials_dir)],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"ERROR: git diff failed: {e.stderr.strip()}")
        sys.exit(1)

    paths = [
        Path(line)
        for line in result.stdout.splitlines()
        if line.endswith(".yaml")
    ]
    return paths


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(description="Migrate material images to GCS.")
    parser.add_argument(
        "--dry-run",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="List files that would be uploaded without making any changes (default: on).",
    )
    parser.add_argument(
        "--base-ref",
        metavar="REF",
        help="Git ref to diff against (e.g. origin/main or HEAD~1). "
             "Only changed YAML files in data/materials/ will be processed.",
    )
    parser.add_argument(
        "--files",
        nargs="+",
        metavar="FILE",
        help="Explicit list of YAML files to process (used when --base-ref is not set).",
    )
    parser.add_argument(
        "--materials-dir",
        default="data/materials",
        metavar="DIR",
        help="Path to materials directory (default: data/materials).",
    )
    args = parser.parse_args()

    migration = MaterialImageMigration(
        materials_dir=args.materials_dir,
        dry_run=args.dry_run,
    )

    files: list[Path] | None = None

    if args.base_ref:
        files = _get_changed_files(args.base_ref, migration.materials_dir)
        if not files:
            print(f"No changed material files found against {args.base_ref}. Nothing to do.")
            return
        print(f"Changed files ({len(files)}) against {args.base_ref}:")
        for f in files:
            print(f"  {f}")
        print()
    elif args.files:
        files = [Path(f) for f in args.files]

    migration.run(files=files)


if __name__ == "__main__":
    main()
