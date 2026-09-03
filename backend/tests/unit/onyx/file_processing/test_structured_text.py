from onyx.file_processing.structured_text import prepare_text_blocks


def test_prepare_text_blocks_preserves_structural_boundaries() -> None:
    blocks = prepare_text_blocks(
        "# Title\n\nParagraph one\ncontinued.\n\n- first\n- second\n\n| A | B |\n| --- | --- |\n| 1 | 2 |"
    )

    assert blocks == [
        "# Title",
        "Paragraph one\ncontinued.",
        "- first\n- second",
        "| A | B |\n| --- | --- |\n| 1 | 2 |",
    ]


def test_prepare_text_blocks_filters_toc_and_repeated_page_furniture() -> None:
    blocks = prepare_text_blocks(
        "Header\n目录\n1. Intro ........ 1\n2. Detail ........ 2\n\f"
        "Header\n# Intro\nActual content.\nFooter\n2\n\f"
        "Header\n# Detail\nMore content.\nFooter\n3"
    )

    assert blocks == ["# Intro", "Actual content.", "# Detail", "More content."]


def test_prepare_text_blocks_collapses_blank_lines() -> None:
    assert prepare_text_blocks("one\n\n\n\ntwo\n\n") == ["one", "two"]


def test_prepare_text_blocks_keeps_contents_heading_without_toc_entries() -> None:
    assert prepare_text_blocks("# Contents\n\nThis section describes the package.") == [
        "# Contents",
        "This section describes the package.",
    ]


def test_prepare_text_blocks_filters_single_page_furniture_and_keeps_list_continuation() -> (
    None
):
    assert prepare_text_blocks(
        "Header: Internal\n- first item\n  continued detail\nFooter: Internal\n1"
    ) == ["- first item\n  continued detail"]
