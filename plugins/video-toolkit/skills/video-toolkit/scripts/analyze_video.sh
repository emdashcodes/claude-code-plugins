#!/usr/bin/env bash

# analyze_video.sh
# Comprehensive video analysis orchestration script
# Extracts frames, audio, and transcribes using Whisper
#
# Usage: bash analyze_video.sh <video_path> [options]
#
# Examples:
#   bash analyze_video.sh video.mp4
#   bash analyze_video.sh video.mp4 --mode interval --interval 2
#   bash analyze_video.sh video.mp4 --mode scene-detect --threshold 0.02

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$(dirname "$SCRIPT_DIR")/.venv"

# Default parameters
VIDEO_PATH=""
MODE="interval"      # Default: interval (safest for most videos)
INTERVAL="2"         # Default: 2 seconds for interval mode
THRESHOLD="0.02"     # Default: 0.02 for scene-detect mode
WHISPER_MODEL="base" # Default: base model

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        --threshold)
            THRESHOLD="$2"
            shift 2
            ;;
        --whisper-model)
            WHISPER_MODEL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: bash analyze_video.sh <video_path> [options]"
            echo
            echo "Options:"
            echo "  --mode <scene-detect|interval>   Frame extraction mode (default: interval)"
            echo "  --threshold <value>              Scene detection threshold 0.0-1.0 (default: 0.02)"
            echo "  --interval <seconds>             Interval between frames in seconds (default: 2)"
            echo "  --whisper-model <model>          Whisper model: tiny.en, base, small, medium, large (default: base)"
            echo
            echo "Examples:"
            echo "  bash analyze_video.sh video.mp4"
            echo "  bash analyze_video.sh video.mp4 --mode interval --interval 3"
            echo "  bash analyze_video.sh video.mp4 --mode scene-detect --threshold 0.01"
            echo "  bash analyze_video.sh video.mp4 --mode scene-detect --whisper-model small"
            exit 0
            ;;
        -*)
            echo "Error: Unknown option $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
        *)
            if [ -z "$VIDEO_PATH" ]; then
                VIDEO_PATH="$1"
            else
                echo "Error: Unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate input
if [ -z "$VIDEO_PATH" ]; then
    echo "Error: Video path is required" >&2
    echo "Usage: bash analyze_video.sh <video_path> [options]" >&2
    echo "Use --help for more information" >&2
    exit 1
fi

if [ ! -f "$VIDEO_PATH" ]; then
    echo "Error: Video file not found: $VIDEO_PATH" >&2
    exit 1
fi

# Validate mode
if [ "$MODE" != "scene-detect" ] && [ "$MODE" != "interval" ]; then
    echo "Error: Invalid mode '$MODE'. Must be 'scene-detect' or 'interval'" >&2
    exit 1
fi

# Create temporary working directory
TIMESTAMP=$(date +%s)
WORK_DIR="/tmp/video-toolkit-${TIMESTAMP}"
mkdir -p "$WORK_DIR"

echo "🎬 video-toolkit analysis"
echo "========================="
echo "Video: $VIDEO_PATH"
echo "Working directory: $WORK_DIR"
echo "Extraction mode: $MODE"
if [ "$MODE" = "scene-detect" ]; then
    echo "Scene threshold: $THRESHOLD"
else
    echo "Frame interval: ${INTERVAL}s"
fi
echo "Whisper model: $WHISPER_MODEL"
echo

# Setup paths
FRAMES_DIR="$WORK_DIR/frames"
AUDIO_FILE="$WORK_DIR/audio.wav"
TRANSCRIPT_FILE="$WORK_DIR/transcript.md"
SUMMARY_FILE="$WORK_DIR/analysis-summary.md"

mkdir -p "$FRAMES_DIR"

# Check for virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "Warning: Virtual environment not found at $VENV_DIR" >&2
    echo "Please run: bash scripts/install_dependencies.sh" >&2
    exit 1
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Step 1: Extract frames
echo "Step 1/3: Extracting frames..."
echo "----------------------------"

if [ "$MODE" = "scene-detect" ]; then
    # Scene detection mode
    python "$SCRIPT_DIR/extract_frames.py" "$VIDEO_PATH" --scene-detect "$FRAMES_DIR" "$THRESHOLD"
else
    # Interval mode
    python "$SCRIPT_DIR/extract_frames.py" "$VIDEO_PATH" "$INTERVAL" "$FRAMES_DIR"
fi

EXTRACT_FRAMES_EXIT=$?

if [ $EXTRACT_FRAMES_EXIT -ne 0 ]; then
    echo "Error: Frame extraction failed" >&2
    deactivate
    exit 1
fi

echo
echo "Step 2/3: Extracting audio..."
echo "----------------------------"
python "$SCRIPT_DIR/extract_audio.py" "$VIDEO_PATH" "$AUDIO_FILE" > "$WORK_DIR/audio_extraction.log" 2>&1
EXTRACT_AUDIO_EXIT=$?

