from collections import defaultdict
from collections.abc import Callable
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
