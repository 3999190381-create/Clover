import unittest

from tests.regression.search_quality.metrics import calculate_context_metrics
from tests.regression.search_quality.metrics import ground_truth_link_candidates


class CalculateContextMetricsTest(unittest.TestCase):
    def test_metrics(self) -> None:
        cases = [
            (["a", "b"], ["a", "b"], (1.0, 1.0, 1.0)),
            (["a", "x"], ["a", "b"], (0.5, 0.5, 0.5)),
            (["a", "a", "x"], ["a"], (0.5, 1.0, 2 / 3)),
            ([], ["a"], (0.0, 0.0, 0.0)),
            (["a"], [], (0.0, 0.0, 0.0)),
        ]

        for retrieved, reference, expected in cases:
            with self.subTest(retrieved=retrieved, reference=reference):
                actual = calculate_context_metrics(retrieved, reference)
                for actual_value, expected_value in zip(actual, expected):
                    self.assertAlmostEqual(actual_value, expected_value)

    def test_ground_truth_link_candidates_preserve_literal_percent_urls(self) -> None:
        encoded = "https://example.com/%E9%81%97%E4%BC%A0_%E7%AE%97%E6%B3%95"

        self.assertEqual(
            ground_truth_link_candidates(encoded),
            [encoded, "https://example.com/遗传_算法"],
        )

    def test_ground_truth_link_candidates_do_not_duplicate_plain_urls(self) -> None:
        self.assertEqual(
            ground_truth_link_candidates("https://example.com/plain"),
            ["https://example.com/plain"],
        )


if __name__ == "__main__":
    unittest.main()
