"""Structure-aware text preparation for document indexing.

The extractors used by connectors commonly return Markdown-like text.  Keeping
its block boundaries before token-based chunking improves retrieval quality and
prevents page furniture (headers, footers, and tables of contents) from being
indexed as document content.
"""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass

from onyx.utils.text_processing import clean_text


_HEADING_RE = re.compile(r"^#{1,6}\s+\S")
_SETEXT_RE = re.compile(r"^(?:=+|-+)\s*$")
_LIST_RE = re.compile(
    r"^(?:\s{0,3}(?:[-*+]\s+|\d+[.)]\s+|[\u2022\u00b7]\s+|\[[ xX]\]\s+))"
)
_TABLE_SEPARATOR_RE = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$")
_PAGE_NUMBER_RE = re.compile(
    r"^(?:[-\u2013\u2014 ]*\s*)?(?:page\s+)?\d+"
    r"(?:\s*(?:/|of)\s*\d+)?(?:\s*[-\u2013\u2014 ]*)?$",
    re.I,
)
_TOC_MARKER_RE = re.compile(
    r"^(?:table\s+of\s+contents|contents|toc|目录|目\s*录)\s*[:：]?\s*$",
    re.I,
)
_TOC_ENTRY_RE = re.compile(
    r"^(?:#{1,6}\s*)?(?:\d+(?:\.\d+)*[.)]?\s+)?[^|]{2,100}?(?:\.{2,}|…{2,}|\s{2,})\s*\d+\s*$"
    r"|^\s*[-*+]\s+\[[^]]+\]\([^)]*\)\s*$",
    re.I,
)
_FURNITURE_RE = re.compile(
    r"^(?:header|footer|页眉|页脚)\s*[:：](?:\s*.*)?$|^(?:page\s+)?\d+\s*$",
    re.I,
)


@dataclass(frozen=True)
class PreparedTextBlock:
    text: str
    heading_context: str = ""


def compact_heading_contexts(contexts: Iterable[str], max_chars: int) -> str:
    """Deduplicate breadcrumbs in source order and enforce a small size cap."""
    unique_contexts = list(dict.fromkeys(context for context in contexts if context))
    return " | ".join(unique_contexts)[:max_chars].rstrip()


def _heading_level_and_text(block: str) -> tuple[int, str] | None:
    """Return a Markdown heading's level and display text."""
    lines = block.splitlines()
    first = lines[0].strip() if lines else ""
    atx_match = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", first)
    if atx_match:
        return len(atx_match.group(1)), atx_match.group(2).strip()

    if len(lines) >= 2 and _SETEXT_RE.match(lines[-1].strip()):
        heading_text = " ".join(line.strip() for line in lines[:-1]).strip()
        if heading_text:
            return (1 if lines[-1].strip().startswith("=") else 2), heading_text
    return None


def _line_kind(line: str) -> str:
    stripped = line.strip()
    if _HEADING_RE.match(stripped):
        return "heading"
    if _TABLE_SEPARATOR_RE.match(stripped) or stripped.count("|") >= 2:
        return "table"
    if _LIST_RE.match(line):
        return "list"
    return "paragraph"


def _page_parts(text: str) -> list[list[str]]:
    """Split form feeds and common textual PDF page separators."""
    text = re.sub(
        r"\n?\s*={3,}\s*page\s+\d+\s*={3,}\s*\n?",
        "\f",
        text,
        flags=re.I,
    )
    return [part.split("\n") for part in text.split("\f")]


