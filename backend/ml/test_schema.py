"""
ML 管道输出 Schema 测试
验证 pipeline.py 产出的 6 个 JSON 文件结构是否符合预期。
用法: cd backend/ml && python3 test_schema.py
"""
import json
import os
import unittest

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

REQUIRED_FILES = {
    "sdm_results.json",
    "forecast_results.json",
    "hotspot_results.json",
    "climate_correlation.json",
    "interpretability.json",
    "ehi_results.json",
}


def load(name):
    with open(os.path.join(OUTPUT_DIR, name), "r", encoding="utf-8") as f:
        return json.load(f)


class TestMLSchema(unittest.TestCase):
    def test_all_files_exist(self):
        for name in REQUIRED_FILES:
            self.assertTrue(
                os.path.exists(os.path.join(OUTPUT_DIR, name)),
                f"缺少输出文件: {name}",
            )

    def test_sdm_schema(self):
        data = load("sdm_results.json")
        self.assertIsInstance(data, dict)
        self.assertGreater(len(data), 0, "SDM 结果为空")
        for species, result in data.items():
            self.assertIn("auc", result, f"{species} 缺少 auc")
            self.assertIn("accuracy", result)
            self.assertIn("top_features", result)
            self.assertIsInstance(result["top_features"], list)
            self.assertIsInstance(result["auc"], (int, float))
            self.assertGreaterEqual(result["auc"], 0)
            self.assertLessEqual(result["auc"], 1)

    def test_ehi_schema(self):
        data = load("ehi_results.json")
        self.assertIsInstance(data, dict)
        for species, result in data.items():
            self.assertIn("ehi_score", result)
            self.assertIn("grade", result)
            self.assertIn(result["grade"], {"A", "B", "C", "D"})
            self.assertIn("recommendation", result)
            self.assertIsInstance(result["recommendation"], list)

    def test_forecast_schema(self):
        data = load("forecast_results.json")
        self.assertIsInstance(data, dict)
        for species, result in data.items():
            self.assertIn("trend_direction", result)
            self.assertIn(result["trend_direction"], {"上升", "下降", "平稳"})
            self.assertIn("anomalies", result)
            self.assertIsInstance(result["anomalies"], list)

    def test_hotspot_schema(self):
        data = load("hotspot_results.json")
        self.assertIsInstance(data, dict)
        for species, result in data.items():
            self.assertIn("clusters", result)
            self.assertIsInstance(result["clusters"], list)

    def test_interpret_schema(self):
        data = load("interpretability.json")
        self.assertIsInstance(data, dict)
        for species, result in data.items():
            self.assertIn("permutation_importance", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
