# Hand-Drawn Fonts Guide

The skill includes multiple hand-drawn fonts to give your graphics different personalities:

## Available Fonts

- **Indie Flower** - Flowing, friendly handwriting - great for general use
- **Permanent Marker** - Bold, marker-like style - perfect for emphasis and headers
- **Amatic SC** - Narrow, elegant handwriting - ideal for sophisticated designs
- **Kalam** - Pen-drawn feel - works well for technical but warm graphics

## Usage in Commands

```json
{
  "type": "text",
  "text": "Bold Header",
  "x": 100,
  "y": 50,
  "font": "bold 28px 'Permanent Marker'",
  "color": "#000000"
}
```

## Font Installation

Fonts are automatically installed via the `setup-fonts.sh` script during skill setup. If you encounter font-related errors, run:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/
./setup-fonts.sh
```
