#!/usr/bin/env python3
"""
Video Toolkit API Key Setup Script

Usage:
    python setup_api_keys.py gemini <api_key>
    python setup_api_keys.py shazam <api_key>

Get your API keys from:
- Gemini: https://aistudio.google.com/app/apikey
- Shazam: https://rapidapi.com/apidojo/api/shazam
"""

import sys
import json
import requests
from pathlib import Path


def test_gemini_api_key(api_key: str) -> dict:
    """Test the Gemini API key by fetching the list of available models."""
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


def test_shazam_api_key(api_key: str) -> bool:
    """Test the Shazam/RapidAPI key with a simple request."""
    # Note: This is a minimal test - actual usage will be in identify_music.py
    print("Note: Shazam API key validation will occur during first use")
    print("Make sure your RapidAPI key has access to the Shazam API")
    return True


def save_config(service: str, api_key: str):
    """Save the API key to the plugin config file."""
    # Config file is in the emdashcodes directory (4 levels up from scripts/)
    config_path = Path(__file__).parent.parent.parent.parent / ".video-toolkit-config.json"

    # Read existing config if it exists
    config = {}
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError:
            print("Warning: Could not parse existing config, creating new one", file=sys.stderr)

    # Update API key for the specified service
    if service not in config:
        config[service] = {}
    config[service]['apiKey'] = api_key

    # Write config back
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    return config_path


def main():
    if len(sys.argv) != 3:
        print("Error: Invalid arguments\n", file=sys.stderr)
        print("Usage:", file=sys.stderr)
        print("  python setup_api_keys.py gemini <api_key>", file=sys.stderr)
        print("  python setup_api_keys.py shazam <api_key>", file=sys.stderr)
        print("\nGet your API keys from:", file=sys.stderr)
        print("- Gemini: https://aistudio.google.com/app/apikey", file=sys.stderr)
        print("- Shazam: https://rapidapi.com/apidojo/api/shazam", file=sys.stderr)
        sys.exit(1)

    service = sys.argv[1].lower()
    api_key = sys.argv[2]

    if service not in ['gemini', 'shazam']:
        print(f"Error: Unknown service '{service}'", file=sys.stderr)
        print("Supported services: gemini, shazam", file=sys.stderr)
        sys.exit(1)

    print(f"Setting up {service.capitalize()} API key...")

    # Test the API key
    if service == 'gemini':
        # Validate Gemini API key format
        if not api_key.startswith('AIza'):
            print("Warning: Gemini API key should typically start with 'AIza'", file=sys.stderr)

        print("Testing Gemini API key...")
        response = test_gemini_api_key(api_key)

        if 'error' in response:
            print(f"Error: Gemini API error: {response['error'].get('message', 'Unknown error')}", file=sys.stderr)
            sys.exit(1)

        if 'models' not in response or not isinstance(response['models'], list):
            print("Error: Invalid response from Gemini API", file=sys.stderr)
            print(f"Response: {response}", file=sys.stderr)
            sys.exit(1)

        # Save to config
        config_path = save_config(service, api_key)

        print("\nSuccess! Gemini API key saved to config.")
        print(f"Found {len(response['models'])} available models")

        # Find audio-capable models
        audio_models = [m for m in response['models'] if 'gemini' in m.get('name', '').lower()]
        if audio_models:
            print(f"Available Gemini models: {len(audio_models)}")

    elif service == 'shazam':
        # For Shazam/RapidAPI, just save it (we'll test on first use)
        test_shazam_api_key(api_key)
        config_path = save_config(service, api_key)

        print("\nSuccess! Shazam/RapidAPI key saved to config.")
        print("The key will be validated when you first use music identification.")

    print(f"\nConfig saved at: {config_path}")


if __name__ == "__main__":
    main()
