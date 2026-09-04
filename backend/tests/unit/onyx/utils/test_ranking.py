from typing import NamedTuple

import pytest

from onyx.utils.ranking import diversify_ranked_results


class MockDocument(NamedTuple):
    document_id: str
    content: str


def test_soft_cap_improves_early_document_coverage() -> None:
    ranked = [
        MockDocument("a", "a1"),
        MockDocument("a", "a2"),
        MockDocument("a", "a3"),
        MockDocument("b", "b1"),
        MockDocument("c", "c1"),
    ]

    result = diversify_ranked_results(
        ranked,
        group_extractor=lambda item: item.document_id,
        max_per_group=2,
    )

    assert [item.content for item in result] == ["a1", "a2", "b1", "c1", "a3"]


def test_soft_cap_never_discards_results() -> None:
    ranked = [MockDocument("a", "a1"), MockDocument("a", "a2")]

    result = diversify_ranked_results(ranked, lambda item: item.document_id, 1)

    assert set(result) == set(ranked)


def test_soft_cap_rejects_non_positive_limit() -> None:
    with pytest.raises(ValueError, match="at least 1"):
        diversify_ranked_results([], lambda item: item.document_id, 0)
