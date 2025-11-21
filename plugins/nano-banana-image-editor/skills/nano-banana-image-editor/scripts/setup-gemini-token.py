#!/usr/bin/env python3.12
"""
Google Gemini API Key Setup Script

Usage:
    python setup-gemini-token.py <api_key>

Get your API key from: https://aistudio.google.com/app/apikey
"""

import sys
import json
import requests
from pathlib import Path


def test_api_key(api_key: str) -> dict:
    """Test the API key by fetching the list of available models."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    try:
        response = requests.get(url, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code in [401, 403]:
            print("Error: Authentication failed", file=sys.stderr)
            print("\nPlease check that:", file=sys.stderr)
            print("1. Your API key is correct", file=sys.stderr)
            print("2. The Gemini API is enabled for your project", file=sys.stderr)
            print("3. You have not exceeded your quota", file=sys.stderr)
        else:
            print(f"Error: HTTP error: {e}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Error: Request error: {e}", file=sys.stderr)
        sys.exit(1)


def save_config(api_key: str):
    """Save the API key to the plugin config file."""
    # Config file is in plugin root (3 levels up from scripts/)
    config_path = Path(__file__).parent.parent.parent.parent / ".nano-banana-config.json"

    # Read existing config if it exists
    config = {}
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError:
            print("Warning: Could not parse existing config, creating new one", file=sys.stderr)

    # Update Gemini API key
    if 'gemini' not in config:
        config['gemini'] = {}
    config['gemini']['apiKey'] = api_key

    # Write config back
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    return config_path


def main():
    if len(sys.argv) != 2:
        print("Error: Missing API key\n", file=sys.stderr)
        print("Usage: python setup-gemini-token.py <api_key>", file=sys.stderr)
        print("\nGet your API key from: https://aistudio.google.com/app/apikey", file=sys.stderr)
        sys.exit(1)

    api_key = sys.argv[1]

    # Validate API key format
    if not api_key.startswith('AIza'):
        print("Warning: API key should typically start with 'AIza'", file=sys.stderr)

    print("Testing Gemini API key...")

    # Test the API key
    response = test_api_key(api_key)

    if 'error' in response:
        print(f"Error: Gemini API error: {response['error'].get('message', 'Unknown error')}", file=sys.stderr)
        sys.exit(1)

    if 'models' not in response or not isinstance(response['models'], list):
        print("Error: Invalid response from Gemini API", file=sys.stderr)
        print(f"Response: {response}", file=sys.stderr)
        sys.exit(1)

    # Find the Gemini 3 Pro Image model
    image_model = next(
        (m for m in response['models'] if 'gemini-3-pro-image' in m.get('name', '')),
        None
    )

    # Save to config
    config_path = save_config(api_key)

    print("\nSuccess! Gemini API key saved to config.")
    print(f"Found {len(response['models'])} available models")

    if image_model:
        print("Gemini 3 Pro Image model is available")
        print(f"   Model: {image_model['name']}")
    else:
        print("Warning: Gemini 3 Pro Image model not found in available models")
        print("   The image editing features may not work until the model is available")

    print(f"\nConfig saved at: {config_path}")


if __name__ == "__main__":
    main()
