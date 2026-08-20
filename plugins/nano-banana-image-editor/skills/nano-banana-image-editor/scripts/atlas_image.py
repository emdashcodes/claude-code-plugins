#!/usr/bin/env python3.12
"""Atlas Cloud text-to-image client used by the image creator."""

import json
import os
import sys
import tempfile
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DEFAULT_API_BASE = "https://api.atlascloud.ai"
DEFAULT_MODEL = "google/nano-banana-2-lite/text-to-image-developer"
USER_AGENT = "nano-banana-image-editor/atlas-provider"
TERMINAL_FAILURES = {"failed", "timeout", "cancelled", "canceled"}


class AtlasAPIError(RuntimeError):
    """Raised when Atlas Cloud rejects or cannot complete a prediction."""


def _api_key() -> str:
    key = os.environ.get("ATLASCLOUD_API_KEY", "").strip()
    if not key:
        raise AtlasAPIError(
            "ATLASCLOUD_API_KEY is not set. Export an Atlas Cloud API key before "
            "using --provider atlas."
        )
    return key


def _request_json(method, url, api_key, payload=None, opener=urlopen):
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": USER_AGENT,
    }
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode("utf-8")

    request = Request(url, data=body, headers=headers, method=method)
    try:
        with opener(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise AtlasAPIError(f"Atlas Cloud returned HTTP {exc.code}: {detail}") from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise AtlasAPIError(f"Atlas Cloud request failed: {exc}") from exc


def _prediction_data(response):
    code = response.get("code")
    if code not in (None, 0, 200):
        raise AtlasAPIError(
            response.get("message") or response.get("msg") or f"Atlas Cloud error code {code}"
        )
    data = response.get("data")
    if not isinstance(data, dict):
        raise AtlasAPIError("Atlas Cloud response did not include prediction data")
    return data


def _download(url, output_path, opener=urlopen):
    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    temp_path = None
    try:
        with opener(request, timeout=60) as response:
            with tempfile.NamedTemporaryFile(
                dir=output.parent, prefix=f".{output.name}.", suffix=".part", delete=False
            ) as temp_file:
                temp_path = Path(temp_file.name)
                temp_file.write(response.read())
                temp_file.flush()
                os.fsync(temp_file.fileno())
        temp_path.replace(output)
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
        raise AtlasAPIError(f"Could not download the generated image: {exc}") from exc


def generate_image(
    prompt: str,
    output_path: str,
    aspect_ratio: str = "1:1",
    thinking_level: str = "default",
    max_wait: float = 180.0,
    api_base: str = None,
    opener=urlopen,
    sleeper=time.sleep,
    clock=time.monotonic,
):
    """Submit one Atlas prediction, poll it with bounded backoff, and save its image."""
    api_key = _api_key()
    base = (api_base or os.environ.get("ATLASCLOUD_BASE_URL") or DEFAULT_API_BASE).rstrip("/")
    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "thinking_level": thinking_level,
        "resolution": "1k",
        "enable_sync_mode": False,
        "enable_base64_output": False,
    }

    # Generation is intentionally submitted once. Only prediction GETs are repeated.
    response = _request_json(
        "POST", f"{base}/api/v1/model/generateImage", api_key, payload, opener
    )
    data = _prediction_data(response)
    prediction_id = data.get("id")
    deadline = clock() + max_wait
    delay = 1.0

    while not data.get("outputs"):
        status = str(data.get("status", "")).lower()
        if status in TERMINAL_FAILURES:
            raise AtlasAPIError(data.get("error") or f"Prediction ended with status {status}")
        if not prediction_id:
            raise AtlasAPIError("Atlas Cloud response did not include a prediction id")
        remaining = deadline - clock()
        if remaining <= 0:
            raise AtlasAPIError(f"Prediction {prediction_id} did not finish within {max_wait:g}s")

        sleeper(min(delay, remaining))
        response = _request_json(
            "GET",
            f"{base}/api/v1/model/prediction/{quote(str(prediction_id), safe='')}",
            api_key,
            opener=opener,
        )
        data = _prediction_data(response)
        delay = min(delay * 1.5, 10.0)

    _download(data["outputs"][0], output_path, opener)
    print(f"Image saved to: {output_path}")


if __name__ == "__main__":
    print("Use create_image.py --provider atlas to run this client.", file=sys.stderr)
