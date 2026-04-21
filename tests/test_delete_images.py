"""
Tests for delete_images.py script.
"""

import unittest
import tempfile
import yaml
from pathlib import Path
from unittest.mock import MagicMock, patch, call
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from delete_images import MaterialImageDeletion, _get_changed_yaml_files


BASE_URL = "https://files.openprinttag.org"


def _make_deletion(**kwargs) -> MaterialImageDeletion:
    """Create a dry-run MaterialImageDeletion instance without GCS."""
    defaults = dict(materials_dir="data/materials", dry_run=True)
    defaults.update(kwargs)
    return MaterialImageDeletion(**defaults)


class TestExtractGcsUrls(unittest.TestCase):
    def setUp(self):
        self.deletion = _make_deletion()

    def test_extracts_gcs_urls_from_dict_photos(self):
        data = {
            "photos": [
                {"url": f"{BASE_URL}/brand/mat/a.jpg"},
                {"url": "https://other.com/b.jpg"},
            ]
        }
        result = self.deletion._extract_gcs_urls(data)
        self.assertEqual(result, {f"{BASE_URL}/brand/mat/a.jpg"})

    def test_extracts_gcs_urls_from_plain_string_photos(self):
        data = {"photos": [f"{BASE_URL}/brand/mat/a.jpg", "https://other.com/b.jpg"]}
        result = self.deletion._extract_gcs_urls(data)
        self.assertEqual(result, {f"{BASE_URL}/brand/mat/a.jpg"})

    def test_returns_empty_set_for_no_photos(self):
        self.assertEqual(self.deletion._extract_gcs_urls({}), set())
        self.assertEqual(self.deletion._extract_gcs_urls(None), set())

    def test_returns_empty_set_when_no_gcs_urls(self):
        data = {"photos": [{"url": "https://other.com/img.jpg"}]}
        self.assertEqual(self.deletion._extract_gcs_urls(data), set())


class TestUrlToGcsPath(unittest.TestCase):
    def test_converts_url_to_path(self):
        deletion = _make_deletion()
        url = f"{BASE_URL}/brand/mat/photo.jpg"
        self.assertEqual(deletion._url_to_gcs_path(url), "brand/mat/photo.jpg")