# Check if video has audio
HAS_AUDIO=true
if grep -q "\"has_audio\": false" "$WORK_DIR/audio_extraction.log"; then
    HAS_AUDIO=false
    echo "ℹ️  Video has no audio track (silent video)"
    echo "Skipping transcription..."
    cat "$WORK_DIR/audio_extraction.log"
else
    cat "$WORK_DIR/audio_extraction.log"

    if [ $EXTRACT_AUDIO_EXIT -ne 0 ]; then
        echo "Error: Audio extraction failed" >&2
        deactivate
        exit 1
    fi

    echo
    echo "Step 3/5: Transcribing speech with Whisper..."
    echo "----------------------------"
    python "$SCRIPT_DIR/transcribe_audio.py" "$AUDIO_FILE" "$WHISPER_MODEL" > "$WORK_DIR/transcribe.log" 2>&1
    TRANSCRIBE_EXIT=$?

    if [ $TRANSCRIBE_EXIT -ne 0 ]; then
        echo "Error: Transcription failed" >&2
        cat "$WORK_DIR/transcribe.log"
        deactivate
        exit 1
    fi

    # Extract markdown from transcription output
    grep -A 9999 "^MARKDOWN OUTPUT:" "$WORK_DIR/transcribe.log" | tail -n +2 > "$TRANSCRIPT_FILE"
    cat "$WORK_DIR/transcribe.log"

    echo
    echo "Step 4/5: Analyzing audio with Gemini..."
    echo "----------------------------"
    python "$SCRIPT_DIR/analyze_audio_gemini.py" "$AUDIO_FILE" "$WORK_DIR/audio_analysis.md" > "$WORK_DIR/gemini_audio.log" 2>&1
    GEMINI_EXIT=$?

    if [ $GEMINI_EXIT -ne 0 ]; then
        echo "Error: Gemini audio analysis failed" >&2
        cat "$WORK_DIR/gemini_audio.log"
        deactivate
        exit 1
    fi

    cat "$WORK_DIR/gemini_audio.log"

    # Check if music was detected (using the JSON file created by analyze_audio_gemini.py)
    HAS_MUSIC=false
    if [ -f "$WORK_DIR/gemini_audio.json" ]; then
        HAS_MUSIC=$(python3 -c "import json, sys; data=json.load(open('$WORK_DIR/gemini_audio.json')); print('true' if data.get('has_music') else 'false')" 2>/dev/null || echo "false")
    fi

    if [ "$HAS_MUSIC" = "true" ]; then
        echo
        echo "Step 5/5: Identifying music with Shazam..."
        echo "----------------------------"
        python "$SCRIPT_DIR/identify_music.py" "$AUDIO_FILE" "$WORK_DIR/gemini_audio.json" "$WORK_DIR/music_identification.md" > "$WORK_DIR/shazam.log" 2>&1
        SHAZAM_EXIT=$?

        if [ $SHAZAM_EXIT -ne 0 ]; then
            echo "Warning: Music identification failed" >&2
            cat "$WORK_DIR/shazam.log"
        else
            cat "$WORK_DIR/shazam.log"
        fi
    else
        echo
        echo "Step 5/5: No music detected, skipping Shazam..."
    fi
fi

# Deactivate virtual environment
deactivate

# Create summary file
echo
echo "Creating analysis summary..."
FRAME_COUNT=$(find "$FRAMES_DIR" -name "frame_*.png" | wc -l | tr -d ' ')
VIDEO_BASENAME=$(basename "$VIDEO_PATH")

# Create markdown summary with frontmatter
cat > "$SUMMARY_FILE" << EOF
---
video_file: $VIDEO_BASENAME
video_path: $VIDEO_PATH
analysis_date: $(date '+%Y-%m-%d')
analysis_time: $(date '+%H:%M:%S')
extraction_mode: $MODE
EOF

if [ "$MODE" = "scene-detect" ]; then
cat >> "$SUMMARY_FILE" << EOF
scene_threshold: $THRESHOLD
EOF
else
cat >> "$SUMMARY_FILE" << EOF
frame_interval: ${INTERVAL}s
EOF
fi

cat >> "$SUMMARY_FILE" << EOF
frames_extracted: $FRAME_COUNT
has_audio: $HAS_AUDIO
EOF

if [ "$HAS_AUDIO" = true ]; then
cat >> "$SUMMARY_FILE" << EOF
whisper_model: $WHISPER_MODEL
EOF
fi

cat >> "$SUMMARY_FILE" << 'EOFMARKER'
---

# Video Analysis Summary

EOFMARKER

cat >> "$SUMMARY_FILE" << EOF

## Output Files

