# FFmpeg Scene Detection Reference

## Scene Detection Filter

FFmpeg's scene detection filter (`select='gt(scene,threshold)'`) identifies visual changes in video by analyzing differences between consecutive frames.

### How It Works

The scene filter calculates a score (0-1) representing the visual difference between the current frame and the previous frame:

- **0.0** = Identical frames (no change)
- **1.0** = Completely different frames (full scene change)

### Threshold Selection

The threshold determines which frames are considered "scene changes":

```bash
# More sensitive (more frames extracted)
-vf "select='gt(scene,0.1)'"    # Detects subtle changes

# Balanced (good for most content)
-vf "select='gt(scene,0.3)'"    # Default, catches most scene changes

# Less sensitive (fewer frames)
-vf "select='gt(scene,0.5)'"    # Only major scene changes

# Very conservative
-vf "select='gt(scene,0.7)'"    # Only dramatic changes
```

### Choosing the Right Threshold

**For presentation videos (slides/demos):**
- Use **0.3-0.4**: Catches slide transitions and major UI changes
- Slides have clear visual boundaries
- Demo screenshots show distinct interface changes

**For interviews/talks:**
- Use **0.4-0.6**: Filters out minor movement, keeps camera cuts
- Reduces frames of speakers moving/gesturing
- Captures actual shot changes

**For screencasts:**
- Use **0.2-0.3**: Sensitive to interface changes
- Captures window switches, menu opens, dialog boxes
- May need manual filtering afterward

**For action/dynamic content:**
- Use **0.5-0.7**: Only major scene changes
- Filters out motion within scenes
- Focuses on actual scene transitions

### Complete Command Reference

```bash
# Basic scene detection
ffmpeg -i video.mp4 \
  -vf "select='gt(scene,0.3)'" \
  -vsync vfr \
  frame_%04d.png

# With timestamp range
ffmpeg -ss 1:13:00 -to 1:30:00 -i video.mp4 \
  -vf "select='gt(scene,0.3)'" \
  -vsync vfr \
  frame_%04d.png

# Limit number of frames
ffmpeg -ss 1:13:00 -i video.mp4 \
  -vf "select='gt(scene,0.3)'" \
  -vsync vfr \
  -frames:v 50 \
  frame_%04d.png

# Show scene scores in output (for debugging)
ffmpeg -ss 1:13:00 -i video.mp4 \
  -vf "select='gt(scene,0.3)',showinfo" \
  -vsync vfr \
  frame_%04d.png
```

### Key Flags Explained

- **`-vf`**: Video filter (applies scene detection)
- **`-vsync vfr`**: Variable frame rate output (only outputs selected frames)
- **`-frames:v N`**: Limit to N frames maximum
- **`showinfo`**: Print frame info to stderr (includes timestamps and scene scores)
- **`-ss`**: Start time (seeking in input)
- **`-to`**: End time

### Reading Scene Scores

When using `showinfo`, ffmpeg prints frame metadata:

```
[Parsed_showinfo_1 @ 0x...] n:0 pts:... pts_time:73.1 ... scene_score:0.45
```

- **`pts_time`**: Timestamp in seconds from video start
- **`scene_score`**: The actual scene difference score

This helps tune the threshold by showing which frames were selected and their scores.

## Interval-Based Extraction

For systematic sampling instead of scene detection:

```bash
# One frame every 30 seconds
ffmpeg -ss 1:13:00 -i video.mp4 \
  -vf "fps=1/30" \
  frame_%04d.png

# One frame every 2 minutes (120 seconds)
ffmpeg -ss 1:13:00 -i video.mp4 \
  -vf "fps=1/120" \
  frame_%04d.png
```

## Extracting Single Frames at Specific Times

```bash
# Extract frame at 1:13:00
ffmpeg -ss 1:13:00 -i video.mp4 -frames:v 1 frame.png

# Multiple specific timestamps (run separately)
ffmpeg -ss 1:13:00 -i video.mp4 -frames:v 1 frame_1-13-00.png
ffmpeg -ss 1:15:30 -i video.mp4 -frames:v 1 frame_1-15-30.png
ffmpeg -ss 1:20:00 -i video.mp4 -frames:v 1 frame_1-20-00.png
```

## Quality and Format Options

```bash
# High quality PNG (default)
-frames:v 1 output.png

# JPEG with quality control
-frames:v 1 -q:v 2 output.jpg  # 2-5 is high quality

# Different resolutions
-vf "scale=1280:720" output.png  # Resize to 720p
-vf "scale=iw*0.5:ih*0.5" output.png  # 50% of original size
```

## Performance Tips

1. **Use `-ss` before `-i`**: Faster seeking
   ```bash
   # Fast (seek in input)
   ffmpeg -ss 1:13:00 -i video.mp4 ...

   # Slow (decode then seek)
   ffmpeg -i video.mp4 -ss 1:13:00 ...
   ```

2. **Limit extraction range**: Use both `-ss` and `-to` to process only needed segments

3. **Limit max frames**: Use `-frames:v N` to cap output

4. **Test threshold first**: Run with `showinfo` on small segment to tune threshold before processing full video