class TestFindOrphanedUrls(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.deletion = _make_deletion(materials_dir=self.temp_dir)

    def _write_yaml(self, path: str, data: dict) -> Path:
        p = Path(self.temp_dir) / path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(yaml.dump(data), encoding="utf-8")
        return p

    def _mock_old_content(self, deletion, file_path: str, data: dict | None):
        """Patch _get_old_yaml_content to return data for file_path."""
        original = deletion._get_old_yaml_content

        def side_effect(fp, base_ref):
            if fp == file_path:
                return data
            return original(fp, base_ref)

        deletion._get_old_yaml_content = side_effect

    def test_deleted_file_all_urls_orphaned(self):
        """All GCS URLs from a deleted file should be orphaned."""
        old_data = {
            "photos": [
                {"url": f"{BASE_URL}/brand/mat/a.jpg"},
                {"url": f"{BASE_URL}/brand/mat/b.jpg"},
            ]
        }
        self._mock_old_content(self.deletion, "data/materials/brand/mat.yaml", old_data)

        result = self.deletion.find_orphaned_urls(
            [("D", "data/materials/brand/mat.yaml")], base_ref="origin/main"
        )
        self.assertEqual(
            result,
            [f"{BASE_URL}/brand/mat/a.jpg", f"{BASE_URL}/brand/mat/b.jpg"],
        )
        self.assertEqual(self.deletion.stats["files_checked"], 1)

    def test_modified_file_removed_url_orphaned(self):
        """URL present in old YAML but absent from new YAML should be orphaned."""
        old_data = {
            "photos": [
                {"url": f"{BASE_URL}/brand/mat/keep.jpg"},
                {"url": f"{BASE_URL}/brand/mat/remove.jpg"},
            ]
        }
        new_data = {"photos": [{"url": f"{BASE_URL}/brand/mat/keep.jpg"}]}

        file_path = self._write_yaml("brand/mat.yaml", new_data)
        self._mock_old_content(
            self.deletion, str(file_path.relative_to(self.temp_dir)), old_data
        )
        # Use the actual file path as it would appear in git output
        self._mock_old_content(self.deletion, str(file_path), old_data)

        result = self.deletion.find_orphaned_urls(
            [("M", str(file_path))], base_ref="origin/main"
        )
        self.assertEqual(result, [f"{BASE_URL}/brand/mat/remove.jpg"])

    def test_modified_file_no_urls_removed(self):
        """If no GCS URLs are removed, result should be empty."""
        old_data = {"photos": [{"url": f"{BASE_URL}/brand/mat/keep.jpg"}]}
        new_data = {
            "photos": [
                {"url": f"{BASE_URL}/brand/mat/keep.jpg"},
                {"url": f"{BASE_URL}/brand/mat/new.jpg"},
            ]
        }

        file_path = self._write_yaml("brand/mat.yaml", new_data)
        self._mock_old_content(self.deletion, str(file_path), old_data)

        result = self.deletion.find_orphaned_urls(
            [("M", str(file_path))], base_ref="origin/main"
        )
        self.assertEqual(result, [])

    def test_no_gcs_urls_in_old_file(self):
        """File with no GCS URLs in old version should produce no orphans."""
        old_data = {"photos": [{"url": "https://external.com/img.jpg"}]}
        self._mock_old_content(self.deletion, "data/materials/brand/mat.yaml", old_data)

        result = self.deletion.find_orphaned_urls(
            [("M", "data/materials/brand/mat.yaml")], base_ref="origin/main"
        )
        self.assertEqual(result, [])

    def test_old_file_not_found_returns_empty(self):
        """If git show fails (file not found), no orphans should be reported."""
        # _get_old_yaml_content returns None when git show fails
        result = self.deletion.find_orphaned_urls(
            [("M", "data/materials/brand/nonexistent.yaml")], base_ref="origin/main"
        )
        self.assertEqual(result, [])

    def test_empty_changed_files(self):
        result = self.deletion.find_orphaned_urls([], base_ref="origin/main")
        self.assertEqual(result, [])
        self.assertEqual(self.deletion.stats["files_checked"], 0)


class TestDeleteFromGcs(unittest.TestCase):
    def test_deletes_existing_blob(self):
        with patch("delete_images.storage.Client") as mock_storage:
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_blob.exists.return_value = True

            deletion = MaterialImageDeletion(dry_run=False)
            deletion._delete_from_gcs("brand/mat/photo.jpg")

            mock_blob.delete.assert_called_once()
            self.assertEqual(deletion.stats["deleted"], 1)

    def test_handles_already_deleted_blob(self):
        with patch("delete_images.storage.Client") as mock_storage:
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_blob.exists.return_value = False

            deletion = MaterialImageDeletion(dry_run=False)
            deletion._delete_from_gcs("brand/mat/photo.jpg")

            mock_blob.delete.assert_not_called()
            self.assertEqual(deletion.stats["not_found"], 1)

    def test_handles_delete_exception(self):
        with patch("delete_images.storage.Client") as mock_storage:
            mock_client = MagicMock()
            mock_storage.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob
            mock_blob.exists.return_value = True
            mock_blob.delete.side_effect = Exception("GCS error")

            deletion = MaterialImageDeletion(dry_run=False)
            deletion._delete_from_gcs("brand/mat/photo.jpg")

            self.assertEqual(deletion.stats["delete_failed"], 1)


class TestGetChangedYamlFiles(unittest.TestCase):
    def test_parses_deleted_and_modified(self):
        output = "D\tdata/materials/brand/a.yaml\nM\tdata/materials/brand/b.yaml\n"
        with patch("delete_images.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(stdout=output, returncode=0)
            result = _get_changed_yaml_files("origin/main", Path("data/materials"))

        self.assertEqual(
            result,
            [
                ("D", "data/materials/brand/a.yaml"),
                ("M", "data/materials/brand/b.yaml"),
            ],
        )

    def test_ignores_non_yaml_files(self):
        output = "D\tdata/materials/brand/a.yaml\nM\tdata/materials/brand/b.json\n"
        with patch("delete_images.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(stdout=output, returncode=0)
            result = _get_changed_yaml_files("origin/main", Path("data/materials"))

        self.assertEqual(result, [("D", "data/materials/brand/a.yaml")])

    def test_returns_empty_for_no_changes(self):
        with patch("delete_images.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(stdout="", returncode=0)
            result = _get_changed_yaml_files("origin/main", Path("data/materials"))

        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
