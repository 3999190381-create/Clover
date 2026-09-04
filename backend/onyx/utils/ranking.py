import math
import re
from collections import defaultdict
from collections.abc import Callable
from collections.abc import Sequence
from typing import TypeVar


T = TypeVar("T")


def diversify_ranked_results(
    ranked_results: list[T],
    group_extractor: Callable[[T], str],
    max_per_group: int,
) -> list[T]:
    """Softly cap groups in the first pass, then append deferred results.

    No result is discarded. This improves early result coverage while keeping
    the original ranking as the tiebreaker and allowing repeated groups to fill
    any remaining result slots.
    """
    if max_per_group < 1:
        raise ValueError("max_per_group must be at least 1")

    counts: dict[str, int] = defaultdict(int)
    first_pass: list[T] = []
    deferred: list[T] = []
    for item in ranked_results:
        group = group_extractor(item)
        if counts[group] < max_per_group:
            first_pass.append(item)
            counts[group] += 1
        else:
            deferred.append(item)
    return first_pass + deferred


def maximal_marginal_relevance(
    ranked_results: Sequence[T],
    text_extractor: Callable[[T], str],
    score_extractor: Callable[[T], float | None] | None = None,
    top_k: int | None = None,
    lambda_mult: float = 0.7,
) -> list[T]:
    """Reorder results with Maximal Marginal Relevance (MMR).

    Vespa returns the relevance score but not the source vector, so this
    post-retrieval implementation uses normalized token overlap as the
    redundancy signal.  The original ranking score remains the relevance
    signal, which makes this deterministic and inexpensive for every search.

    ``lambda_mult`` controls the relevance/diversity trade-off: 1.0 keeps the
    original ranking, while lower values prefer novel content.  No result is
    discarded unless ``top_k`` is provided.
    """
    if not ranked_results:
        return []
    if top_k is not None and top_k < 1:
        return []
    if not 0.0 <= lambda_mult <= 1.0:
        raise ValueError("lambda_mult must be between 0 and 1")

    limit = (
        min(top_k, len(ranked_results)) if top_k is not None else len(ranked_results)
    )
    items = list(ranked_results)

    raw_scores = [
        score_extractor(item) if score_extractor is not None else None
        for item in items
    ]
    finite_scores = [
        score
        for score in raw_scores
        if score is not None and math.isfinite(score)
    ]
    if finite_scores and max(finite_scores) > min(finite_scores):
        score_min = min(finite_scores)
        score_range = max(finite_scores) - score_min
        relevance = [
            (score - score_min) / score_range
            if score is not None and math.isfinite(score)
            else 0.0
            for score in raw_scores
        ]
    else:
        # Fall back to the incoming rank when Vespa scores are unavailable or
        # tied (a common case for federated results).
        relevance = [1.0 - (i / max(len(items) - 1, 1)) for i in range(len(items))]

    token_sets = [
        set(re.findall(r"\w+", text_extractor(item).lower())) for item in items
    ]

    def _jaccard(left: set[str], right: set[str]) -> float:
        union = left | right
        return len(left & right) / len(union) if union else 0.0

    remaining = set(range(len(items)))
    selected: list[int] = []
    while remaining and len(selected) < limit:
        best_index = max(
            remaining,
            key=lambda i: (
                lambda_mult * relevance[i]
                - (1.0 - lambda_mult)
                * max((_jaccard(token_sets[i], token_sets[j]) for j in selected), default=0.0),
                relevance[i],
                -i,
            ),
        )
        selected.append(best_index)
        remaining.remove(best_index)

    return [items[i] for i in selected] + [items[i] for i in sorted(remaining)]
