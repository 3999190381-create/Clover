import pytest

from onyx.configs.constants import DocumentSource
from onyx.connectors.models import Document
from onyx.connectors.models import TextSection
from onyx.indexing.indexing_pipeline import process_image_sections


def test_process_image_sections_prepares_structured_text(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "onyx.indexing.indexing_pipeline.get_image_extraction_and_analysis_enabled",
        lambda: False,
    )
    document = Document(
        id="structured",
        source=DocumentSource.FILE,
        semantic_identifier="structured.md",
        metadata={},
        sections=[TextSection(text="# Title\n\nBody\n\n- one\n- two", link="url")],
    )

    prepared = process_image_sections([document])[0].processed_sections

    assert [section.text for section in prepared] == [
        "# Title",
        "Body",
        "- one\n- two",
    ]
    assert all(section.link == "url" for section in prepared)
    assert [section.semantic_context for section in prepared] == [
        "Title",
        "Title",
        "Title",
    ]
