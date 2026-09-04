import pytest

from onyx.utils.ranking import maximal_marginal_relevance


def test_mmr_keeps_relevance_and_promotes_novel_content() -> None:
    results = [
        {"text": "vespa hnsw angular index", "score": 1.0},
        {"text": "vespa hnsw angular graph", "score": 0.95},
        {"text": "cross encoder reranking", "score": 0.8},
    ]

    reordered = maximal_marginal_relevance(
        results,
        text_extractor=lambda result: result["text"],
        score_extractor=lambda result: result["score"],
        lambda_mult=0.3,
    )

    assert reordered[0] == results[0]
    assert reordered[1] == results[2]
    assert reordered[2] == results[1]


def test_mmr_validates_lambda_and_top_k() -> None:
    with pytest.raises(ValueError):
        maximal_marginal_relevance(["a"], lambda value: value, lambda_mult=1.1)

    assert maximal_marginal_relevance(
        ["a", "b"], lambda value: value, top_k=0
    ) == []
