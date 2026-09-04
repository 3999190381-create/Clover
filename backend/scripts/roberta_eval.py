"""Reproducible metrics and A/B comparison for a RoBERTa classifier.

The script deliberately has no training-framework dependency.  It evaluates
prediction files produced by any RoBERTa training job and keeps the metric
definitions stable for resume and regression reporting.

Input files may be JSON/JSONL or CSV and must contain an id, a gold label and
one prediction column.  For JSON records the accepted keys are ``id``,
``label``/``gold_label`` and ``prediction``/``predicted_label``.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from collections import Counter
from pathlib import Path
from typing import Any, Iterable


def _read_records(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        with path.open(newline="", encoding="utf-8-sig") as handle:
            return [dict(row) for row in csv.DictReader(handle)]
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    if text.startswith("["):
        value = json.loads(text)
        if not isinstance(value, list) or not all(isinstance(row, dict) for row in value):
            raise ValueError(f"{path} must contain a JSON array of objects")
        return value
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def _first(row: dict[str, Any], keys: Iterable[str], field: str) -> Any:
    for key in keys:
        if key in row and row[key] != "":
            return row[key]
    raise ValueError(f"missing {field} in record: {row}")


def _normalise(records: list[dict[str, Any]], prediction_required: bool) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for index, row in enumerate(records):
        item = {
            "id": str(_first(row, ("id", "example_id", "question_id"), "id"))
            if any(key in row for key in ("id", "example_id", "question_id"))
            else str(index),
            "label": str(_first(row, ("label", "gold_label", "y_true"), "label")),
        }
        if prediction_required:
            item["prediction"] = str(
                _first(row, ("prediction", "predicted_label", "y_pred"), "prediction")
            )
        result.append(item)
    return result


def _f1_by_label(y_true: list[str], y_pred: list[str], labels: list[str]) -> dict[str, float]:
    scores: dict[str, float] = {}
    for label in labels:
        tp = sum(a == label and b == label for a, b in zip(y_true, y_pred))
        fp = sum(a != label and b == label for a, b in zip(y_true, y_pred))
        fn = sum(a == label and b != label for a, b in zip(y_true, y_pred))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        scores[label] = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return scores


def classification_metrics(records: list[dict[str, str]]) -> dict[str, Any]:
    if not records:
        raise ValueError("cannot evaluate an empty prediction file")
    y_true = [row["label"] for row in records]
    y_pred = [row["prediction"] for row in records]
    labels = sorted(set(y_true) | set(y_pred))
    per_class = _f1_by_label(y_true, y_pred, labels)
    return {
        "n": len(records),
        "labels": labels,
        "accuracy": sum(a == b for a, b in zip(y_true, y_pred)) / len(records),
        "macro_f1": sum(per_class.values()) / len(labels) if labels else 0.0,
        "per_class_f1": per_class,
        "support": dict(Counter(y_true)),
    }


def _metric(records: list[dict[str, str]], name: str) -> float:
    if name == "accuracy":
        return sum(row["label"] == row["prediction"] for row in records) / len(records)
    return float(classification_metrics(records)[name])


def paired_bootstrap_delta(
    baseline: list[dict[str, str]], candidate: list[dict[str, str]],
    metric: str, iterations: int = 10_000, seed: int = 20260904,
) -> dict[str, float]:
    if [row["id"] for row in baseline] != [row["id"] for row in candidate]:
        raise ValueError("baseline and candidate must contain the same ids in the same order")
    rng = random.Random(seed)
    n = len(baseline)
    deltas = []
    for _ in range(iterations):
        sample = [rng.randrange(n) for _ in range(n)]
        b = [baseline[index] for index in sample]
        c = [candidate[index] for index in sample]
        deltas.append(_metric(c, metric) - _metric(b, metric))
    deltas.sort()
    return {
        "delta": _metric(candidate, metric) - _metric(baseline, metric),
        "ci95_low": deltas[int(iterations * 0.025)],
        "ci95_high": deltas[int(iterations * 0.975) - 1],
    }


def _write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def evaluate(path: Path) -> dict[str, Any]:
    return classification_metrics(_normalise(_read_records(path), prediction_required=True))


def compare(baseline_path: Path, candidate_path: Path, iterations: int) -> dict[str, Any]:
    baseline = _normalise(_read_records(baseline_path), prediction_required=True)
    candidate = _normalise(_read_records(candidate_path), prediction_required=True)
    if len(baseline) != len(candidate):
        raise ValueError("baseline and candidate must have the same number of records")
    baseline_by_id = {row["id"]: row for row in baseline}
    candidate = [next((row for row in candidate if row["id"] == item["id"]), None) for item in baseline]
    if any(row is None for row in candidate):
        raise ValueError("baseline and candidate must contain the same ids")
    candidate = [row for row in candidate if row is not None]
    output: dict[str, Any] = {"baseline": classification_metrics(baseline), "candidate": classification_metrics(candidate)}
    for metric in ("accuracy", "macro_f1"):
        result = paired_bootstrap_delta(baseline, candidate, metric, iterations=iterations)
        old = output["baseline"][metric]
        new = output["candidate"][metric]
        result["relative_uplift"] = (new - old) / old if old else None
        output[metric] = result
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    eval_parser = subparsers.add_parser("evaluate")
    eval_parser.add_argument("predictions", type=Path)
    eval_parser.add_argument("--output", type=Path)
    compare_parser = subparsers.add_parser("compare")
    compare_parser.add_argument("baseline", type=Path)
    compare_parser.add_argument("candidate", type=Path)
    compare_parser.add_argument("--iterations", type=int, default=10_000)
    compare_parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = evaluate(args.predictions) if args.command == "evaluate" else compare(args.baseline, args.candidate, args.iterations)
    if args.output:
        _write(args.output, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
