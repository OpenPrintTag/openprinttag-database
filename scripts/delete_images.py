#!/usr/bin/env python3
"""
Script for deleting orphaned material images from Google Cloud Storage.

This script:
1. Detects YAML files that were deleted or modified (via git diff)
2. Compares old and new versions to find GCS-hosted photo URLs that were removed
3. In dry-run mode: shows which GCS files would be deleted
4. In actual run: deletes orphaned files from GCS

Environment variables required:
- GOOGLE_APPLICATION_CREDENTIALS: Path to GCS service account JSON
Or standard GCS authentication via gcloud
"""

import argparse
import subprocess
import sys
import yaml
from pathlib import Path
from google.cloud import storage


class MaterialImageDeletion:
    # Google Cloud Storage configuration
    GCS_BUCKET_NAME = "prusa3d-openprinttag-prod-3e31-material-db"
    PUBLIC_URL_BASE = "https://files.openprinttag.org"

    def __init__(
        self,
        materials_dir: str = "data/materials",
        dry_run: bool = True,
    ):
        self.materials_dir = Path(materials_dir)
        self.dry_run = dry_run
        self.stats = {
            "files_checked": 0,
            "urls_to_delete": 0,
            "deleted": 0,
            "delete_failed": 0,
            "not_found": 0,
        }

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

    def _extract_gcs_urls(self, data: dict | None) -> set[str]:
        """Extract all GCS-hosted photo URLs from YAML data."""
        urls: set[str] = set()
        if not data:
            return urls
        for photo in data.get("photos", []):
            if isinstance(photo, dict):
                url = photo.get("url", "")
            else:
                url = photo or ""
            if url.startswith(self.PUBLIC_URL_BASE):
                urls.add(url)
        return urls

    def _url_to_gcs_path(self, url: str) -> str:
        """Convert public URL to GCS blob path."""
        return url[len(self.PUBLIC_URL_BASE):].lstrip("/")

    def _get_old_yaml_content(self, file_path: str, base_ref: str) -> dict | None:
        """Get the YAML content of a file at base_ref."""
        try:
            result = subprocess.run(
                ["git", "show", f"{base_ref}:{file_path}"],
                capture_output=True,
                text=True,
                check=True,
            )
            return yaml.safe_load(result.stdout)
        except subprocess.CalledProcessError:
            return None

    def find_orphaned_urls(
        self, changed_files: list[tuple[str, str]], base_ref: str
    ) -> list[str]:
        """Find GCS URLs that were removed from YAML files.

        Args:
            changed_files: List of (status, file_path) tuples – status is 'D' or 'M'.
            base_ref: The base git ref to compare against.

        Returns:
            Sorted list of orphaned GCS public URLs.
        """
        orphaned: list[str] = []

        for status, file_path in changed_files:
            self.stats["files_checked"] += 1

            old_data = self._get_old_yaml_content(file_path, base_ref)
            old_urls = self._extract_gcs_urls(old_data)

            if not old_urls:
                continue

            if status == "D":
                # File was deleted – all its GCS URLs are orphaned
                new_urls: set[str] = set()
            else:
                # File was modified – find URLs that are no longer present
                try:
                    new_data = yaml.safe_load(
                        Path(file_path).read_text(encoding="utf-8")
                    )
                    new_urls = self._extract_gcs_urls(new_data)
                except Exception:
                    new_urls = set()

            removed = old_urls - new_urls
            for url in sorted(removed):
                print(f"  📋 Orphaned: {url}")
                orphaned.append(url)

        return sorted(orphaned)

    def run(self, changed_files: list[tuple[str, str]], base_ref: str):
        """Main execution method."""
        if self.dry_run:
            print("DRY RUN – no files will be deleted from GCS.")
        print("Starting orphaned image cleanup...")
        print(f"Materials directory: {self.materials_dir}")
        print("-" * 60)

        orphaned_urls = self.find_orphaned_urls(changed_files, base_ref)
        self.stats["urls_to_delete"] = len(orphaned_urls)

        if not orphaned_urls:
            print("No orphaned images found.")
            self._print_summary()
            return

        print(f"\nFound {len(orphaned_urls)} orphaned image(s).")
        print()
        for url in orphaned_urls:
            gcs_path = self._url_to_gcs_path(url)
            if self.dry_run:
                print(f"  🗑  Would delete from GCS: {gcs_path}")
            else:
                self._delete_from_gcs(gcs_path)

        self._print_summary()

    def _delete_from_gcs(self, gcs_path: str):
        """Delete a blob from GCS."""
        try:
            blob = self.bucket.blob(gcs_path)
            if not blob.exists():
                print(f"  ⚠  Not found in GCS (already deleted?): {gcs_path}")
                self.stats["not_found"] += 1
                return
            blob.delete()
            print(f"  ✓  Deleted from GCS: {gcs_path}")
            self.stats["deleted"] += 1
        except Exception as e:
            print(f"  ✗  Failed to delete {gcs_path}: {e}")
            self.stats["delete_failed"] += 1

    def _print_summary(self):
        """Print deletion summary."""
        print("\n" + "=" * 60)
        print("DELETION SUMMARY")
        print("=" * 60)
        print(f"Files checked:                {self.stats['files_checked']}")
        print(f"Orphaned URLs found:          {self.stats['urls_to_delete']}")
        if not self.dry_run:
            print(f"Successfully deleted:         {self.stats['deleted']}")
            print(f"Not found in GCS:             {self.stats['not_found']}")
            print(f"Delete failed:                {self.stats['delete_failed']}")
        print("=" * 60)


def _get_changed_yaml_files(base_ref: str, materials_dir: Path) -> list[tuple[str, str]]:
    """Return list of (status, path) for deleted or modified YAML files in materials_dir."""
    try:
        result = subprocess.run(
            [
                "git", "diff", "--name-status", "--diff-filter=DM",
                f"{base_ref}...HEAD",
                "--", str(materials_dir),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"ERROR: git diff failed: {e.stderr.strip()}")
        sys.exit(1)

    files: list[tuple[str, str]] = []
    for line in result.stdout.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2 and parts[1].endswith(".yaml"):
            files.append((parts[0].strip(), parts[1].strip()))
    return files


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Delete orphaned material images from GCS."
    )
    parser.add_argument(
        "--dry-run",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="List files that would be deleted without making any changes (default: on).",
    )
    parser.add_argument(
        "--base-ref",
        metavar="REF",
        required=True,
        help="Git ref to diff against (e.g. origin/main or HEAD~1).",
    )
    parser.add_argument(
        "--materials-dir",
        default="data/materials",
        metavar="DIR",
        help="Path to materials directory (default: data/materials).",
    )
    args = parser.parse_args()

    deletion = MaterialImageDeletion(
        materials_dir=args.materials_dir,
        dry_run=args.dry_run,
    )

    changed_files = _get_changed_yaml_files(args.base_ref, deletion.materials_dir)
    if not changed_files:
        print(
            f"No deleted/modified material files found against {args.base_ref}. Nothing to do."
        )
        return

    print(f"Changed/deleted files ({len(changed_files)}) against {args.base_ref}:")
    for status, f in changed_files:
        print(f"  [{status}] {f}")
    print()

    deletion.run(changed_files, args.base_ref)


if __name__ == "__main__":
    main()
