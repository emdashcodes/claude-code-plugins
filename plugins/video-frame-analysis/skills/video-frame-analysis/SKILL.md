---
name: video-frame-analysis
description: Extract, analyze, and categorize frames from video files to identify slides, demos, code examples, and other meaningful content. Use this skill when users request frame extraction from videos, need to analyze presentation recordings, want to extract slides/screenshots from demos, or need to filter video content by type (slides vs presenter shots vs UI demos).
allowed-tools: Read, Write, Bash
---

# Video Frame Analysis

## Overview

Extract and analyze frames from video files to identify and organize meaningful content like presentation slides, UI demonstrations, and code examples. Filter out extraneous content (presenter shots, audience views) and generate structured documentation with categorized assets.

## When to Use This Skill

Use this skill when users request:

- "Extract slides from this presentation video"
- "Get screenshots of the demo from 1:13:00 onwards"
- "Find scene changes and filter out audience shots"
- "Extract meaningful frames from this meetup recording"
- "Analyze video frames and categorize them"
- "Create documentation from presentation video with images"

## Workflow Overview

The typical workflow follows these steps:

1. **Extract frames** using scene detection or timestamp sampling
2. **Analyze frames** using multimodal capabilities to identify content type
3. **Categorize and filter** based on user requirements
4. **Organize assets** into meaningful directories
5. **Generate documentation** with embedded images and timestamps

## Frame Extraction Methods

### Method 1: Scene Change Detection (Recommended for Presentations)

Extract frames automatically at visual transitions using `scripts/extract_scene_changes.py`.

**When to use:**
- Presentations with slide transitions
- Demos with distinct interface changes
- Any video where content changes at visual boundaries

**Basic usage:**

```bash
python scripts/extract_scene_changes.py video.mp4 -o ./frames
```

**With timestamp range (common for long videos):**

```bash
# Extract from 1:13:00 to end
python scripts/extract_scene_changes.py video.mp4 -o ./frames --start 1:13:00

# Extract specific segment
python scripts/extract_scene_changes.py video.mp4 -o ./frames --start 1:13:00 --end 1:30:00
```

**Adjusting sensitivity:**

```bash
# More sensitive (more frames) - good for screencasts
python scripts/extract_scene_changes.py video.mp4 -o ./frames --threshold 0.2

# Less sensitive (fewer frames) - good for talks
python scripts/extract_scene_changes.py video.mp4 -o ./frames --threshold 0.5
```

**Limiting output:**

```bash
# Extract max 50 frames
python scripts/extract_scene_changes.py video.mp4 -o ./frames --max-frames 50
```

See `references/ffmpeg-scene-detection.md` for detailed guidance on threshold selection.

### Method 2: Interval-Based Sampling

Extract frames at regular intervals using `scripts/extract_at_timestamps.py`.

**When to use:**
- Systematic sampling of long videos
- Uniform coverage needed
- Scene detection produces too many/few frames

**Basic usage:**

```bash
# One frame every 30 seconds
python scripts/extract_at_timestamps.py video.mp4 -o ./frames --interval 30

# One frame every 2 minutes (120 seconds)
python scripts/extract_at_timestamps.py video.mp4 -o ./frames --interval 120
```

**With timestamp range:**

```bash
# Sample from 1:13:00 for 10 minutes (600 seconds), one per minute
python scripts/extract_at_timestamps.py video.mp4 -o ./frames \
  --start 1:13:00 --duration 600 --interval 60
```

### Method 3: Specific Timestamps

Extract frames at exact timestamps when you know specific moments to capture.

**When to use:**
- User specifies exact timestamps
- Extracting specific moments based on transcript analysis
- Following up after initial analysis

**Usage:**

```bash
# Extract at multiple specific times
python scripts/extract_at_timestamps.py video.mp4 -o ./frames \
  --timestamps 1:13:00 1:15:30 1:20:00 1:25:45
```

## Frame Analysis and Categorization

After extracting frames, analyze them using multimodal capabilities to categorize content.

### Analysis Workflow

1. **Read extracted frames** using the Read tool
2. **Categorize each frame** based on content type
3. **Filter according to user needs**
4. **Organize into directories**

### Content Categories

Refer to `references/frame-categorization-guide.md` for comprehensive categorization patterns. Key categories:

**High-Value Content (Usually Keep):**
- **Presentation slides** - Text on solid backgrounds, diagrams, charts
- **Demo screenshots** - Application UIs, dashboards, admin panels
- **Code/Terminal** - Code editors, terminal sessions, syntax highlighting
- **Screen shares** - Shared content in video calls

**Extraneous Content (Usually Filter):**
- **Presenter shots** - Speaker at podium, talking head
- **Audience shots** - Crowd views, backs of heads
- **Video call participants** - Gallery view faces (not screen shares)
- **Transition frames** - Blurry or partial content mid-transition

### Categorization Process

When analyzing frames, follow the decision tree in `references/frame-categorization-guide.md`:

1. **Check for human faces**: If prominent → likely presenter/audience (LOW value)
2. **Check for text/slides**: Structured text → presentation slide (HIGH value)
3. **Check for UI elements**: Menus, forms, buttons → demo screenshot (HIGH value)
4. **Check for code**: Monospace font, syntax highlighting → code example (MEDIUM-HIGH value)
5. **Check for video call UI**: Zoom/Meet grid → assess if screen share (VARIES)

### Example Analysis

