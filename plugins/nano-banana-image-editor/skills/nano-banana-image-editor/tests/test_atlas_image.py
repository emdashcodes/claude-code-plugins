import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPTS = Path(__file__).parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from atlas_image import AtlasAPIError, generate_image  # noqa: E402


class FakeResponse:
    def __init__(self, body):
        self.body = body if isinstance(body, bytes) else json.dumps(body).encode()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body


class AtlasImageTests(unittest.TestCase):
    def test_submits_once_then_polls_and_downloads(self):
        calls = []

        def opener(request, timeout):
            calls.append((request.get_method(), request.full_url, timeout, request.data))
            if request.get_method() == "POST":
                return FakeResponse({"code": 200, "data": {"id": "pred-1", "status": "created"}})
            if request.full_url.endswith("/prediction/pred-1"):
                return FakeResponse(
                    {
                        "code": 200,
                        "data": {
                            "id": "pred-1",
                            "status": "completed",
                            "outputs": ["https://media.example/result.png"],
                        },
                    }
                )
            return FakeResponse(b"image-bytes")

        with tempfile.TemporaryDirectory() as directory, patch.dict(
            os.environ, {"ATLASCLOUD_API_KEY": "test-key"}
        ):
            output = Path(directory) / "result.png"
            generate_image(
                "A clean editorial thumbnail",
                str(output),
                api_base="https://api.example",
                opener=opener,
                sleeper=lambda _seconds: None,
            )

            self.assertEqual(output.read_bytes(), b"image-bytes")

        self.assertEqual(sum(method == "POST" for method, *_rest in calls), 1)
        post_call = next(call for call in calls if call[0] == "POST")
        self.assertEqual(post_call[1], "https://api.example/api/v1/model/generateImage")
        payload = json.loads(next(data for method, *_middle, data in calls if method == "POST"))
        self.assertEqual(payload["model"], "google/nano-banana-2-lite/text-to-image-developer")
        self.assertFalse(payload["enable_sync_mode"])

    def test_api_error_is_not_retried(self):
        calls = []

        def opener(request, timeout):
            calls.append((request.get_method(), request.full_url, timeout))
            return FakeResponse({"code": 400, "message": "invalid prompt"})

        with patch.dict(os.environ, {"ATLASCLOUD_API_KEY": "test-key"}):
            with self.assertRaisesRegex(AtlasAPIError, "invalid prompt"):
                generate_image(
                    "prompt",
                    "unused.png",
                    api_base="https://api.example",
                    opener=opener,
                )

        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], "POST")


if __name__ == "__main__":
    unittest.main()