- **Frames Directory**: \`$FRAMES_DIR\`
- **Frames Metadata**: \`$FRAMES_DIR/frames_metadata.json\`
EOF

if [ "$HAS_AUDIO" = true ]; then
cat >> "$SUMMARY_FILE" << EOF
- **Audio File**: \`$AUDIO_FILE\`
- **Speech Transcript (Whisper)**: \`$TRANSCRIPT_FILE\`
- **Audio Analysis (Gemini)**: \`$WORK_DIR/audio_analysis.md\`
EOF

if [ "$HAS_MUSIC" = "true" ]; then
cat >> "$SUMMARY_FILE" << EOF
- **Music Identification (Shazam)**: \`$WORK_DIR/music_identification.md\`
EOF
fi
fi

cat >> "$SUMMARY_FILE" << 'EOFMARKER'

## Next Steps

1. **Visual Analysis**
   - Read extracted frames using Claude's vision capabilities
   - Read frames_metadata.json for timestamp mapping
   - Identify key scenes, actions, and visual elements
   - Note timestamps from frame filenames

EOFMARKER

if [ "$HAS_AUDIO" = true ]; then
cat >> "$SUMMARY_FILE" << 'EOFMARKER'
2. **Audio Analysis**
   - Review speech transcript (Whisper) for dialogue
   - Review audio analysis (Gemini) for non-speech sounds and music description
EOFMARKER

if [ "$HAS_MUSIC" = "true" ]; then
cat >> "$SUMMARY_FILE" << 'EOFMARKER'
   - Review music identification (Shazam) for identified songs
EOFMARKER
fi

cat >> "$SUMMARY_FILE" << 'EOFMARKER'
   - Correlate audio with visual frames using timestamps

3. **Combined Summary**
EOFMARKER
else
cat >> "$SUMMARY_FILE" << 'EOFMARKER'
2. **Summary Generation**
EOFMARKER
fi

cat >> "$SUMMARY_FILE" << 'EOFMARKER'
   - Synthesize visual and audio insights
   - Create comprehensive summary with key moments
   - Enable follow-up discussion

## Files

EOFMARKER

cat >> "$SUMMARY_FILE" << EOF
- **This summary**: \`$VIDEO_DIR/${VIDEO_NAME_NO_EXT}-analysis.md\` (persisted alongside source video)
- **Temporary files**: \`$WORK_DIR\` (contains frames, audio, transcripts)

---

*Generated by video-toolkit v1.0.0 at $(date '+%Y-%m-%d %H:%M:%S')*
EOF

# Move summary to same directory as source video
VIDEO_DIR=$(dirname "$VIDEO_PATH")
VIDEO_NAME=$(basename "$VIDEO_PATH")
VIDEO_NAME_NO_EXT="${VIDEO_NAME%.*}"
FINAL_SUMMARY="$VIDEO_DIR/${VIDEO_NAME_NO_EXT}-analysis.md"

cp "$SUMMARY_FILE" "$FINAL_SUMMARY"

echo
echo "========================="
echo "✓ Analysis complete!"
echo "========================="
echo
echo "Results:"
echo "  Frames: $FRAMES_DIR ($FRAME_COUNT frames)"

if [ "$HAS_AUDIO" = true ]; then
echo "  Audio: $AUDIO_FILE"
echo "  Speech Transcript (Whisper): $TRANSCRIPT_FILE"
echo "  Audio Analysis (Gemini): $WORK_DIR/audio_analysis.md"
if [ "$HAS_MUSIC" = "true" ]; then
echo "  Music Identification (Shazam): $WORK_DIR/music_identification.md"
fi
fi

echo "  Summary: $FINAL_SUMMARY (persisted)"
echo
echo "Temporary files: $WORK_DIR"
echo
echo "Next steps:"
echo "  1. Read $VIDEO_NAME_NO_EXT-analysis.md for overview"
echo "  2. Read frames using Claude's vision capabilities"

if [ "$HAS_AUDIO" = true ]; then
echo "  3. Review transcript.md for speech content (Whisper)"
echo "  4. Review audio_analysis.md for audio understanding (Gemini)"
if [ "$HAS_MUSIC" = "true" ]; then
echo "  5. Review music_identification.md for identified songs (Shazam)"
echo "  6. Search web for song themes/meaning to inform analysis"
echo "  7. Combine visual + audio + music + themes analysis"
echo "  8. Ask user about cleanup (see SKILL.md)"
else
echo "  5. Combine visual + audio analysis"
echo "  6. Ask user about cleanup (see SKILL.md)"
fi
else
echo "  3. Create visual analysis summary"
echo "  4. Ask user about cleanup (see SKILL.md)"
fi
echo
echo "========================="

# Output path to final summary file and temp directory
echo
echo "SUMMARY_FILE:"
echo "$FINAL_SUMMARY"
echo
echo "TEMP_DIR:"
echo "$WORK_DIR"
