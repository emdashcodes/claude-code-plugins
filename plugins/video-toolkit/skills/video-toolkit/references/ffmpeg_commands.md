# FFmpeg Command Reference

Quick reference for common FFmpeg operations used in video-toolkit.

## Frame Extraction

### Extract frames at regular intervals

```bash
# Extract one frame every 2 seconds
ffmpeg -i input.mp4 -vf fps=1/2 frame_%04d.png

# Extract one frame per second
ffmpeg -i input.mp4 -vf fps=1 frame_%04d.png

# Extract 10 frames per second
ffmpeg -i input.mp4 -vf fps=10 frame_%04d.png
```

### Extract specific frames

```bash
# Extract frame at 5 seconds
ffmpeg -ss 00:00:05 -i input.mp4 -frames:v 1 frame.png

# Extract 10 frames starting at 30 seconds
ffmpeg -ss 00:00:30 -i input.mp4 -frames:v 10 frame_%04d.png
```

### Quality control

```bash
# High quality PNG (lossless)
ffmpeg -i input.mp4 -vf fps=1/2 -q:v 2 frame_%04d.png

# JPEG with quality control (2-31, lower is better)
ffmpeg -i input.mp4 -vf fps=1/2 -q:v 5 frame_%04d.jpg

# Specific resolution
ffmpeg -i input.mp4 -vf "fps=1/2,scale=1280:720" frame_%04d.png
```

## Audio Extraction

### Extract audio to WAV

```bash
# Extract to WAV (PCM)
ffmpeg -i input.mp4 -vn -acodec pcm_s16le audio.wav

# Extract to WAV, 16kHz mono (Whisper-optimized)
ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav

# Extract specific audio stream
ffmpeg -i input.mp4 -map 0:a:0 -acodec pcm_s16le audio.wav
```

### Extract audio to other formats

```bash
# MP3
ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 audio.mp3

# AAC
ffmpeg -i input.mp4 -vn -acodec aac -b:a 192k audio.m4a

# FLAC (lossless)
ffmpeg -i input.mp4 -vn -acodec flac audio.flac
```

## Video Clipping

### Extract segments

```bash
# Clip from 1:30 to 2:45 (copy streams, fast)
ffmpeg -ss 00:01:30 -i input.mp4 -t 00:01:15 -c copy output.mp4

# Clip with re-encoding (slower, more precise)
ffmpeg -i input.mp4 -ss 00:01:30 -t 00:01:15 output.mp4

# Clip using end time instead of duration
ffmpeg -ss 00:01:30 -i input.mp4 -to 00:02:45 -c copy output.mp4
```

### Key frame considerations

```bash
# Seek to nearest keyframe (fast but less precise)
ffmpeg -ss 00:01:30 -i input.mp4 -t 00:01:15 -c copy output.mp4

# Precise seeking (re-encode around cut points)
ffmpeg -i input.mp4 -ss 00:01:30 -t 00:01:15 -c:v libx264 -c:a copy output.mp4
```

## Video Merging

### Concatenate videos

```bash
# Create file list
cat > list.txt << EOF
file 'video1.mp4'
file 'video2.mp4'
file 'video3.mp4'
EOF

# Merge using concat demuxer (same codec)
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4

# Merge with re-encoding (different codecs)
ffmpeg -f concat -safe 0 -i list.txt output.mp4
```

### Merge with transition

```bash
# Crossfade between clips
ffmpeg -i video1.mp4 -i video2.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=1:offset=4[v]" \
  -map "[v]" output.mp4
```

## Video Splitting

### Split by duration

```bash
# Split into 5-minute segments
ffmpeg -i input.mp4 -c copy -f segment -segment_time 300 -reset_timestamps 1 segment_%03d.mp4

# Split into 10 equal parts
ffmpeg -i input.mp4 -c copy -f segment -segment_frames 10 segment_%03d.mp4
```

### Split at specific times

```bash
# Split at 1:00, 3:00, 5:00
ffmpeg -i input.mp4 -c copy -f segment -segment_times 60,180,300 segment_%03d.mp4
```

## Video Information

### Get video metadata

```bash
# Show all information
ffprobe input.mp4

# Get duration in seconds
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 input.mp4

# Get video resolution
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 input.mp4

# Get frame rate
ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 input.mp4

# JSON output
ffprobe -v error -show_format -show_streams -of json input.mp4
```

## Common Filters

### Scaling and resizing

```bash
# Resize to 720p
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Resize maintaining aspect ratio
ffmpeg -i input.mp4 -vf scale=1280:-1 output.mp4

# Resize to fit within dimensions
ffmpeg -i input.mp4 -vf "scale='min(1280,iw)':min(720,ih)':force_original_aspect_ratio=decrease" output.mp4
```

### Cropping

```bash
# Crop to 1280x720 from top-left
ffmpeg -i input.mp4 -vf "crop=1280:720:0:0" output.mp4

# Crop center
ffmpeg -i input.mp4 -vf "crop=1280:720" output.mp4
```

### Speed adjustment

```bash
# 2x speed (video only)
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" output.mp4

# 0.5x speed (slow motion, video only)
ffmpeg -i input.mp4 -vf "setpts=2*PTS" output.mp4

# 2x speed (video + audio)
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" output.mp4
```

## Codec Information

### Common video codecs

- **H.264 (libx264)** - Most compatible, good quality/size ratio
- **H.265 (libx265)** - Better compression, slower encoding
- **VP9 (libvpx-vp9)** - Good for web, open source
- **ProRes** - High quality, large files, editing-friendly

### Common audio codecs

- **AAC** - Most compatible, good quality
- **MP3 (libmp3lame)** - Universal compatibility
- **Opus** - Best quality/size ratio, modern
- **PCM** - Uncompressed, lossless

## Troubleshooting

### Common issues

**"Unknown encoder" errors:**
```bash
# Check available encoders
ffmpeg -encoders

# Check available decoders
ffmpeg -decoders
```

**Stream mapping errors:**
```bash
# Explicitly map streams
ffmpeg -i input.mp4 -map 0:v -map 0:a output.mp4

# Copy only video stream
ffmpeg -i input.mp4 -map 0:v -c copy output.mp4
```

**Synchronization issues:**
```bash
# Re-sync audio/video
ffmpeg -i input.mp4 -async 1 output.mp4

# Fix variable frame rate
ffmpeg -i input.mp4 -vsync 1 output.mp4
```

### Performance optimization

```bash
# Use hardware acceleration (macOS)
ffmpeg -hwaccel videotoolbox -i input.mp4 output.mp4

# Multi-threaded encoding
ffmpeg -i input.mp4 -threads 8 output.mp4

# Fast preset (lower quality, faster encode)
ffmpeg -i input.mp4 -preset fast output.mp4
```

## Best Practices

1. **Use `-c copy` when possible** - Avoids re-encoding, much faster
2. **Seek before input (`-ss` before `-i`)** - Faster seeking
3. **Use appropriate presets** - Balance speed vs quality
4. **Check codec compatibility** - Ensure output plays on target devices
5. **Monitor file sizes** - Adjust quality settings if needed
6. **Test small segments first** - Verify settings before processing long videos
7. **Keep originals** - Never overwrite source files

## Resources

- [FFmpeg Official Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Wiki](https://trac.ffmpeg.org/wiki)
- [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)
