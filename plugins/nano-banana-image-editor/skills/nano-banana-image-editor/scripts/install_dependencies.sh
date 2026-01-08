#!/bin/bash
# Install required dependencies for Gemini Image Editor skill

# Check Python version
PYTHON_CMD="python3.12"

if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "❌ Error: Python 3.12 not found!"
    echo ""
    echo "This skill requires Python 3.10 or higher."
    echo "Python 3.12 is recommended for full feature support."
    echo ""
    echo "To install Python 3.12 on macOS:"
    echo "  brew install python@3.12"
    echo ""
    echo "For other systems, visit: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo "✓ Using Python $PYTHON_VERSION"
echo ""

# Virtual environment path
# Override with NANO_BANANA_VENV env var for multi-platform support (e.g., Docker containers)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${NANO_BANANA_VENV:-$SCRIPT_DIR/../.venv}"

# Check if venv already exists
if [ -d "$VENV_DIR" ]; then
    echo "✓ Virtual environment already exists at $VENV_DIR"
else
    echo "Creating virtual environment at $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
    echo "✓ Virtual environment created"
fi

echo ""
echo "Installing google-genai SDK (latest version with full Gemini 3 Pro Image support)..."
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install google-genai Pillow

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Virtual environment location: $VENV_DIR"
echo "Python interpreter: $VENV_DIR/bin/python3"
echo ""
echo "Next step: Configure your Gemini API key"
echo "Run: $VENV_DIR/bin/python3 ${BASH_SOURCE%/*}/setup-gemini-token.py YOUR_API_KEY"
echo ""
echo "Get your API key from: https://aistudio.google.com/app/apikey"