```
Frame 1: Presenter speaking at podium → Category: Presenter → Filter: OUT
Frame 2: "AI Features Overview" slide with 4 bullet points → Category: Slide → Filter: KEEP
Frame 3: WooCommerce admin dashboard → Category: Demo → Filter: KEEP
Frame 4: Product editing with AI sidebar → Category: Demo → Filter: KEEP
Frame 5: Audience view from behind → Category: Audience → Filter: OUT
```

## Organizing Filtered Assets

After categorization, keep only meaningful assets with descriptive naming. Delete extraneous frames.

### Directory Structure

Keep it flat - all meaningful assets in a single directory:

```
output/
├── slide-[description].png
├── demo-[description].png
├── code-[description].png
└── README.md
```

### Naming Convention

Use descriptive names that indicate content type:

```
slide-ai-features-overview.png
demo-dashboard-widgets.png
demo-product-editing-ai-chat.png
code-git-commit-example.png
```

### Filtering Files

```bash
# Copy meaningful frames with descriptive names
cp frames/frame_0003.png output/slide-ai-features.png
cp frames/frame_0005.png output/demo-dashboard.png

# Delete extraneous frames
rm frames/frame_0001.png frames/frame_0008.png
```

## Generating Documentation

Create a markdown index documenting the extracted and categorized frames.

### Documentation Structure

```markdown
# [Video Title] - Frame Analysis

**Video:** [filename]
**Segment:** [timestamp range]
**Total Frames Extracted:** [count]
**Meaningful Assets:** [count]

---

## 📊 Presentation Slides

### [Slide Title]
**File:** `[filename].png`
**Approximate Time:** ~[timestamp]

![Alt text]([filename].png)

**Content:**
- Key point 1
- Key point 2

---

## 💻 Demo Screenshots

### [Demo Description]
**File:** `[filename].png`
**Approximate Time:** ~[timestamp]

![Alt text]([filename].png)

**Content:**
- What's shown in the screenshot
- Key UI elements
```

### Embedding Images

Always embed images in the markdown using relative paths:

```markdown
![Description](slide-name.png)
```

### Documenting Timestamps

Include approximate timestamps for each frame to help locate content in the original video:

```markdown
**Approximate Time:** ~1:14:30
```

Timestamps are approximate because scene detection captures frames at visual changes, not exact times.

## Complete Example Workflow

User request: "Extract meaningful content from my presentation video from 1:13:00 onwards, filtering out presenter and audience shots"

**Step 1: Extract frames**

```bash
python scripts/extract_scene_changes.py \
  presentation.mp4 \
  -o ./frames-analysis/raw \
  --start 1:13:00 \
  --threshold 0.3 \
  --max-frames 50
```

**Step 2: Analyze frames**

Read several frames to sample the content:

```
Read frames-analysis/raw/frame_0001.png
Read frames-analysis/raw/frame_0003.png
Read frames-analysis/raw/frame_0005.png
...
```

**Step 3: Categorize**

Based on multimodal analysis:
- frame_0001: Presenter shot → LOW value
- frame_0003: Slide with features → HIGH value
- frame_0005: Dashboard UI → HIGH value
- etc.

**Step 4: Organize assets**

```bash
# Copy meaningful frames with descriptive names
cp frames-analysis/raw/frame_0003.png frames-analysis/slide-ai-features.png
cp frames-analysis/raw/frame_0005.png frames-analysis/demo-dashboard.png

# Delete extraneous and raw frames
rm -rf frames-analysis/raw
```

**Step 5: Generate documentation**

Create `frames-analysis/README.md` with embedded images, descriptions, and timestamps.

## Tips and Best Practices

### Threshold Selection

- **Presentations/slides:** 0.3-0.4 (balanced)
- **Talks/interviews:** 0.4-0.6 (less sensitive)
- **Screencasts:** 0.2-0.3 (more sensitive)
- **Dynamic content:** 0.5-0.7 (very conservative)

See `references/ffmpeg-scene-detection.md` for detailed guidance.

### Batch Analysis

When analyzing many frames, read them in batches:

```
Read frame_0001.png frame_0005.png frame_0010.png frame_0015.png
```

This provides sampling to understand content patterns before analyzing all frames.

### Filtering Strategy

Ask the user about filtering preferences:
- **Conservative:** Keep most frames, filter only obvious extraneous content
- **Balanced:** Keep technical content (slides, demos, code)
- **Aggressive:** Keep only unique high-value frames

### Handling Duplicates

Near-duplicate frames (same slide with slight changes):
- Keep first occurrence
- Note in documentation if multiple frames show same content
- Consider filtering subsequent duplicates

### Working with Long Videos

For videos over 30 minutes:
1. Confirm timestamp range with user
2. Use scene detection with max-frames limit
3. Sample extracted frames before analyzing all
4. Consider interval-based extraction for systematic coverage

## Troubleshooting

### Too Many Frames Extracted

- Increase threshold (0.4-0.6)
- Use --max-frames to cap output
- Consider interval-based extraction instead

### Too Few Frames Extracted

- Decrease threshold (0.2-0.3)
- Check if video has actual scene changes
- Try interval-based extraction

### ffmpeg Not Found

```bash
# Install ffmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Permission Errors

Ensure scripts are executable:

```bash
chmod +x scripts/*.py
```

## Related Skills

- **audio-transcription**: Transcribe audio from same video files
- Combine both skills to create comprehensive video documentation (transcript + frames)