def _remove_repeated_page_furniture(pages: list[list[str]]) -> list[str]:
    starts: Counter[str] = Counter()
    ends: Counter[str] = Counter()
    for page in pages:
        content = [line.strip() for line in page if line.strip()]
        if not content:
            continue
        for value in content[:2]:
            key = re.sub(r"\s+", " ", value).casefold()
            starts[key] += 1
        for value in content[-2:]:
            key = re.sub(r"\s+", " ", value).casefold()
            ends[key] += 1

    repeated = {
        key for key, count in starts.items() if count >= 2 and len(key) <= 120
    } | {key for key, count in ends.items() if count >= 2 and len(key) <= 120}

    result: list[str] = []
    for page in pages:
        content_indexes = [i for i, line in enumerate(page) if line.strip()]
        furniture_indexes: set[int] = set()
        if content_indexes:
            edge_indexes = content_indexes[:2] + content_indexes[-2:]
            for index in set(edge_indexes):
                line = page[index].strip()
                key = re.sub(r"\s+", " ", line).casefold()
                if (
                    key in repeated
                    or _FURNITURE_RE.match(line)
                    or _PAGE_NUMBER_RE.match(line)
                ):
                    furniture_indexes.add(index)
        result.extend(
            line for index, line in enumerate(page) if index not in furniture_indexes
        )
    return result


def _strip_table_of_contents(lines: Iterable[str]) -> list[str]:
    source = list(lines)
    result: list[str] = []
    index = 0
    while index < len(source):
        line = source[index]
        if not _TOC_MARKER_RE.match(line.strip()):
            result.append(line)
            index += 1
            continue

        entry_index = index + 1
        while entry_index < len(source) and not source[entry_index].strip():
            entry_index += 1
        if entry_index >= len(source) or not _TOC_ENTRY_RE.match(
            source[entry_index].strip()
        ):
            result.append(line)
            index += 1
            continue

        index = entry_index
        while index < len(source):
            stripped = source[index].strip()
            if not stripped or _TOC_ENTRY_RE.match(stripped):
                index += 1
                continue
            break
    return result


def _blocks(lines: list[str]) -> list[str]:
    blocks: list[str] = []
    current: list[str] = []
    current_kind: str | None = None

    def flush() -> None:
        nonlocal current, current_kind
        if current:
            block = "\n".join(current).strip()
            if block:
                blocks.append(block)
        current = []
        current_kind = None

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            flush()
            continue
        kind = _line_kind(line)
        if current_kind == "list" and line[:1].isspace() and kind == "paragraph":
            kind = "list"
        # A setext underline belongs to the preceding paragraph and turns it into a heading block.
        if _SETEXT_RE.match(stripped) and current:
            current.append(stripped)
            flush()
            continue
        if kind == "heading" or (current_kind and kind != current_kind):
            flush()
        current_kind = kind
        current.append(line.strip() if kind != "list" else line)
    flush()
    return blocks


def prepare_text_blocks(text: str) -> list[str]:
    """Clean extracted text and return title/paragraph/list/table blocks."""
    if not text or not text.strip():
        return []
    normalized = text.replace("\r\n", "\n").replace("\r", "\n").replace("\u00a0", " ")
    normalized = re.sub(r"[\u200b\u200c\u200d\ufeff\u2060]", "", normalized)
    lines = _strip_table_of_contents(
        _remove_repeated_page_furniture(_page_parts(normalized))
    )
    # Collapse whitespace-only runs so blank lines never become independent chunks.
    compact: list[str] = []
    previous_blank = False
    for line in lines:
        if not line.strip():
            if not previous_blank:
                compact.append("")
            previous_blank = True
        else:
            compact.append(line.rstrip())
            previous_blank = False
    prepared: list[str] = []
    for block in _blocks(compact):
        cleaned = clean_text(block)
        if cleaned:
            prepared.append(cleaned)
    return prepared


def prepare_text_blocks_with_context(text: str) -> list[PreparedTextBlock]:
    """Return clean blocks plus their nearest hierarchical heading path.

    The breadcrumb is indexing metadata, not display content. Keeping it on
    every block makes chunks split from a long section independently
    retrievable by the section name.
    """
    heading_path: list[str] = []
    prepared: list[PreparedTextBlock] = []
    for block in prepare_text_blocks(text):
        heading = _heading_level_and_text(block)
        if heading:
            level, heading_text = heading
            heading_path = heading_path[: level - 1]
            heading_path.append(heading_text)
        prepared.append(
            PreparedTextBlock(
                text=block,
                heading_context=" > ".join(heading_path),
            )
        )
    return prepared
