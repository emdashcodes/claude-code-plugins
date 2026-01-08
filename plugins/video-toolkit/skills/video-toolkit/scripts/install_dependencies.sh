#!/usr/bin/env bash

# install_dependencies.sh
# Install dependencies for video-toolkit skill
# Usage: bash install_dependencies.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SKILL_DIR/.venv"

echo "🎬 video-toolkit dependency installer"
echo "======================================"
echo

# Check for FFmpeg
echo "Checking for FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    echo "✓ FFmpeg found: $FFMPEG_VERSION"
else
    echo "✗ FFmpeg not found"
    echo
    echo "Please install FFmpeg:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install ffmpeg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  sudo apt install ffmpeg  # Debian/Ubuntu"
        echo "  sudo yum install ffmpeg  # RHEL/CentOS"
    fi
    echo
    read -p "Continue without FFmpeg? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for Python 3.12
echo
echo "Checking for Python..."
if command -v python3.12 &> /dev/null; then
    PYTHON_VERSION=$(python3.12 --version)
    PYTHON_CMD="python3.12"
    echo "✓ Python 3.12 found: $PYTHON_VERSION"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    PYTHON_CMD="python3"
    echo "⚠️  Python 3.12 not found, using: $PYTHON_VERSION"
    echo "   (Recommended: Install Python 3.12 for consistency with other plugins)"
else
    echo "✗ Python 3 not found"
    echo "Please install Python 3.12 or higher"
    exit 1
fi

# Create virtual environment
echo
echo "Setting up Python virtual environment with $PYTHON_CMD..."
if [ -d "$VENV_DIR" ]; then
    echo "Virtual environment already exists at $VENV_DIR"
    read -p "Recreate virtual environment? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing virtual environment..."
        rm -rf "$VENV_DIR"
        $PYTHON_CMD -m venv "$VENV_DIR"
        echo "✓ Virtual environment created with $PYTHON_CMD"
    else
        echo "Using existing virtual environment"
    fi
else
    $PYTHON_CMD -m venv "$VENV_DIR"
    echo "✓ Virtual environment created with $PYTHON_CMD"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo
echo "Upgrading pip..."
pip install --quiet --upgrade pip
echo "✓ pip upgraded"

# Install OpenAI Whisper
echo
echo "Installing OpenAI Whisper..."
echo "(This may take a few minutes on first install)"
pip install --quiet openai-whisper
echo "✓ Whisper installed"

# Install additional dependencies
echo
echo "Installing additional dependencies..."
pip install --quiet numpy
echo "✓ numpy installed"

# Install Google Gemini API (for audio analysis)
echo
echo "Installing Google Gemini API..."
pip install --quiet google-genai requests
echo "✓ google-genai installed"

# Install Shazam API (for music identification)
echo
echo "Installing Shazam API (shazamio)..."
pip install --quiet shazamio
echo "✓ shazamio installed"

# Test Whisper import
echo
echo "Testing Whisper installation..."
python3 -c "import whisper; print('✓ Whisper import successful')"

# Download base model (optional but recommended)
echo
read -p "Download Whisper base model now? (recommended, ~140MB) (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "Downloading Whisper base model..."
    python3 -c "import whisper; whisper.load_model('base')"
    echo "✓ Base model downloaded"
fi

# Deactivate virtual environment
deactivate

echo
echo "======================================"
echo "✓ Installation complete!"
echo
echo "Dependencies installed:"
echo "  - FFmpeg (system)"
echo "  - Python virtual environment: $VENV_DIR"
echo "  - OpenAI Whisper (in venv)"
echo "  - Google Gemini API (in venv)"
echo "  - Shazam API / shazamio (in venv)"
echo
echo "Next steps:"
echo "  1. Set up Gemini API key (for audio analysis):"
echo "     $VENV_DIR/bin/python3 $SCRIPT_DIR/setup_api_keys.py gemini YOUR_API_KEY"
echo
echo "  2. Set up Shazam/RapidAPI key (for music identification):"
echo "     $VENV_DIR/bin/python3 $SCRIPT_DIR/setup_api_keys.py shazam YOUR_RAPIDAPI_KEY"
echo
echo "Get API keys from:"
echo "  - Gemini: https://aistudio.google.com/app/apikey"
echo "  - Shazam: https://rapidapi.com/apidojo/api/shazam"
echo
echo "To use the scripts, they will automatically activate the venv"
echo "======================================"
