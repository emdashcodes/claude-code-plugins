# Gemini 2.5 Flash Image API Reference

## Model Information

**Model ID:** `gemini-2.5-flash-image`
**Nickname:** "Nano Banana"
**Provider:** Google DeepMind

## Capabilities

### Image Editing Features

- **Object manipulation**: Add, remove, or modify objects in images
- **Background editing**: Change, blur, or remove backgrounds
- **Text overlay management**: Add or remove text from images
- **Color adjustments**: Change colors, apply filters, adjust tones
- **Composition changes**: Crop, resize, reframe images
- **Style transfer**: Apply artistic styles or design patterns
- **Multi-image fusion**: Combine multiple images with natural lighting/shadows
- **Character consistency**: Maintain subject likeness across multiple edits
- **Multi-turn editing**: Iterative refinement while preserving unchanged areas

### Technical Specifications

**Input Limits:**

- Token limit: 65,536 input tokens, 32,768 output tokens
- Maximum images per prompt: 3
- Maximum image size: 7 MB
- Supported formats: PNG, JPEG, WebP

**Output Specifications:**

- Supported aspect ratios: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- Maximum output images: 10 per request
- Resolution: Up to 4K (depending on aspect ratio)
- Includes watermarking and SynthID provenance signatures

## Python SDK Usage

### Installation

```bash
pip install -U google-generativeai
```

Requires Python 3.9 or higher.

### Authentication

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
```

Get your API key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).

### Basic Image Editing

```python
model = genai.GenerativeModel('gemini-2.5-flash-image')

# Upload image
image_file = genai.upload_file('path/to/image.png')

# Edit with natural language
prompt = [
    image_file,
    "Remove the watermark from the top right corner"
]

response = model.generate_content(
    prompt,
    generation_config={
        "temperature": 0.4,
        "max_output_tokens": 32768,
    }
)

# Save edited image
if hasattr(response, 'parts'):
    for part in response.parts:
        if hasattr(part, 'inline_data'):
            with open('edited.png', 'wb') as f:
                f.write(part.inline_data.data)
```

### Configuration Parameters

**generation_config options:**

- `temperature` (0.0-1.0): Controls randomness. Lower = more deterministic. Default: 0.4
- `max_output_tokens`: Maximum tokens in response. Max: 32,768
- `top_p`: Nucleus sampling threshold (0.0-1.0)
- `top_k`: Top-k sampling parameter

## Alternative API Access

### Together.ai API

Together.ai provides an alternative endpoint for Gemini 2.5 Flash Image:

```python
import requests

url = "https://api.together.xyz/v1/images/generations"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "google/flash-image-2.5",
    "prompt": "Edit instruction here",
    "image_url": "https://example.com/image.png",
    "width": 1024,
    "height": 768,
    "steps": 28,
    "n": 1,
    "response_format": "url"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
image_url = result["data"][0]["url"]
```

## Best Practices

### Prompt Engineering

**Good prompts:**

- "Remove the speaker video window from the bottom right corner of this screenshot"
- "Replace the white background with a gradient from blue to purple"
- "Remove all text overlays while keeping the diagram intact"

**Poor prompts:**

- "Clean this up" (too vague)
- "Make it better" (no specific instruction)
- "Fix it" (unclear what needs fixing)

### Iterative Editing

For complex edits, use multiple steps:

1. First edit: "Remove the text overlay"
2. Second edit: "Adjust the brightness"
3. Third edit: "Crop to 16:9 aspect ratio"

This approach gives better results than trying to do everything in one prompt.

### Error Handling

Always check response format:

```python
if hasattr(response, 'parts'):
    # Image data available
    process_image(response.parts)
else:
    # Model returned text (edit failed or clarification needed)
    print(response.text)
```

## Limitations

- **No code execution**: Model cannot execute code or run scripts
- **No function calling**: Cannot invoke external functions/APIs
- **No grounding**: Cannot search web or access real-time data during generation
- **Preview discontinuation**: Preview versions end October 31, 2025

## Additional Resources

- [Google AI Studio](https://ai.google.dev/) - Web interface for testing
- [API Documentation](https://ai.google.dev/gemini-api/docs)
- [Vertex AI Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image)
- [Pricing Page](https://ai.google.dev/gemini-api/docs/pricing)
