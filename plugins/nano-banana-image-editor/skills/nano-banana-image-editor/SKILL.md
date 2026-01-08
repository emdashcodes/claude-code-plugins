---
name: nano-banana-image-editor
description: Edit and manipulate images using natural language prompts. Use this skill when users request image creation (photos, illustrations, icons, infographics) or editing tasks (removing objects, changing backgrounds, text overlays, cropping). Supports reference images for character consistency and style transfer. Supports Google Search grounding for real-time factual content (weather, sports, scientific data) - no need to search separately when creating infographics or factual visualizations.
---

# Image Editor

This skill enables AI-powered image editing and creation using **Google's Gemini 3 Pro Image** model (nicknamed "Nano Banana Pro"). It allows editing existing images or creating new images from scratch through natural language instructions.

## When to Use This Skill

Use this skill when users request:

- Generate icons, images, and illustrations
- Removing text, logos, or watermarks from images
- Removing speaker overlays or video conference windows from slides
- Changing backgrounds, objects, or colors
- Cropping, resizing, or adjusting image composition
- Adding or modifying visual elements
- Style transfers or artistic transformations
- Any image manipulation describable in natural language

## Prerequisites

If needed, run the following script to install dependencies:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/install_dependencies.sh
```

This creates a Python virtual environment and installs the required packages (google-genai, Pillow).

**Virtual environment location:**
- Default: `${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv/`
- Override: Set `NANO_BANANA_VENV` env var for multi-platform support (e.g., Docker containers)

**API Key Setup:**

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Run the setup script** to save the key to the plugin config:

   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv/bin/${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/setup-gemini-token.py YOUR_API_KEY
   ```

   The script will:
   - Test the API key to verify it works
   - Save it to `.nano-banana-config.json` in the plugin directory
   - Confirm that Gemini 3 Pro Image model is available

All script examples below use `${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3` to ensure the venv's Python interpreter is used.

## How to Use

### Creating New Images from Scratch

Use the `create_image.py` script to generate new images from natural language prompts:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  OUTPUT_IMAGE "creation instruction" --resolution 1K --aspect-ratio 1:1
```

**Example: Create an icon**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  cat-icon.png "A playful orange tabby cat icon, simple and clean design" \
  --resolution 1K --aspect-ratio 1:1
```

**Example: Create a high-resolution illustration**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  sunset.png "A vibrant sunset over mountains with purple and orange sky" \
  --resolution 4K --aspect-ratio 16:9
```

**Example: Create with reference images for style**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  landscape.png "A mountain landscape in this artistic style" \
  --reference style.png --resolution 2K --aspect-ratio 3:2
```

**Prompting Tips:**

- Be specific about colors, style, and composition
- Specify the desired mood or atmosphere
- Use reference images to demonstrate desired style or composition
- **Important**: See `references/prompting_guide.md` for comprehensive prompting strategies

### Editing Existing Images

Use the `edit_image.py` script to edit existing images with natural language prompts:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  INPUT_IMAGE OUTPUT_IMAGE "editing instruction" --resolution 1K --aspect-ratio 1:1
```

**Example: Remove text overlay**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  slide.png slide-cleaned.png \
  "Remove the text labels from the top of this diagram"
```

**Example: Background removal with high resolution**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  photo.jpg photo-no-bg.png \
  "Remove the background and make it transparent white" \
  --resolution 2K --aspect-ratio 4:3
```

**Example: Style transfer with reference image**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  photo.jpg artistic.png \
  "Apply the artistic style from the reference to this photo" \
  --reference style.png --resolution 2K
```

### Advanced Multi-Image Features

#### Recreating Templates with Different Characters

**Important**: When recreating memes, comics, or templates with different characters, **always pass both the template AND the character references**.

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  output.png "Recreate this meme template using these characters" \
  --reference template.png --reference character1.png --reference character2.png \
  --resolution 2K --aspect-ratio 16:9
```

**Why both?**

- The **template/meme reference** provides the composition, layout, poses, and panel structure
- The **character references** provide facial features, hairstyles, and distinctive characteristics to maintain

**Example: Recreating a two-panel comic meme**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  my-meme.png "Recreate this two-panel comic using these two women as the characters. Maintain the exact composition and poses from the template." \
  --reference original-meme.png --reference my-characters.png \
  --resolution 2K --aspect-ratio 16:9
```

#### Character Consistency (Up to 5 People)

Create group photos maintaining facial resemblance:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  group.png "Office group photo of these people making funny faces" \
  --reference person1.png --reference person2.png --reference person3.png \
  --resolution 2K --aspect-ratio 5:4
```

#### Object Composition (Up to 6 Objects)

Blend multiple objects with high fidelity:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  product.png "Product showcase featuring these items on a marble surface" \
  --reference item1.png --reference item2.png --reference item3.png \
  --resolution 4K --aspect-ratio 16:9
```

#### Advanced Editing with References

Edit an image while using additional references:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/edit_image.py \
  background.jpg composite.png \
  "Add these people to the scene, natural lighting" \
  --reference person1.png --reference person2.png \
  --resolution 2K
```

### Google Search Grounding

Enable real-time information for factual content:

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  weather.png "An infographic about today's weather in San Francisco" \
  --search --resolution 2K --aspect-ratio 3:4
```

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  plant-guide.png "Create an educational infographic about String of Turtles houseplant care" \
  --search --resolution 2K --aspect-ratio 3:4
```

**When to use `--search`:**

- Weather visualizations and forecasts
- Current events and news graphics
- Scientific diagrams requiring factual accuracy
- Educational infographics about real-world subjects
- Sports statistics and data visualizations

### Resolution and Aspect Ratio Selection

**Resolution Options:**

- `1K` (default) - Fast, good for iteration and testing (1024×1024 at 1:1)
- `2K` - Professional quality (2048×2048 at 1:1)
- `4K` - Maximum quality, studio-grade (4096×4096 at 1:1)

**Common Aspect Ratios:**

- `1:1` - Social media posts, profile pictures, icons
- `16:9` - Presentations, YouTube thumbnails, desktop wallpapers
- `9:16` - Instagram Stories, TikTok, mobile vertical content
- `4:3` - Traditional displays, print media
- `3:2` - Standard photography
- `21:9` - Ultra-wide cinematic shots

**Example with custom resolution and aspect ratio:**

```bash
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  banner.png "A website hero banner with mountains and sunrise" \
  --resolution 4K --aspect-ratio 21:9
```

## Workflow

1. **Identify the task** - Determine if the user wants to create a new image or edit an existing one
2. **Check for dependencies and API key** - If errors occur, verify the API key is configured in the config file and that dependencies are installed
3. **Prepare the prompt** - Translate the user's request into a clear, specific natural language instruction
4. **Run the appropriate script**:
   - Use `create_image.py` for generating new images
   - Use `edit_image.py` for modifying existing images
5. **Review the output** - Check if the result meets expectations; iterate if needed

## Tips for Effective Prompts

- **Be specific**: "Remove the red text in the top-left corner" is better than "clean up the image"
- **Describe desired outcome**: "Replace the blue background with white" vs just "change background"
- **Iterative editing**: Make one change at a time for better results
- **Reference locations**: Use "top left", "bottom right", "center" to specify areas
- **Use reference images**: Provide style examples, object references, or character photos when appropriate
- **Pass ALL relevant references**: When recreating templates/memes with different characters, pass both the template image AND the character images as references
- **Enable search for facts**: Add `--search` when generating content requiring real-time information

**For comprehensive prompting strategies, see `references/prompting_guide.md`**
**For best practices and workflow optimization, see `references/best_practices.md`**

## Model Capabilities

**Gemini 3 Pro Image supports:**

- Object removal and addition with advanced reasoning
- Background changes and removal
- Accurate and legible text rendering in multiple languages
- Color adjustments and advanced color grading
- Studio-quality lighting controls (day/night, bokeh effects)
- Camera angle and focus adjustments
- Style transfers and artistic transformations
- Multi-image blending (up to 14 reference images)
- Character/subject consistency for up to 5 people across edits
- Sketch-to-product and blueprint-to-3D transformations
- Real-time data grounding via Google Search (recipes, weather, sports)
- High-resolution output (2K and 4K with multiple aspect ratios)

## Technical Specifications

**Input Limits:**

- Maximum images per prompt: 14 total
  - Up to 6 images for object fidelity
  - Up to 5 images for character consistency
- Maximum file size: 7 MB per image
- Supported formats: PNG, JPEG, WebP

**Output Specifications:**

- Resolution options: 1K, 2K, 4K
- Supported aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- All generated images include SynthID watermarking

**Resolution Examples:**

- 1K at 1:1 = 1024×1024 pixels
- 2K at 1:1 = 2048×2048 pixels
- 4K at 1:1 = 4096×4096 pixels
- 4K at 16:9 = 5504×3072 pixels
- 4K at 21:9 = 6336×2688 pixels

## Troubleshooting

**"No Gemini API key configured" error:**

- Run the setup script: `${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/setup-gemini-token.py YOUR_API_KEY`

**"No image in response" message:**

- The model may have returned text instead of an edited image
- Try rephrasing the prompt more specifically
- Check API rate limits or quota

**Poor edit quality:**

- Be more specific in the prompt
- Try breaking complex edits into multiple steps
- Ensure input image quality is sufficient

**"MALFORMED_FUNCTION_CALL" error when editing:**

- **Do NOT request watermark removal** - Gemini blocks prompts mentioning "remove watermark" to protect SynthID watermarks
- Avoid prompts like "remove the watermark" or "clean up watermarks"
- This is a content policy restriction, not a technical limitation

**Prompts with dollar signs or special characters getting stripped:**

- **Problem:** Dollar signs (`$3`, `$4.50`) and other bash special characters get removed from prompts
- **Cause:** When using double quotes in bash, `$variable` syntax triggers variable expansion
- **Solutions:**
  - Use single quotes instead of double quotes: `'Espresso $3, Latte $4'`
  - Escape dollar signs with backslash: `"Espresso \\$3, Latte \\$4"`
  - Other special characters to watch: exclamation marks, backticks, backslashes, dollar signs, quotes

**Example:**

```bash
# ❌ Wrong - dollar signs get expanded as variables
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  menu.png "Coffee menu: Espresso $3, Latte $4"

# ✅ Correct - use single quotes
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  menu.png 'Coffee menu: Espresso $3, Latte $4'

# ✅ Also correct - escape the dollar signs
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/create_image.py \
  menu.png "Coffee menu: Espresso \$3, Latte \$4"
```

## Non-AI Alternatives for Quick Edits

For simple, deterministic image operations, you can also use **PIL/Pillow** (Python) instead of the AI model. This is faster, free, and more predictable for basic tasks:

### Quick Crop Script (Recommended)

Use the included `quick_crop.py` script for fast, precise cropping:

```bash
# Remove 100px from the right edge
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
  input.png output.png --remove-right 100

# Exact crop box
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
  input.png output.png --left 0 --top 0 --right 1200 --bottom 800

# Remove pixels from bottom
${NANO_BANANA_VENV:-${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/.venv}/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/nano-banana-image-editor/scripts/quick_crop.py \
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

## References

### Essential Guides

**`references/prompting_guide.md`**

- Photorealistic scenes with photography terminology
- Stylized illustrations and stickers
- Accurate text rendering in images
- Product mockups and commercial photography
- Minimalist and negative space design
- Sequential art (comic panels, storyboards)
- Image editing strategies (adding/removing elements, style transfer, composition)
- Multi-image prompting techniques
- Google Search grounding examples

**`references/best_practices.md`**

- Writing hyper-specific prompts for maximum control
- Iterative refinement through multi-turn conversations
- Step-by-step instructions for complex compositions
- Using photography and camera terminology effectively
- Multiple reference images best practices (character consistency, object fidelity, style transfer)
- Resolution strategy (when to use 1K vs 2K vs 4K)
- Aspect ratio selection for different use cases
- When to use Google Search grounding
- Quality checklist and workflow for complex projects

### External Resources

- [Google AI Studio](https://ai.google.dev/) - Web interface for testing Gemini models
- [Pillow Documentation](https://pillow.readthedocs.io/) - PIL/Pillow for non-AI image operations
