# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64

import pytest

from plane.utils.page_version_snapshot import decode_page_snapshot, encode_page_snapshot


class _FakePage:
    def __init__(self, html, json_body, binary, stripped=None):
        self.description_html = html
        self.description_json = json_body
        self.description_binary = binary
        self.description_stripped = stripped


@pytest.mark.unit
class TestPageVersionSnapshot:
    def test_roundtrip_preserves_binary_and_json(self):
        page = _FakePage(
            html="<p>سلام</p>",
            json_body={"type": "doc", "content": []},
            binary=b"\x00\x01binary-payload",
            stripped="سلام",
        )
        payload = encode_page_snapshot(page)
        decoded = decode_page_snapshot(payload)
        assert decoded["description_html"] == "<p>سلام</p>"
        assert decoded["description_json"] == {"type": "doc", "content": []}
        assert decoded["description_binary"] == b"\x00\x01binary-payload"
        assert decoded["description_stripped"] == "سلام"

    def test_decode_none_returns_empty_defaults(self):
        decoded = decode_page_snapshot(None)
        assert decoded["description_html"] == "<p></p>"
        assert decoded["description_json"] == {}
        assert decoded["description_binary"] is None

    def test_legacy_html_only_payload_still_decodes(self):
        # Older workers only shipped description_html in the Celery payload.
        import json

        payload = json.dumps({"description_html": "<p>old</p>"})
        decoded = decode_page_snapshot(payload)
        assert decoded["description_html"] == "<p>old</p>"
        assert decoded["description_binary"] is None
        assert decoded["description_json"] == {}

    def test_binary_is_base64_in_payload(self):
        page = _FakePage("<p>x</p>", {}, b"abc")
        payload = encode_page_snapshot(page)
        assert base64.b64encode(b"abc").decode("ascii") in payload
