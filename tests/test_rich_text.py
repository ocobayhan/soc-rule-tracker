"""sanitize_rich_text() / strip_rich_text_for_plaintext() (app.py) — the
allowlist HTML sanitizer for Threat Hunting/Incident Report prose fields
(docs/PROGRESS.md, "Zengin Metin Biçimlendirme"). Unit-level: imports the
functions directly off the `flask_app` module fixture, no HTTP client
needed."""
import pytest


@pytest.fixture()
def sanitize_rich_text(flask_app):
    return flask_app.sanitize_rich_text


@pytest.fixture()
def strip_rich_text_for_plaintext(flask_app):
    return flask_app.strip_rich_text_for_plaintext


class TestSanitizeRichText:
    def test_allowed_tags_survive_without_attributes(self, sanitize_rich_text):
        assert sanitize_rich_text('<b class="x" onclick="y">bold</b>') == "<b>bold</b>"
        assert sanitize_rich_text("<i>italic</i>") == "<i>italic</i>"
        assert sanitize_rich_text("<u>underline</u>") == "<u>underline</u>"
        assert sanitize_rich_text("<code>x=1</code>") == "<code>x=1</code>"
        assert sanitize_rich_text("<pre>line1\nline2</pre>") == "<pre>line1\nline2</pre>"
        assert sanitize_rich_text("a<br>b") == "a<br>b"
        assert sanitize_rich_text("a<br/>b") == "a<br>b"

    def test_disallowed_tags_are_dropped_but_inner_text_kept(self, sanitize_rich_text):
        assert sanitize_rich_text("<div>text</div>") == "text"
        assert sanitize_rich_text('<img src=x onerror="alert(1)">tail') == "tail"

    def test_script_content_becomes_inert_escaped_text(self, sanitize_rich_text):
        result = sanitize_rich_text("<script>alert(1)</script>")
        assert "<script" not in result
        assert "alert(1)" in result

    def test_nested_disallowed_wrapping_allowed_tag_still_renders(self, sanitize_rich_text):
        assert sanitize_rich_text("<div>nested <b>bold</b></div>") == "nested <b>bold</b>"

    def test_malformed_or_unclosed_tags_do_not_crash(self, sanitize_rich_text):
        assert sanitize_rich_text("<b>unclosed") == "<b>unclosed"
        assert sanitize_rich_text("<<<>>>") is not None

    def test_entity_round_trip_cannot_smuggle_a_live_tag(self, sanitize_rich_text):
        result = sanitize_rich_text("&lt;b&gt;not a tag&lt;/b&gt;")
        assert "<b>" not in result
        assert "&lt;b&gt;" in result

    def test_empty_and_none_input(self, sanitize_rich_text):
        assert sanitize_rich_text(None) == ""
        assert sanitize_rich_text("") == ""


class TestStripRichTextForPlaintext:
    def test_br_becomes_newline(self, strip_rich_text_for_plaintext):
        assert strip_rich_text_for_plaintext("a<br>b") == "a\nb"

    def test_other_allowed_tags_drop_but_keep_text(self, strip_rich_text_for_plaintext):
        assert strip_rich_text_for_plaintext("<b>bold</b> and <code>code</code>") == "bold and code"

    def test_empty_and_none_input(self, strip_rich_text_for_plaintext):
        assert strip_rich_text_for_plaintext(None) == ""
        assert strip_rich_text_for_plaintext("") == ""
