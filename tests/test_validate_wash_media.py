"""
Tests that wash-media entities are actually validated by validate_json_schema.py.
"""

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from scripts.validate_json_schema import JsonSchemaValidator

REPO_ROOT = Path(__file__).parent.parent


class TestWashMediaValidation(unittest.TestCase):
    """Confirm the wash-media data directory is wired into the validator."""

    def test_generic_water_is_validated_without_errors(self):
        """The real data/wash-media tree should be picked up and pass validation."""
        validator = JsonSchemaValidator(REPO_ROOT)
        count = validator.validate_entity_directory('wash-media', validator.ENTITY_SCHEMA_MAPPING['wash-media'])

        self.assertGreaterEqual(count, 1, "no wash-media files were found/validated")
        wash_media_errors = [e for e in validator.errors if e.entity == 'wash-media']
        self.assertEqual(
            [str(e) for e in wash_media_errors], [],
            "wash-media data failed schema validation"
        )

    def test_invalid_wash_medium_is_rejected(self):
        """A wash medium with a non-numeric density must be caught by the validator."""
        temp_dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, temp_dir, ignore_errors=True)

        wash_media_dir = temp_dir / "wash-media" / "generic"
        wash_media_dir.mkdir(parents=True)
        (wash_media_dir / "bad-water.yaml").write_text(
            "slug: bad-water\n"
            "uuid: 78c9e93b-94dc-4c63-af42-4bce6304142f\n"
            "brand:\n"
            "  slug: generic\n"
            "name: Bad Water\n"
            "density: not-a-number\n"
            "wash_capacity: 10000\n"
        )

        validator = JsonSchemaValidator(REPO_ROOT)
        validator.data_dir = temp_dir  # schema_dir stays pointed at the real, current schema

        validator.validate_entity_directory('wash-media', validator.ENTITY_SCHEMA_MAPPING['wash-media'])

        schema_errors = [e for e in validator.errors if e.rule == 'schema_validation']
        self.assertTrue(
            schema_errors,
            "validator did not flag a wash medium with a non-numeric density"
        )


if __name__ == '__main__':
    unittest.main()
