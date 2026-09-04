from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).parents[3] / "scripts" / "roberta_eval.py"
spec = importlib.util.spec_from_file_location("roberta_eval", MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def rows(labels: list[str], predictions: list[str]) -> list[dict[str, str]]:
    return [
        {"id": str(index), "label": label, "prediction": prediction}
        for index, (label, prediction) in enumerate(zip(labels, predictions))
    ]


def test_metrics_report_accuracy_and_macro_f1() -> None:
    result = module.classification_metrics(rows(["a", "a", "b", "b"], ["a", "b", "b", "b"]))
    assert result["n"] == 4
    assert result["accuracy"] == 0.75
    assert round(result["macro_f1"], 6) == round((2 / 3 + 0.8) / 2, 6)


def test_paired_bootstrap_is_deterministic_and_reports_relative_uplift() -> None:
    baseline = rows(["a", "a", "b", "b"], ["a", "b", "a", "b"])
    candidate = rows(["a", "a", "b", "b"], ["a", "a", "b", "b"])
    result = module.paired_bootstrap_delta(baseline, candidate, "accuracy", iterations=200)
    assert result["delta"] == 0.5
    assert result["ci95_low"] <= result["delta"] <= result["ci95_high"]


def test_bootstrap_rejects_mismatched_ids() -> None:
    baseline = rows(["a"], ["a"])
    candidate = rows(["a"], ["b"])
    candidate[0]["id"] = "different"
    try:
        module.paired_bootstrap_delta(baseline, candidate, "accuracy", iterations=10)
    except ValueError as error:
        assert "same ids" in str(error)
    else:
        raise AssertionError("expected mismatched ids to fail")
