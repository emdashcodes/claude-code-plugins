#!/usr/bin/env bash
# Ada Memory Plugin Installation Script
# Installs Node.js dependencies required for the plugin

set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing ada-memory plugin dependencies..."
cd "$PLUGIN_DIR"
npm install

echo "✓ Dependencies installed successfully"
echo "You can now use the ada-memory plugin"
