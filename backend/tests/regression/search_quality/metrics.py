from collections.abc import Iterable
from urllib.parse import unquote


def ground_truth_link_candidates(doc_link: str) -> list[str]:
    """Return encoded and decoded forms without changing candidate order."""
    return list(dict.fromkeys((doc_link, unquote(doc_link))))


def calculate_context_metrics(
    retrieved_document_ids: Iterable[str],
    reference_document_ids: Iterable[str],
) -> tuple[float, float, float]:
    """Calculate document-level retrieval precision, recall, and F1.

    Each document is counted once even when several chunks from that document
    are returned. The reference IDs are the documents annotated as relevant.
    """
    retrieved = set(retrieved_document_ids)
    reference = set(reference_document_ids)
    relevant_count = len(retrieved.intersection(reference))

    precision = relevant_count / len(retrieved) if retrieved else 0.0
    recall = relevant_count / len(reference) if reference else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall > 0
        else 0.0
    )
    return precision, recall, f1
