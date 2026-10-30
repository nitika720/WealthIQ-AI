import unittest
from forecaster import WealthIQForecaster

class TestWealthIQForecaster(unittest.TestCase):
    def setUp(self):
        self.forecaster = WealthIQForecaster()

    def test_insufficient_data_fallback(self):
        result = self.forecaster.forecast_next_month([], [])
        self.assertEqual(result["model_metadata"]["status"], "INSUFFICIENT_DATA_FALLBACK")
        self.assertIn("limitations", result)

    def test_forecast_calculation(self):
        synthetic_tx = [
            {"date": "2026-08-05", "amount": 25000, "category": "Housing & Rent", "type": "expense"},
            {"date": "2026-08-15", "amount": 8000, "category": "Groceries", "type": "expense"},
            {"date": "2026-09-05", "amount": 25000, "category": "Housing & Rent", "type": "expense"},
            {"date": "2026-09-15", "amount": 9000, "category": "Groceries", "type": "expense"},
            {"date": "2026-10-05", "amount": 25000, "category": "Housing & Rent", "type": "expense"},
            {"date": "2026-10-15", "amount": 9500, "category": "Groceries", "type": "expense"},
        ]
        budgets = [
            {"category": "Housing & Rent", "amount": 26000},
            {"category": "Groceries", "amount": 10000},
        ]
        result = self.forecaster.forecast_next_month(synthetic_tx, budgets)
        self.assertGreater(result["predicted_total_expense"], 0)
        self.assertLess(result["confidence_interval"]["lower"], result["confidence_interval"]["upper"])
        self.assertEqual(len(result["category_breakdown"]), 2)

if __name__ == "__main__":
    unittest.main()
