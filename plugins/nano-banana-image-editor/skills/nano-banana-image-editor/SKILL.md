---
name: nano-banana-image-editor
description: Edit and manipulate images using Google's Gemini 2.5 Flash Image model ("Nano Banana") via natural language prompts. Use this skill when users requests that you create a new image (images, photos, illustrations, icons) or for image editing tasks like removing objects, changing backgrounds, adding/removing text overlays, or cropping speaker windows.
---

# Image Editor

This skill enables AI-powered image editing and creation using **Google's Gemini 2.5 Flash Image** model (nicknamed "Nano Banana"). It allows editing existing images OR creating new images from scratch through natural language instructions.

## When to Use This Skill

Use this skill when users request:

- Generate images and illustrations
- Generate icons from scratch (no input image needed)
- Generate graphics for diagrams and charts
- Removing text, logos, or watermarks from images
- Removing speaker overlays or video conference windows from slides
- Changing backgrounds, objects, or colors
- Cropping, resizing, or adjusting image composition
- Adding or modifying visual elements
- Style transfers or artistic transformations
- Any image manipulation describable in natural language

## Prerequisites

Before using this skill for the first time, install dependencies:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/install_dependencies.sh
```

**API Key Setup:**
Users must have a `GEMINI_API_KEY` environment variable set. If not already configured:

1. Get an API key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. **Securely store the key** in your shell configuration for permanent access:

   For **zsh** (default on macOS):

   ```bash
   echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

   For **bash**:

   ```bash
   echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.bashrc
   source ~/.bashrc
   ```

   Or for **current session only** (temporary):

   ```bash
   export GEMINI_API_KEY='your-api-key-here'
   ```

## How to Use

### Creating New Images from Scratch (Recommended for Icons)


```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  OUTPUT_IMAGE "creation instruction" --width 256 --height 256
```

**Prompting Tips:**

- Be specific about colors, style, and composition

### Editing Existing Images

Use the `edit_image.py` script to edit existing images with natural language prompts:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  INPUT_IMAGE OUTPUT_IMAGE "editing instruction"
```

**Example: Remove text overlay**

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  slide.png slide-cleaned.png \
  "Remove the 'OG' and 'OD' text labels from the top of this diagram"
```

**Example: Remove speaker window**

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  presentation.png presentation-clean.png \
  "Remove the speaker video overlay from the bottom right corner"
```

**Example: Background removal**

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  photo.jpg photo-no-bg.png \
  "Remove the background and make it transparent white"
```

### Custom Dimensions

Specify output dimensions with `--width` and `--height`:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  input.png output.png "your prompt" --width 1920 --height 1080
```

## Workflow

1. **Identify the editing task** - Understand what changes the user wants
2. **Check for API key** - Verify `GEMINI_API_KEY` is set (check with `echo $GEMINI_API_KEY`) if you run into authentication issues.
3. **Prepare the prompt** - Translate the user's request into a clear, specific natural language instruction
4. **Run the script** - Execute `edit_image.py` with appropriate parameters
5. **Review the output** - Check if the edit meets expectations; iterate if needed

## Tips for Effective Prompts

- **Be specific**: "Remove the red text in the top-left corner" is better than "clean up the image"
- **Describe desired outcome**: "Replace the blue background with white" vs just "change background"
- **Iterative editing**: Make one change at a time for better results
- **Reference locations**: Use "top left", "bottom right", "center" to specify areas

## Model Capabilities

**Gemini 2.5 Flash Image supports:**

- Object removal and addition
- Background changes and removal
- Text overlay removal/addition
- Color adjustments
- Style transfers
- Multi-image blending
- Character/subject consistency across edits
- High-resolution output (up to 4K)

**Supported formats:** PNG, JPEG, WebP
**Maximum file size:** 7 MB per image
**Maximum images per prompt:** 3

## Troubleshooting

**"GEMINI_API_KEY not set" error:**

- Set the environment variable: `export GEMINI_API_KEY='your-key'`

**"No image in response" message:**

- The model may have returned text instead of an edited image
- Try rephrasing the prompt more specifically
- Check API rate limits or quota

**Poor edit quality:**

- Be more specific in the prompt
- Try breaking complex edits into multiple steps
- Ensure input image quality is sufficient

## Non-AI Alternatives for Quick Edits

For simple, deterministic image operations, you can also use **PIL/Pillow** (Python) instead of the AI model. This is faster, free, and more predictable for basic tasks:

### Quick Crop Script (Recommended)

Use the included `quick_crop.py` script for fast, precise cropping:

```bash
# Remove 100px from the right edge
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
  input.png output.png --remove-right 100

# Exact crop box
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
  input.png output.png --left 0 --top 0 --right 1200 --bottom 800

# Remove pixels from bottom
python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
  input.png output.png --remove-bottom 50
```

### Manual PIL/Pillow Code

For custom operations, use PIL directly:

```python
from PIL import Image

img = Image.open('input.png')
# Crop: (left, top, right, bottom)
cropped = img.crop((0, 0, img.size[0] - 100, img.size[1]))  # Remove 100px from right
cropped.save('output.png')
```

### Resizing

```python
from PIL import Image

img = Image.open('input.png')
resized = img.resize((1920, 1080))
resized.save('output.png')
```

### Rotating

```python
from PIL import Image

img = Image.open('input.png')
rotated = img.rotate(90, expand=True)
rotated.save('output.png')
```

### When to Use Each Approach

**Use AI (Gemini):**

- Removing specific objects or text overlays (content-aware)
- Changing backgrounds or adding elements
- Style transfers or artistic modifications
- Complex edits requiring semantic understanding

**Use PIL/Pillow:**

- Simple cropping with exact pixel dimensions
- Resizing or rotating images
- Format conversions (PNG → JPG, etc.)
- Basic operations where precision matters more than AI understanding
- When you want free, instant, deterministic results

## References

For more detailed API documentation, see:

- `references/api_reference.md` - Detailed API capabilities and parameters
- [Google AI Studio](https://ai.google.dev/) - Web interface for testing
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs) - Official documentation
- [Pillow Documentation](https://pillow.readthedocs.io/) - PIL/Pillow for non-AI image operations
