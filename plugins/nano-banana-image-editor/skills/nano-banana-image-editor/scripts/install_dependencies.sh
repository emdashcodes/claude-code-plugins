#!/bin/bash
# Install required dependencies for Gemini Image Editor skill

echo "Installing google-generativeai SDK..."
pip3 install -U google-generativeai

echo "✅ Dependencies installed successfully!"
echo ""
echo "Next step: Set your GEMINI_API_KEY environment variable"
echo "Get your API key from: https://ai.google.dev/gemini-api/docs/api-key"
echo ""
echo "Example:"
echo "  export GEMINI_API_KEY='your-api-key-here'"
