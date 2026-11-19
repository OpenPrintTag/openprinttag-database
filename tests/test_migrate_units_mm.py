"""Tests for scripts/migrate_units_mm.py (µm -> mm migration of diameters)."""

import tempfile
import unittest
from pathlib import Path

from scripts.migrate_units_mm import convert_line, migrate, um_to_mm


class TestUmToMm(unittest.TestCase):
    def test_conversions(self):
        self.assertEqual(um_to_mm("1750"), "1.75")
        self.assertEqual(um_to_mm("2850"), "2.85")
        self.assertEqual(um_to_mm("3000"), "3")
        self.assertEqual(um_to_mm("1730"), "1.73")
        self.assertEqual(um_to_mm("30"), "0.03")
        self.assertEqual(um_to_mm("400"), "0.4")
        self.assertEqual(um_to_mm("200"), "0.2")


class TestConvertLine(unittest.TestCase):
    def test_top_level_and_nested(self):
        self.assertEqual(convert_line("filament_diameter: 1750\n"), ("filament_diameter: 1.75\n", "converted"))
        self.assertEqual(convert_line("  min_nozzle_diameter: 400\n"), ("  min_nozzle_diameter: 0.4\n", "converted"))
        self.assertEqual(
            convert_line("filament_diameter_tolerance: 30\n"), ("filament_diameter_tolerance: 0.03\n", "converted")
        )

    def test_keeps_comment_and_crlf(self):
        self.assertEqual(
            convert_line("filament_diameter: 2850  # thick\r\n"),
            ("filament_diameter: 2.85  # thick\r\n", "converted"),
        )

    def test_already_mm_is_untouched(self):
        for line in ("filament_diameter: 1.75\n", "filament_diameter: 3\n", "min_nozzle_diameter: 0.4\n"):
            self.assertEqual(convert_line(line), (line, "mm"))

    def test_zero_is_unit_independent(self):
        line = "filament_diameter_tolerance: 0\n"
        self.assertEqual(convert_line(line), (line, "mm"))

    def test_ambiguous_tolerance(self):
        line = "filament_diameter_tolerance: 5\n"
        self.assertEqual(convert_line(line), (line, "ambiguous"))

    def test_unrelated_lines_untouched(self):
        for line in ("nominal_full_length: 319872\n", "# filament_diameter: 1750\n", "slug: x-1750\n"):
            self.assertEqual(convert_line(line), (line, None))

    def test_out_of_range(self):
        line = "min_nozzle_diameter: 500000\n"
        self.assertEqual(convert_line(line), (line, "range"))


class TestMigrate(unittest.TestCase):
    def test_dry_run_then_apply_then_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            pkg = data / "material-packages" / "b" / "p-2850um-1kg.yaml"
            pkg.parent.mkdir(parents=True)
            text = "slug: p-2850um-1kg\nfilament_diameter: 2850\nfilament_diameter_tolerance: 50\n"
            pkg.write_text(text)
            mat = data / "materials" / "b" / "m.yaml"
            mat.parent.mkdir(parents=True)
            mat.write_text("properties:\n  min_nozzle_diameter: 400\n")

            res = migrate(data, apply=False)
            self.assertEqual(res.converted, 3)
            self.assertEqual(pkg.read_text(), text)  # dry run writes nothing

            migrate(data, apply=True)
            self.assertEqual(
                pkg.read_text(), "slug: p-2850um-1kg\nfilament_diameter: 2.85\nfilament_diameter_tolerance: 0.05\n"
            )
            self.assertEqual(mat.read_text(), "properties:\n  min_nozzle_diameter: 0.4\n")

            again = migrate(data, apply=True)
            self.assertEqual(again.converted, 0)
            self.assertEqual(again.already_mm, 3)

    def test_skips_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "manifest.yaml"
            manifest.write_text("filament_diameter: 1750\n")
            self.assertEqual(migrate(Path(tmp), apply=True).converted, 0)


if __name__ == "__main__":
    unittest.main()
