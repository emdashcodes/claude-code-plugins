---
name: video-toolkit
description: Video analysis and editing with FFmpeg and Whisper. This skill should be used when video files are shared (.mov, .mp4, .avi, etc.) or when you encounter "cannot read binary files" errors for video files, when users request video analysis or summarization, or when users ask to edit videos (clip, merge, split).
allowed-tools: Read, Write, Bash, Glob
---

# Video Toolkit

Comprehensive video processing skill combining editing capabilities with multi-modal analysis (visual frames + audio transcription).

## When to Use This Skill

Activate this skill when:

- User shares a video file (.mov, .mp4, .avi, .mkv, .webm, etc.)
- User asks to analyze, summarize, or understand video content
- User requests video editing operations (clip, merge, split)
- User asks questions about what's in a video
- You encounter "cannot read binary files" errors when trying to read video files
- Guides agents to use proper video analysis workflow

**What this means for users:**

When you share a video file, Claude will automatically recognize it and offer to analyze it properly using the video-toolkit, rather than attempting to read the binary file directly.

## Prerequisites

**Required Dependencies:**

1. **FFmpeg** - Video processing and frame extraction
   - Installation handled by `scripts/install_dependencies.sh`
   - Verify: `ffmpeg -version`

2. **Python 3.8+** with virtual environment
   - Installation handled by `scripts/install_dependencies.sh`

3. **OpenAI Whisper** - Speech transcription (local, no API key required)
   - Installed via pip in `.venv`
   - Model: base (good balance of speed/accuracy)
   - Other models available: tiny.en, small, medium, large

4. **Google Gemini API** - Audio analysis and music detection
   - Installed via pip in `.venv`
   - Requires API key (see setup below)
   - Model: gemini-2.5-flash

5. **Shazam API** - Music identification
   - Installed via pip in `.venv` (shazamio)
   - No API key required (uses public endpoint)

**Setup:**

**Step 1: Install Dependencies**

Run the installation script on first use:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/install_dependencies.sh
```

This creates a Python virtual environment at `${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/` and installs the required packages (ffmpeg-python, openai-whisper, google-genai, shazamio).

**Step 2: Configure API Keys**

Set up Gemini API key for audio analysis:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/setup_api_keys.py gemini YOUR_API_KEY
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

**Optional:** If you want to use RapidAPI's Shazam endpoint instead of the public one:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/setup_api_keys.py shazam YOUR_RAPIDAPI_KEY
```

Note: Shazam/music identification works without an API key using shazamio's public endpoint.

## How to Use This Skill

**IMPORTANT: Check API Key Setup First**

Before analyzing videos with audio, verify that the Gemini API key is configured:
- Config file location: `/Users/emdash/Dev/claude-code-plugins/emdashcodes/.video-toolkit-config.json`
- If the file doesn't exist or doesn't contain `gemini.apiKey`, run the setup first (see Prerequisites above)
- The scripts will error with clear setup instructions if the API key is missing

### Multi-Modal Video Analysis Workflow

When analyzing a video file, follow this comprehensive workflow:

**1. Frame Extraction**

Extract visual frames using either **interval mode** or **scene detection mode**:

**Interval Mode** (time-based):

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/extract_frames.py <video_path> <interval_seconds> <output_dir>
```

- `interval_seconds`: Time between frames (e.g., 2 for every 2 seconds)
- `output_dir`: Temporary directory for frames
- Best for: Consistent sampling, slideshows, time-based analysis

**Scene Detection Mode** (change-based):

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/extract_frames.py <video_path> --scene-detect <output_dir> [threshold]
```

- `threshold`: Sensitivity (0.0-1.0, optional, default: 0.02)
- Automatically detects visual changes
- Best for: Screen recordings, presentations, variable content

**Choosing the Right Mode:**

| Video Type | Recommended Mode | Threshold/Interval | Recommended Value |
|------------|------------------|-------------------|-------------------|
| **Screen recordings** | **Interval** | 2-3 seconds | **Use 2-3s** |
| **Presentations/Slides** | Scene detection | 0.05 - 0.10 | **Use 0.05** |
| **Movies/Hard cuts** | Scene detection | 0.20 - 0.30 | **Use 0.20** |
| **Surveillance/Static** | Interval | 5-10 seconds | **Use 5s** |
| **Interviews/Dialogue** | Interval | 3-5 seconds | **Use 3s** |
| **Action videos** | Interval | 1-2 seconds | **Use 1s** |

**Agent Decision Making:**

- For UI/screen recordings: Use interval mode with 2-3s (captures static periods reliably)
- For presentations/slides: Use scene detection with 0.05 (good for slide transitions)
- For movies with hard cuts: Use scene detection with 0.20
- For talking heads/static: Use interval mode with 3-5s
- For action/movement: Use interval mode with 1-2s
- **DEFAULT**: Interval mode with 2s (safest for most videos)

**IMPORTANT: Evaluate and Re-run if Needed**

- After extraction, **check the frame count** - does it seem reasonable for the video duration?
- If you get too few frames (e.g., <5 frames for a 2-min screen recording), **SWITCH TO INTERVAL MODE**
- If you get too many frames (e.g., >100 frames), the threshold may be TOO LOW
- **Think critically about the results, check some frames, and RE-RUN with different settings if necessary**
- Don't proceed with analysis if frame extraction clearly failed or produced poor results

**Scene Detection Limitation:**
Scene detection **only captures frames when visual content changes significantly**. If the video has long static periods (e.g., same screen for 30+ seconds), scene detection will miss that content entirely. **For videos with static content, USE INTERVAL MODE instead** with `--mode interval --interval 2` or `--interval 3`.

**2. Audio Extraction**

Extract audio track using `scripts/extract_audio.py`:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/extract_audio.py <video_path> <output_wav_path>
```

- Converts to WAV format (Whisper-compatible)
- Preserves original audio quality
- Returns: Path to extracted WAV file

**3. Audio Analysis (Sequential Workflow)**

The audio analysis follows a sequential workflow to maximize accuracy and efficiency:

**3a. Speech Transcription (Whisper - Local)**

Transcribe speech using Whisper (runs locally, no API key required):

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/transcribe_audio.py <wav_path> [model_name]
```

- `model_name`: Whisper model (default: base)
  - tiny.en: Fastest, English only
  - base: Good balance (recommended)
  - small: Better accuracy
  - medium: High accuracy
  - large: Best accuracy, slowest
- Returns: Timestamped transcript with speaker diarization info
- **Purpose**: Extract speech/dialogue from the audio

**3b. Audio Understanding (Gemini Audio API)**

Analyze audio comprehensively using Gemini Audio API:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/analyze_audio_gemini.py <wav_path> [output_markdown]
```

- Analyzes full audio content (not just speech)
- **Detects music** with precise timestamps (MM:SS to MM:SS format)
- Identifies non-speech sounds (applause, ambient noise, sound effects)
- **Translates foreign languages**: If Whisper detects non-English speech, Gemini provides both original and English translation
- Returns:
  - Markdown analysis saved to `[output_markdown]`
  - JSON data automatically saved to `gemini_audio.json` in same directory
  - JSON contains `has_music` flag and `music_segments` array for downstream processing
- **Purpose**: Understand what's in the audio beyond speech, detect if music is present, translate foreign languages

**3c. Music Identification (Shazam - Conditional)**

If Gemini detects music, identify songs using Shazam:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/identify_music.py <wav_path> <gemini_json> [output_markdown]
```

- `<gemini_json>`: Path to the `gemini_audio.json` file created by `analyze_audio_gemini.py`
- Only runs if Gemini detected music (checks `has_music` flag in JSON)
- Extracts music segments based on Gemini's timestamps using FFmpeg
- Identifies each segment with Shazam API
- Returns: Song title, artist, album, genre, year
- **Purpose**: Identify specific songs in the video

**Sequential Workflow Summary:**

```
1. Whisper (local)     → Speech transcription
2. Gemini Audio (API)  → Detect music + timestamps, analyze non-speech audio
3. FFmpeg              → Extract music segments (if music detected)
4. Shazam (API)        → Identify songs (if music detected)
```

This approach ensures:
- Whisper focuses on speech (what it does best, runs locally)
- Gemini provides overall audio understanding and music detection
- Shazam only processes clean music segments (better accuracy)
- No unnecessary API calls if no music is present

**Gemini vs Shazam - Complementary Capabilities:**

- **Gemini Audio API**: AI-powered audio understanding
  - Recognizes music **characteristics**: genre, mood, instrumentation, tempo
  - Example: "Rock/Alternative song with electric guitar and male vocals, energetic"
  - May recognize well-known classical pieces (especially if mentioned in speech)
  - Provides timestamps and musical context
  - **Does NOT** identify specific tracks, artists, or albums

- **Shazam**: Audio fingerprint matching
  - Identifies **specific recordings**: track title, artist, album, year
  - Example: "Substitution - Silversun Pickups, Swoon (2009)"
  - Requires at least 3 seconds of audio for reliable identification
  - Provides Shazam URLs and metadata

Both work together: Gemini describes what the music *sounds like*, Shazam identifies which specific *track* it is.



**3.5. Context Clarification with Intelligent Question Generation**

**CRITICAL STEP**: After gathering initial data (frames, audio, music identification), ask the user context questions to understand the video's perspective and avoid misidentification.

**Why this step is critical**: Visual evidence alone can be ambiguous. For example, seeing streaming platform with a BRB screen could mean either:

- The user is streaming and stepped away (creator perspective)
- The user is watching someone else's stream (viewer perspective)

Only the user can clarify their relationship to the content.

---

## Workflow: Analyze First, Then Ask

**Step 1: Complete Initial Data Gathering**

Before asking any questions, run the full analysis pipeline through Step 3c:

- ✓ Extract frames (Step 1)
- ✓ Extract and transcribe audio (Steps 2, 3a)
- ✓ Analyze audio with Gemini (Step 3b)
- ✓ Identify music with Shazam if detected (Step 3c)


**Step 2: Build Contextual Evidence**

Review what was gathered:

- **Visual evidence**: Sample 3-5 frames - what's visible? (UI, people, environments, screen content)
- **Audio evidence**: What's the audio content? (speech, music, ambient sounds)
- **Music evidence**: What songs were identified? With what timestamps?
- **Conversation context**: What has the user said about this video?
- **User knowledge**: What do you know about this user from conversation history and preferences?

**Step 3: Ask Context Question (Q1) with Evidence**

Present Q1 with context from your gathered evidence to help the user answer:

```python
# Build context string from evidence
# Adapt summary based on what was found in the video

# Example 1: Stream Viewer
evidence_summary = """I've analyzed the video and found:
- Visual: Streaming platform interface with BRB screen, person visible, workspace shown
- Audio: Music playing ("Song Title" by Artist Name), minimal speech
- Duration: 1:57
"""

# Example 2: Tutorial/How-to
evidence_summary = """I've analyzed the video and found:
- Visual: Person's hands visible working with materials, step-by-step demonstrations
- Audio: Instructional narration explaining process, background music
- Duration: 8:34
"""

# Example 3: Screen Recording (Software Demo)
evidence_summary = """I've analyzed the video and found:
- Visual: VS Code editor with code visible, cursor movements, terminal commands
- Audio: Voiceover explaining code changes, keyboard typing sounds
- Duration: 5:12
"""

# Example 4: Screen Recording (Gameplay)
evidence_summary = """I've analyzed the video and found:
- Visual: Game interface with HUD elements, character movement, gameplay
- Audio: Game sounds, background music, occasional commentary
- Duration: 12:45
"""

# Example 5: Personal/Casual
evidence_summary = """I've analyzed the video and found:
- Visual: Person on camera in home setting, handheld/phone camera movement
- Audio: Person speaking directly to camera, ambient room sounds
- Duration: 2:18
"""

# Example 6: Personal/Casual (Phone Clip)
evidence_summary = """I've analyzed the video and found:
- Visual: Quick clip of outdoor scene, vertical/portrait orientation, casual framing
- Audio: Ambient sounds, brief speech, wind noise
- Duration: 0:43
"""

# Example 7: Event/Performance
evidence_summary = """I've analyzed the video and found:
- Visual: Stage with performers, audience visible, concert venue setting
- Audio: Live music performance, crowd noise, applause
- Duration: 3:56
"""

# Example 8: Presentation/Slides
evidence_summary = """I've analyzed the video and found:
- Visual: Slide deck with bullet points and diagrams, presenter occasionally visible
- Audio: Presenter speaking, slide transition sounds
- Duration: 18:24
"""

# Example 9: Casual Documentation (Workspace)
evidence_summary = """I've analyzed the video and found:
- Visual: Desk setup with monitors and equipment, informal camera angles
- Audio: Background music, ambient office sounds, no narration
- Duration: 1:34
"""

# Example 10: Behind-the-Scenes
evidence_summary = """I've analyzed the video and found:
- Visual: Production equipment, camera setup, people working on set
- Audio: Technical discussions, equipment sounds, music playing
- Duration: 4:27
"""

# Template for implementation:
# Select the most relevant description based on gathered evidence
def build_evidence_summary(frames_analysis, audio_analysis, music_data, duration):
    """
    Generate evidence summary based on analyzed content

    Returns contextual summary that helps user identify video type
    """
    visual_desc = describe_visual_content(frames_analysis)
    audio_desc = describe_audio_content(audio_analysis, music_data)

    return f"""I've analyzed the video and found:
- Visual: {visual_desc}
- Audio: {audio_desc}
- Duration: {format_duration(duration)}
"""

# Present Q1 with evidence context
AskUserQuestion(
    questions=[
        {
            "question": f"{evidence_summary}\n\nWhat type of video is this?",
            "header": "Video Type",
            "multiSelect": false,
            "options": [
                {
                    "label": "Tutorial/How-to",
                    "description": "Teaching or demonstrating something step-by-step"
                },
                {
                    "label": "Personal",
                    "description": "Personal video, daily life content, a moment or activity, clip from phone"
                },
                {
                    "label": "Screen recording",
                    "description": "Recording your own screen (software demo, debugging video, gameplay, etc.)"
                },
                {
                    "label": "Watching something",
                    "description": "Recording yourself viewing someone else's content"
                },
                {
                    "label": "Event/Performance",
                    "description": "Concert, presentation, ceremony, or live event"
                },
                {
                    "label": "Other/Not sure",
                    "description": "Type a custom description of what this video shows"
                }
            ]
        }
    ]
)
```

**Key Patterns in Evidence Summaries:**

1. **Be specific about what's visible**: Not just "screen content" but "VS Code editor with code" or "Streaming platform interface with BRB screen"

2. **Mention identifying audio**: "Music playing (song identified)" vs. "instructional narration" vs. "live performance audio"

3. **Note video characteristics**: Portrait orientation, handheld movement, production quality

4. **Keep it concise**: 2-3 bullet points max, user can read it quickly

5. **Help user self-identify**: Evidence should make the correct option obvious

**Step 4: Generate Smart Follow-up (Q2) Based on Evidence + Q1 Answer**

**CRITICAL**: Generate Q2 dynamically based on:

- ✓ User's Q1 answer
- ✓ Visual evidence from frames
- ✓ Audio evidence from transcription/Gemini
- ✓ Music identification results
- ✓ Conversation context
- ✓ User preferences and history

**Skip Q2 entirely if**:

- The evidence makes the context obvious
- Q1 answer is self-explanatory (Tutorial, Event/Performance)
- You're highly confident about the analysis direction

**Generate custom Q2 if needed**:

**If Q1 = "Watching something" AND you identified what they were watching:**

```python
# Example: You saw streaming platform + identified music
AskUserQuestion(
    questions=[
        {
            "question": "I can see streaming platform with a BRB screen and identified 'Song Title' by Artist Name playing in the background. Is this what was happening?",
            "header": "Confirm Context",
            "multiSelect": false,
            "options": [
                {
                    "label": "Yes, that's correct",
                    "description": "Watching a stream with music playing in my space"
                },
                {
                    "label": "Partially correct",
                    "description": "Some of that is right, but let me clarify"
                },
                {
                    "label": "No, different context",
                    "description": "That's not quite what was happening"
                }
            ]
        }
    ]
)
```

**If Q1 = "Watching something" AND you're uncertain what:**

```python
AskUserQuestion(
    questions=[
        {
            "question": "What were you watching?",
            "header": "Content Source",
            "multiSelect": true,  # Allow multiple selections
            "options": [
                {
                    "label": "Live stream",
                    "description": "Streaming platforms, Twitch, YouTube live, etc."
                },
                {
                    "label": "Video content",
                    "description": "YouTube video, movie, TV show, etc."
                },
                {
                    "label": "Music playing",
                    "description": "Music was playing in your space"
                },
                {
                    "label": "Other media",
                    "description": "Game, presentation, or other content"
                }
            ]
        }
    ]
)
```

**If Q1 = "Personal" AND video shows workspace/music:**

```python
# You already know music was playing and workspace is visible
# Generate confirmation question instead of generic tags
AskUserQuestion(
    questions=[
        {
            "question": "I can see your workspace and 'Song Title' playing. What tags describe this video?",
            "header": "Context Tags",
            "multiSelect": true,
            "options": [
                {
                    "label": "Music playing",
                    "description": "Background music in your space"
                },
                {
                    "label": "Workspace/setup",
                    "description": "Showing desk, equipment, or environment"
                },
                {
                    "label": "Activity in progress",
                    "description": "Doing something while recording"
                },
                {
                    "label": "Artistic/experimental",
                    "description": "Creative or artistic intent"
                }
            ]
        }
    ]
)
```

**If Q1 = "Screen recording":**

```python
# Only ask if genuinely uncertain from frames
# You likely already saw what's on screen
AskUserQuestion(
    questions=[
        {
            "question": "I can see {specific_app_or_content}. What were you recording?",
            "header": "Screen Content",
            "multiSelect": false,
            "options": [
                {
                    "label": "Software/application",
                    "description": "Demonstrating a program or workflow"
                },
                {
                    "label": "Gameplay",
                    "description": "Playing a game"
                },
                {
                    "label": "Design/creative work",
                    "description": "Working in design tools, editors, etc."
                },
                {
                    "label": "General computer use",
                    "description": "Browsing, chatting, or mixed activities"
                }
            ]
        }
    ]
)
```

**If Q1 = "Tutorial/How-to" or "Event/Performance":**
→ **Skip Q2** - these are self-explanatory, proceed to analysis

**If Q1 = "Other/Not sure" (custom text provided):**
→ Use the custom text to inform analysis, **skip Q2** unless truly necessary

---

## Store and Use Metadata

After Q1 (and Q2 if asked), store structured metadata:

```python
video_metadata = {
    "video_type": user_q1_answer,           # "Watching something"
    "perspective": derived_perspective,      # "First-Person Viewer"
    "content_tags": user_q2_answers,        # ["live stream", "music playing"]
    "evidence": {
        "visual": visual_summary,            # From frames
        "audio": audio_summary,              # From Gemini
        "music": music_identification,       # From Shazam
        "duration": video_duration
    }
}
```

**Use this metadata throughout remaining analysis:**

- Guide visual analysis focus (Step 5)
- Inform subagent prompts
- Set appropriate terminology in final summary
- Avoid misidentifying perspective or intent

---

## Example: Context-Aware Question Flow

**Scenario**: User shares video showing streaming platform with BRB screen, person visible, music playing

**Data Gathered (Steps 1-3d)**:

- Frames: Streaming platform UI, BRB overlay, person, workspace visible
- Audio: Music "Song Title" by Artist Name (0:32-1:57), minimal speech
- Duration: 1:57
- Context: User information from conversation history

**Q1 with Context**:

```
I've analyzed the video and found:
- Visual: Streaming platform interface with BRB screen, person visible, workspace shown
- Audio: Music playing ("Song Title" by Artist Name), minimal speech
- Duration: 1:57

What type of video is this?
→ User selects: "Watching something"
```

**Smart Q2 Generation**:

```python
# You already know:
# - Streaming platform with BRB = watching a stream
# - Music identified = "Song Title" playing in their space
# - Person visible = user on camera

# Instead of generic "What were you watching?", generate specific confirmation:
"I can see streaming platform with a BRB screen and identified 'Song Title' by Artist Name
playing in the background. Were you watching someone's stream while music played in your space?"

Options:
- Yes, that's correct
- Partially - let me clarify
- No, different context
```

**Result**: Only 2 questions needed, and Q2 is informed and specific rather than generic.

**Alternative - High Confidence, Skip Q2**:
If extremely confident from evidence, skip Q2 entirely:

```
Q1 answer: "Watching something"

→ Skip Q2, proceed with metadata:
{
  video_type: "Watching something",
  perspective: "First-Person Viewer",
  content_tags: ["live stream", "music playing", "workspace visible"]
}
```

---

## Benefits of This Approach

1. **Evidence-informed questions**: Q1 includes what you found, helping user answer
2. **Smart Q2 generation**: Tailored to what you already know + user's Q1 answer
3. **Skip when confident**: Don't ask unnecessary questions if evidence is clear
4. **Confirmation over discovery**: Ask "Is this correct?" when you have strong evidence
5. **Context-aware**: Uses conversation history, user preferences, and gathered data
6. **Prevents misidentification**: Clarifies creator vs. viewer perspective early
7. **Efficient**: Maximum 2 questions, often just 1

---

## Integration with Remaining Workflow

After completing Step 3.5 (Context Clarification), proceed to:

**Step 4**: Video Type Detection and Analysis Strategy

- Use `video_metadata.perspective` to select appropriate analysis focus
- Apply type-specific guidance based on clarified context

**Step 5**: Visual Analysis with video-frame-analyzer Subagent(s)

- Pass `video_metadata` to subagent prompts
- Ensure analysis matches user's stated relationship to content
- Use correct terminology (viewer/creator/observer language)

The metadata from context clarification informs all downstream analysis.

---

**4. Video Perspective and Type Detection (UPDATED)**

After context clarification (Step 3.5), use the user's answers and gathered evidence to determine the appropriate analysis approach.

---

## Two-Dimensional Classification System

**Dimension 1: Perspective** (Who is filming and why?)
**Dimension 2: Content Type** (What's in the video?)

### Perspective Classification

Derive perspective from user's Q1 answer and evidence:

| User's Q1 Answer | Perspective | Analysis Approach |
|------------------|-------------|-------------------|
| Tutorial/How-to | **First-Person Creator** | User is teaching/presenting |
| Personal | **First-Person Creator** OR **Meta/Hybrid** | User is documenting their own life/activities |
| Screen recording | **First-Person Creator** | User is demonstrating their own screen |
| Watching something | **First-Person Viewer** | User is consuming someone else's content |
| Event/Performance | **Third-Person Observer** | User is filming someone/something else |
| Other/custom text | **Derive from description** | Analyze custom text to determine |

### Expanded Content Type Taxonomy

Based on perspective, select the appropriate content type analysis:

---

## First-Person Viewer Types

**The user is watching/consuming content created by others**

### Stream Viewer

**Indicators**:

- Visual: Streaming platform UI (Discord, Twitch, YouTube), others' stream content, BRB screens, chat visible
- Audio: Music in viewer's space, ambient sounds, minimal commentary
- Evidence: Streaming platform visible, user not the presenter/streamer

**Analysis Focus**:

- **Primary**: What stream/content is being watched? (streamer name, stream title, platform)
- **Track**: BRB screens, waiting periods, stream states, chat activity
- **Note**: Viewer's environment (workspace, room, objects visible)
- **Look For**:
  - Parallel activities (what is viewer doing while watching?)
  - Music or ambient audio in viewer's space (distinct from stream audio)
  - Environmental context and mood
  - Correlation between stream content and viewer behavior

### Reaction Video

**Indicators**:

- Visual: Split screen (content + reactor) or switches between content and reactions
- Audio: Commentary over content, reactions, pauses for analysis
- Evidence: User visible reacting to visible content

**Analysis Focus**:

- **Primary**: What content is being reacted to? User's reactions and commentary
- **Track**: Reaction timing, pauses, emotional responses
- **Note**: User's analysis, critiques, or engagement with content
- **Look For**: Key moments that trigger reactions, commentary themes

### Viewing Documentation

**Indicators**:

- Visual: Browser/player UI, content consumption in progress, informal framing
- Audio: Background music, ambient sounds, casual environment
- Evidence: Passive viewing being documented

**Analysis Focus**:

- **Primary**: What's being consumed, why is it being documented
- **Track**: Viewing progression, pauses, environmental changes
- **Note**: Mood, atmosphere, context for documentation
- **Look For**: Artistic intent, thematic connections

---

## First-Person Creator Types

**The user is creating/presenting content**

### Tutorial/How-to

**Indicators**:

- Visual: Step-by-step demonstrations, hands visible, process shown
- Audio: Instructional narration, explanations, process sounds
- Evidence: Deliberate teaching structure

**Analysis Focus**:

- **Primary**: What's being taught, step-by-step process
- **Track**: Instructions, materials/tools, technique demonstrations
- **Note**: Key concepts, warnings, tips
- **Look For**: Learning objectives, common mistakes addressed

### Screen Recording (Creator)

**Indicators**:

- Visual: User's own screen with deliberate navigation, cursor movements, UI interactions
- Audio: Voiceover tutorial, keyboard clicks, narration
- Evidence: User demonstrating their own workflow

**Analysis Focus**:

- **Primary**: UI elements, workflow steps, applications used
- **Track**: Mouse/cursor position, clicked elements, opened applications
- **Note**: Workflow steps, error messages, command sequences
- **Look For**: Transitions between applications, file operations, settings changes

### Personal (Vlog/Life Content)

**Indicators**:

- Visual: Person on camera, home/outdoor settings, handheld or mounted camera
- Audio: Direct-to-camera speech, personal narrative, ambient sounds
- Evidence: User sharing personal moments or experiences

**Analysis Focus**:

- **Primary**: Setting/location, what person is saying/doing
- **Track**: Emotional tone, activities, locations visited
- **Note**: Personal details, narrative arc, objects/items shown
- **Look For**: Story progression, mood shifts, environment changes

### Presentation/Slides

**Indicators**:

- Visual: Slide layouts, bullet points, diagrams, presenter view
- Audio: Presenter speaking, slide advance sounds
- Evidence: Formal presentation structure

**Analysis Focus**:

- **Primary**: Slide content (headings, bullet points, data)
- **Track**: Slide numbers, transitions, presenter appearance
- **Note**: Key concepts, visualizations, quotes, formulas
- **Look For**: Slide themes, speaker gestures, main arguments

---

## Meta/Hybrid Types

**The user is documenting the process of creating/consuming**

### Casual Documentation

**Indicators**:

- Visual: Informal framing, switches between activities, workspace visible, no clear structure
- Audio: Ambient audio, music, casual speech, environmental sounds
- Evidence: Informal recording of moments/activities

**Analysis Focus**:

- **Primary**: Activities happening, personal environment, objects/items
- **Track**: Environmental changes, mood shifts, items introduced
- **Note**: Personal details that provide context, atmosphere
- **Look For**:
  - Documentary-style observations
  - Authentic, unscripted moments
  - Connections between visual, audio, and thematic elements
  - Artistic or experimental intent

### Behind-the-Scenes

**Indicators**:

- Visual: Production equipment visible, setup shots, workspace, process in action
- Audio: Technical discussions, process sounds, tools being used
- Evidence: Documenting creation workflow

**Analysis Focus**:

- **Primary**: Creation process, tools/equipment, methodology
- **Track**: Setup changes, workflow steps, technical decisions
- **Note**: Challenges encountered, solutions implemented
- **Look For**: Insights into creative/production process

### Process Video

**Indicators**:

- Visual: Work-in-progress visible, tools/software, iterative changes
- Audio: Narration of process, thinking out loud, work sounds
- Evidence: Documenting work as it happens

**Analysis Focus**:

- **Primary**: Steps taken, decision-making, progress
- **Track**: Iterations, changes, refinements
- **Note**: Reasoning, challenges, solutions
- **Look For**: Learning moments, key decisions

---

## Third-Person Observer Types

**The user is filming someone/something else**

### Event/Performance

**Indicators**:

- Visual: Stage/venue, audience, performers, event setting
- Audio: Live audio, applause, ambient event noise
- Evidence: User filming an event they're attending

**Analysis Focus**:

- **Primary**: Performers, performance content, venue
- **Track**: Key performance moments, crowd reactions, technical elements
- **Note**: Event highlights, special effects, atmosphere
- **Look For**: Memorable moments, mistakes, energy shifts

### Interview/Podcast

**Indicators**:

- Visual: Two+ people, static camera, simple background
- Audio: Conversational dialogue, minimal music
- Evidence: Discussion/interview being filmed

**Analysis Focus**:

**5. Visual Analysis with video-frame-analyzer Subagent(s)**

After frames are extracted AND video type is assessed, delegate to the specialized **video-frame-analyzer** subagent(s) for systematic visual analysis:

**Single Subagent (< 30 frames):**
For videos with fewer than 30 frames, use a single subagent:

**IMPORTANT**: Use the full qualified subagent name: `video-toolkit:video-frame-analyzer`

**Step 1: Assess Video Type (sample first 3-5 frames)**

Before full analysis, quickly review a few early frames to determine video type and appropriate analysis focus:

```
Use the video-toolkit:video-frame-analyzer subagent to assess video type from /tmp/video-toolkit-[timestamp]/frames

Sample frames 1-5 and determine:
1. Video type (screen recording, vlog, presentation, music video, tutorial, etc.)
2. Recommended analysis focus based on type (see Type-Specific Analysis Focus section)
3. Key elements to track throughout the video

Save assessment to: /tmp/video-toolkit-[timestamp]/video-type-assessment.md
```

**Step 2: Full Frame Analysis (with type-adaptive prompts)**

```
Use the video-toolkit:video-frame-analyzer subagent to analyze the frames in /tmp/video-toolkit-[timestamp]/frames

**Video Type Detected:** [Insert detected type from assessment]

The following files are available:
- Frames: /tmp/video-toolkit-[timestamp]/frames/*.png (X frames total)
- Metadata: /tmp/video-toolkit-[timestamp]/frames/frames_metadata.json (contains frame timestamps)
- Transcript: /tmp/video-toolkit-[timestamp]/transcript.md (if video has audio)
- Audio Analysis: /tmp/video-toolkit-[timestamp]/audio_analysis.md (Gemini audio understanding, if available)
- Music Identification: /tmp/video-toolkit-[timestamp]/music_identification.md (Shazam results, if music detected)
- Video Type Assessment: /tmp/video-toolkit-[timestamp]/video-type-assessment.md

Based on the detected video type, apply appropriate analysis focus:
[Insert type-specific focus points from Type-Specific Analysis Focus section]

Analyze all frames, correlate visual content with transcript/audio using timestamps, and pay special attention to elements relevant for this video type.

Save your complete analysis to: /tmp/video-toolkit-[timestamp]/video-analysis.md
```

**Parallel Subagents (≥ 30 frames):**
For videos with 30+ frames, **spawn multiple video-toolkit:video-frame-analyzer subagents in parallel**, each handling a subset of frames:

**IMPORTANT**:
- Use the full qualified subagent name: `video-toolkit:video-frame-analyzer`
- Use a single message with multiple Task tool calls to run agents in parallel

Example for 50 frames:

```
# Spawn 5 subagents in parallel, each analyzing 10 frames
# Agent 1: frames 1-10
# Agent 2: frames 11-20
# Agent 3: frames 21-30
# Agent 4: frames 31-40
# Agent 5: frames 41-50
```

**How to split frames:**

- **30-50 frames**: 3-5 subagents (10 frames each) - launch all in parallel
- **50-100 frames**: 5-10 subagents (10 frames each) - launch in waves of 5
- **100+ frames**: Consider using interval mode instead, or max 10 subagents in waves

**Staged Execution for Long Videos:**
For videos requiring more than 5 subagents, launch them in **waves** to avoid overwhelming the system:

**Example: 100 frames = 10 subagents**

- **Wave 1**: Launch subagents 1-5 in parallel (frames 1-50)
- Wait for Wave 1 to complete
- **Wave 2**: Launch subagents 6-10 in parallel (frames 51-100)
- Wait for Wave 2 to complete
- Synthesize all results

**Why staged execution?**

- Prevents too many concurrent subagents
- Better resource management
- Easier to debug if something fails
- More predictable performance

**Prompt for parallel subagents:**

**IMPORTANT**:
1. First, assess video type with a quick subagent analyzing frames 1-5
2. Then create the `partial-analyses/` directory: `mkdir -p /tmp/video-toolkit-[timestamp]/partial-analyses`
3. Launch parallel subagents with type-aware prompts

**Step 1: Quick Video Type Assessment**

```
Use the video-toolkit:video-frame-analyzer subagent to assess video type from frames 1-5 in /tmp/video-toolkit-[timestamp]/frames

Sample the first 5 frames and determine:
1. Video type (screen recording, vlog, presentation, music video, tutorial, interview, documentary, gameplay, event, animation)
2. Recommended analysis focus based on type
3. Key elements to track throughout

Review audio analysis if available to help determine type.

Save assessment to: /tmp/video-toolkit-[timestamp]/video-type-assessment.md
```

**Step 2: Type-Adaptive Parallel Analysis**

After video type is assessed, use this prompt template for each parallel subagent:

```
Use the video-toolkit:video-frame-analyzer subagent to analyze frames [start]-[end] from /tmp/video-toolkit-[timestamp]/frames

**Video Type:** [Insert type from assessment]
**Analysis Focus:** [Insert relevant focus points for this type]

Files available:
- Frames: frame_00[start].png through frame_00[end].png
- Metadata: /tmp/video-toolkit-[timestamp]/frames/frames_metadata.json
- Transcript: /tmp/video-toolkit-[timestamp]/transcript.md (if available)
- Audio Analysis: /tmp/video-toolkit-[timestamp]/audio_analysis.md (if available)
- Video Type Assessment: /tmp/video-toolkit-[timestamp]/video-type-assessment.md

Focus on frames [start] through [end] only. Based on video type, provide:
1. Timestamp range covered
2. Visual content description (emphasize type-specific elements)
3. Key elements for this video type (UI/text for screen recordings, actions/setting for vlogs, etc.)
4. Scene changes within your range
5. Correlation with transcript/audio (if applicable)

Save your analysis to: /tmp/video-toolkit-[timestamp]/partial-analyses/part[N].md
```

**Example for Vlog/Personal Video:**

```
Use the video-toolkit:video-frame-analyzer subagent to analyze frames 1-12 from /tmp/video-toolkit-[timestamp]/frames

**Video Type:** Vlog/Personal
**Analysis Focus:**
- Primary: Setting/location, people present, activities happening
- Track: Emotional tone, interactions, objects/items shown
- Note: What person is doing, wearing, holding
- Look For: Personal details (smoking, eating, gestures), environment changes

Files available:
- Frames: frame_0001.png through frame_0012.png
- Metadata: /tmp/video-toolkit-[timestamp]/frames/frames_metadata.json
- Transcript: /tmp/video-toolkit-[timestamp]/transcript.md
- Audio Analysis: /tmp/video-toolkit-[timestamp]/audio_analysis.md
- Video Type Assessment: /tmp/video-toolkit-[timestamp]/video-type-assessment.md

Focus on frames 1-12. Provide:
1. Timestamp range: 0:00 - 0:22
2. Visual content: Describe setting, people, activities with attention to personal details
3. Personal elements: Note smoking, gestures, objects held, clothing, emotional state
4. Scene/environment changes within this range
5. Correlation with what's being said (transcript) and music/ambient audio

Save your analysis to: /tmp/video-toolkit-[timestamp]/partial-analyses/part1.md
```

**Example Task tool invocation:**
```python
# First create the directory
Bash("mkdir -p /tmp/video-toolkit-[timestamp]/partial-analyses")

# Then spawn parallel subagents
Task(
    subagent_type="video-toolkit:video-frame-analyzer",
    description="Analyze frames 1-13",
    prompt="Analyze frames 1-13... Save to: /tmp/video-toolkit-[timestamp]/partial-analyses/part1.md"
)
```

**After parallel analysis completes:**

1. Read all partial analyses from `partial-analyses/` directory (part1.md, part2.md, etc.)
2. Synthesize into a unified comprehensive summary file at `/tmp/video-toolkit-[timestamp]/video-analysis.md`
3. Correlate findings across all sections
4. Clean up: `rm -rf /tmp/video-toolkit-[timestamp]/partial-analyses`
5. **Save comprehensive analysis alongside source video** (see step 7 in Combined Summary Generation below)
6. Present final summary to user

**What the subagent(s) do:**

- **Read frames_metadata.json** for accurate frame-to-timestamp mapping
- **Read transcript.md** (if available) for audio content
- Systematically analyze assigned frames using vision capabilities
- **Correlate visual content with spoken dialogue** using timestamps
- Identify video type, UI elements, text, and visual patterns
- Generate analysis with multimodal correlation


- **Note**: Important quotes, key points, visual aids
- **Look For**: Emotional moments, agreements/disagreements

### Documentary

**Indicators**:

- Visual: B-roll footage, archival material, location shots, graphics
- Audio: Narrator voiceover, ambient audio, music
- Evidence: Documentary storytelling structure

**Analysis Focus**:

- **Primary**: B-roll content, archival material, locations
- **Track**: Text overlays (names, dates, locations), graphics
- **Note**: Historical context, expert interviews, data
- **Look For**: Primary sources, reenactments, maps/timelines

---

## Using the Classification

After determining **perspective** and **content type** from Step 3.5 context clarification:

1. **Select the appropriate analysis focus** from the tables above
2. **Apply type-specific guidance** to visual analysis (Step 5)
3. **Use correct terminology** in subagent prompts and final summary
4. **Avoid misidentification** by respecting the user's stated relationship to the content

**Example for "Stream Viewer" (First-Person Viewer)**:

```python
video_metadata = {
    "video_type": "Watching something",
    "perspective": "First-Person Viewer",
    "content_type": "Stream Viewer",
    "context_tags": ["live stream", "music playing"],
    "analysis_focus": {
        "primary": "Stream content being watched, viewer's environment",
        "track": "BRB screens, stream states, workspace, parallel activities",
        "note": "Music in viewer's space, environmental context, mood",
        "look_for": "Correlation between stream and viewer behavior, thematic connections"
    }
}
```

This metadata guides all subsequent analysis steps.

---

# Restructured Workflow: Optional Song Theme Research

## Current Issue

Song theme research (Step 3d) currently happens automatically after music identification, but:

- Not all videos need thematic music analysis
- Tutorial with background music? Music is just ambiance
- Screen recording with Spotify playing? Not relevant to content
- Wastes time/tokens when music isn't thematically important

## Solution: Move to After Context Clarification

**New sequence**:

1. Frame Extraction
2. Audio Extraction
3. Audio Analysis (Sequential Workflow)
   - 3a. Speech Transcription (Whisper)
   - 3b. Audio Understanding (Gemini)
   - 3c. Music Identification (Shazam - if music detected)
   - ~~3d. Song Theme Research~~ ← **REMOVE FROM HERE**
4. Context Clarification (NEW - Step 3.5)
5. Video Perspective and Type Detection
6. **OPTIONAL: Song Theme Research** ← **MOVE TO HERE (becomes Step 5.5)**
7. Visual Analysis with subagents

## When to Research Song Themes (Conditional Logic)

**Research song themes IF**:

- Video type suggests thematic music importance
- User context indicates artistic/creative intent
- Music plays during significant portions of video
- Multiple perspective/content switches suggest deliberate choices

**Skip song theme research IF**:

- Video type is purely functional (tutorial, screen recording demo)
- Music is brief background ambiance
- User context suggests music is incidental
- Analysis focus doesn't benefit from song meaning

---

## Step 5.5: Optional Song Theme Research (NEW)

**When to Use**: After determining video type and perspective (Steps 3.5 and 4), conditionally research song themes if music appears thematically relevant.

### Decision Logic

**Research song themes for these video types**:

| Video Type | Perspective | When to Research | Reasoning |
|------------|-------------|------------------|-----------|
| **Stream Viewer** | First-Person Viewer | ✅ USUALLY | Music in viewer's space may have thematic connection to stream content or mood |
| **Casual Documentation** | Meta/Hybrid | ✅ USUALLY | Artistic/creative videos often use music deliberately |
| **Personal** | First-Person Creator | ✅ IF ARTISTIC | Only if video seems artistic/experimental vs. casual life clip |
| **Music Video/Creative** | First-Person Creator | ✅ ALWAYS | Music is the primary content |
| **Vlog/Personal** | First-Person Creator | ⚠️ CONDITIONAL | Only if music plays significant role |
| **Behind-the-Scenes** | Meta/Hybrid | ⚠️ CONDITIONAL | Only if music seems intentionally chosen |
| **Tutorial/How-to** | First-Person Creator | ❌ SKIP | Music is background, not thematic |
| **Screen Recording** | First-Person Creator | ❌ SKIP | Music is incidental (Spotify/background) |
| **Presentation** | First-Person Creator | ❌ SKIP | Music not relevant to content |
| **Event/Performance** | Third-Person Observer | ❌ SKIP | Music is part of event, not selected |

### Conditional Check

Before researching song themes, evaluate:

```python
def should_research_song_themes(video_metadata, music_data):
    """
    Determine if song theme research would benefit analysis

    Args:
        video_metadata: From Step 3.5 context clarification
        music_data: From Step 3c music identification

    Returns:
        bool: True if research would be valuable
    """

    # No music detected? Skip
    if not music_data.get("has_music"):
        return False

    # Check video type thematic relevance
    video_type = video_metadata["video_type"]
    perspective = video_metadata["perspective"]

    # Always research for these types
    always_research = [
        "Music Video/Creative",
        "Watching something" + "First-Person Viewer",  # Stream viewer
        "Casual documentation" + "Meta/Hybrid"
    ]

    # Never research for these types
    skip_research = [
        "Tutorial/How-to",
        "Screen recording" + "First-Person Creator",
        "Presentation",
        "Event/Performance"
    ]

    # Check if video type + perspective matches "always" patterns
    if any(pattern in f"{video_type} + {perspective}" for pattern in always_research):
        return True

    # Check if video type matches "skip" patterns
    if any(pattern in video_type for pattern in skip_research):
        return False

    # Conditional cases - check additional factors

    # Music duration significant? (>30% of video)
    music_duration = sum(segment["duration"] for segment in music_data["music_segments"])
    video_duration = video_metadata["evidence"]["duration"]

    if music_duration / video_duration > 0.3:
        return True  # Music plays significant role

    # User context suggests artistic intent?
    context_tags = video_metadata.get("context_tags", [])
    if "artistic/experimental" in context_tags:
        return True

    # Default: skip unless evidence suggests thematic importance
    return False
```

### Implementation

**If research is warranted:**

```python
if should_research_song_themes(video_metadata, music_data):
    # Research themes for each identified song
    for song in music_data["songs"]:
        query = f"{song['title']} {song['artist']} lyrics meaning themes"

        # Try Perplexity first (better for analysis)
        try:
            results = mcp__perplexity_search_web(query, recency="year")
            song["themes"] = extract_themes(results)
        except:
            # Fallback to WebSearch if Perplexity unavailable
            results = WebSearch(query)
            song["themes"] = extract_themes(results)

    # Store theme research in metadata
    video_metadata["song_themes"] = {
        song["title"]: song["themes"] for song in music_data["songs"]
    }
else:
    # Skip research, note music was identified but themes not needed
    video_metadata["song_themes"] = None
    # Music identification results still available in music_data
```

**Communicate decision to user:**

```markdown
✓ Music identified: "Song Title" by Artist Name (2009)
✓ Researching song themes (video appears to use music thematically)
  → Themes: song themes and meaning
```

OR

```markdown
✓ Music identified: "Background Music Track" (ambient)
⊘ Skipping theme research (background music, not thematically relevant)
```

### Benefits

1. **Efficiency**: Don't waste time/tokens on irrelevant research
2. **Precision**: Only research when it enhances understanding
3. **User experience**: Clear communication about what's happening
4. **Flexibility**: Easy to adjust criteria based on video type

### Example Decisions

**Example 1: Stream Viewer Video (Em's case)**

- Video type: "Watching something" (Stream Viewer)
- Music: "Song Title" playing 0:32-1:57 (85% of video duration)
- Decision: ✅ **Research themes** - music significant + viewer perspective
- Result: Themes inform understanding of why this song was chosen

**Example 2: Coding Tutorial**

- Video type: "Tutorial/How-to"
- Music: Lo-fi beats playing throughout
- Decision: ❌ **Skip research** - background ambiance for focus
- Result: Music noted but themes not analyzed

**Example 3: Personal Phone Clip**

- Video type: "Personal"
- Music: 10 seconds of radio in background
- Context tags: None suggesting artistic intent
- Music duration: 10s / 120s = 8%
- Decision: ❌ **Skip research** - incidental background music
- Result: Music noted but not analyzed

**Example 4: Artistic Video Essay**

- Video type: "Personal"
- Music: Specific song playing throughout
- Context tags: ["artistic/experimental"]
- Music duration: 90s / 100s = 90%
- Decision: ✅ **Research themes** - artistic intent + significant duration
- Result: Themes analyzed for artistic interpretation

---

## Updated SKILL.md Structure

```markdown
**3. Audio Analysis (Sequential Workflow)**
- 3a. Speech Transcription (Whisper)
- 3b. Audio Understanding (Gemini)
- 3c. Music Identification (Shazam - if music detected)


*6. Combined Summary Generation**

After the video-frame-analyzer completes its analysis, synthesize all multimodal insights:

**Available Analysis Files:**
- `video-type-assessment.md` - Video type and analysis strategy
- `transcript.md` - Speech transcription (Whisper)
- `audio_analysis.md` - Audio understanding (Gemini)
- `music_identification.md` - Identified songs (Shazam, if music detected)
- `video-analysis.md` - Visual analysis (video-frame-analyzer, type-aware)
- `reconciled_transcript.md` - Reconciled transcript (optional, created by comparing Whisper + Gemini)

**Synthesis Steps:**
1. Review video type assessment to understand analysis context
2. Review visual analysis from video-frame-analyzer (type-aware analysis)
3. If music was identified, review song themes from web search for thematic context
4. **Compare and reconcile transcripts** (OPTIONAL):
   - **ALWAYS spawn a Task subagent (general-purpose) to compare transcripts** (reduces token usage in main thread)
   - The subagent should:
     - Read both `transcript.md` (Whisper) and `audio_analysis.md` (Gemini) for speech content
     - Note that Whisper specializes in speech transcription but can mishear words
     - Note that Gemini Audio API also transcribes speech and may catch errors Whisper missed
     - **Compare the two transcripts** and identify any discrepancies
     - Use context, grammar, and semantic meaning to determine which is more accurate
     - Create a reconciled transcript that uses the most accurate version
     - Document any significant differences and reasoning for choices
     - Save the reconciled transcript to `/tmp/video-toolkit-[timestamp]/reconciled_transcript.md`
   - After subagent completes, read the reconciled transcript for use in synthesis
3. Review audio analysis for non-speech sounds and music description
4. If music was identified, review song details with timestamps
5. **Correlate all insights using timestamps** to create unified narrative
6. Identify synchronization between:
   - What's visible (frames)
   - What's said (Whisper)
   - What's heard (Gemini audio)
   - What music is playing (Shazam)
7. **IMPORTANT: Save comprehensive analysis alongside source video**
   - Copy `/tmp/video-toolkit-[timestamp]/video-analysis.md` to replace the placeholder analysis file
   - Target location: `<video-directory>/<video-name>-analysis.md`
   - This ensures the detailed analysis persists alongside the source video
   - Example: `cp /tmp/video-toolkit-1234567890/video-analysis.md "/path/to/video-analysis.md"`
8. Present comprehensive multimodal summary to user

*7. Discussion and Follow-up**

After generating summary:

- Present findings in markdown format
- Enable conversational follow-up questions
- Offer to extract specific clips or moments
- Provide additional analysis on request

### Video Editing Workflow

For video editing operations, use `scripts/edit_video.py`:

**Clip Video (Extract Segment)**

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py clip <input_video> <start_time> <end_time> <output_video>
```

- `start_time`: Format HH:MM:SS or MM:SS or seconds
- `end_time`: Format HH:MM:SS or MM:SS or seconds
- Example: `${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py clip video.mp4 00:01:30 00:02:45 clip.mp4`

**Merge Videos (Concatenate)**

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py merge <output_video> <input1> <input2> [input3...]
```

- Concatenates multiple videos in order
- Videos should have same codec/resolution for best results
- Example: `${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py merge final.mp4 part1.mp4 part2.mp4 part3.mp4`

**Split Video (By Duration)**

```bash
${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py split <input_video> <segment_duration> <output_prefix>
```

- `segment_duration`: Length of each segment in seconds
- `output_prefix`: Prefix for output files (e.g., "segment" → segment_001.mp4, segment_002.mp4)
- Example: `${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/.venv/bin/python3 ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/edit_video.py split long_video.mp4 300 chunk`

### Orchestration Script (All-in-One Analysis)

For comprehensive analysis, use the orchestration wrapper with clear flag-based arguments:

```bash
# Basic usage (uses interval mode with 2s default - safest for most videos)
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/analyze_video.sh video.mp4

# Interval mode with custom interval
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/analyze_video.sh video.mp4 --interval 3

# Scene detection mode (for videos with clear scene changes like movies)
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/analyze_video.sh video.mp4 --mode scene-detect --threshold 0.05

# With custom whisper model
bash ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit/scripts/analyze_video.sh video.mp4 --interval 2 --whisper-model small
```

**Available Options:**

- `--mode <scene-detect|interval>` - Frame extraction mode (default: interval)
- `--threshold <value>` - Scene detection threshold 0.0-1.0 (default: 0.02)
- `--interval <seconds>` - Interval between frames (default: 2)
- `--whisper-model <model>` - Whisper model: tiny.en, base, small, medium, large (default: base)
- `--help` - Show usage information

This script:

1. Creates temporary working directory
2. Extracts frames at specified interval
3. Extracts audio
4. Transcribes speech with Whisper (local)
5. Analyzes audio with Gemini (API)
6. If music detected, identifies songs with Shazam (API)
7. Organizes results in structured format
8. Returns paths to all artifacts

**Returns:**

- `frames/`: Directory of extracted frames
- `frames/frames_metadata.json`: Frame timestamps
- `audio.wav`: Extracted audio file
- `transcript.md`: Speech transcription (Whisper)
- `audio_analysis.md`: Audio understanding (Gemini)
- `music_identification.md`: Song identification (Shazam, if music detected)
- `analysis-summary.md`: Overview and next steps

## Bundled Resources

### Scripts

**`scripts/install_dependencies.sh`**

- Install FFmpeg, Python venv, Whisper, Gemini API, and Shazam
- One-time setup, run on first use
- Checks for existing installations

**`scripts/setup_api_keys.py`**

- Configure Gemini API key for audio analysis
- Configure Shazam API key (optional, uses public endpoint by default)
- Validates and saves API keys to config file

**`scripts/extract_frames.py`**

- FFmpeg-based frame extraction
- Configurable interval and scene detection modes
- Generates frames_metadata.json with timestamps
- Efficient processing for long videos

**`scripts/extract_audio.py`**

- Extract audio track to WAV format
- Handles various input codecs
- Whisper-compatible output

**`scripts/transcribe_audio.py`**

- Whisper integration for speech transcription
- Model selection support (tiny.en, base, small, medium, large)
- Timestamped output with metadata
- Runs locally (no API key required)

**`scripts/analyze_audio_gemini.py`**

- Gemini Audio API integration for comprehensive audio analysis
- Detects music with precise timestamps
- Identifies non-speech sounds and audio events
- Returns markdown + JSON with music segments

**`scripts/identify_music.py`**

- Shazam integration for music identification
- Extracts music segments based on Gemini timestamps
- Identifies songs with title, artist, album, genre
- Only runs if Gemini detected music

**`scripts/edit_video.py`**

- Unified editing tool (clip, merge, split)
- FFmpeg-based for reliability
- Error handling and validation

**`scripts/analyze_video.sh`**

- Orchestration wrapper for full analysis
- Persists final summary alongside source video
- Automatic cleanup of temporary files
- Structured output format

### References

**`references/ffmpeg_commands.md`**

- Common FFmpeg commands and patterns
- Codec information and best practices
- Troubleshooting guide

## File Management

**Final Analysis Summary:**

The complete analysis summary is automatically saved alongside the source video:

- **Location**: Same directory as the source video
- **Filename**: `<video-name>-analysis.md` (e.g., `test-analysis.md` for `test.mov`)
- **Format**: Markdown with YAML frontmatter
- **Persistence**: Permanent (lives next to your video file)

**Temporary Working Files:**

During analysis, temporary files are created in `/tmp/video-toolkit-{timestamp}/`:

- **Frames**: `frames/` subdirectory with extracted PNG files
- **Audio**: `audio.wav` (if video has audio)
- **Transcript**: `transcript.md` with timestamped speech
- **Audio Analysis**: `audio_analysis.md` (Gemini output)
- **Music Identification**: `music_identification.md` (Shazam output, if music detected)

**Cleanup Workflow:**

After completing video analysis, **ALWAYS** use the **AskUserQuestion** tool to ask the user:

```
Question: "Would you like me to keep these analysis files, or should I clean them up?"
Options:
- "Clean up temporary files" → Run: rm -rf /tmp/video-toolkit-{timestamp}
  (Keeps only the persisted summary: <video-name>-analysis.md)
- "Keep everything" → Inform user of /tmp location for frames/audio/transcripts
  (User responsible for manual cleanup later)
```

**Important Notes:**

- The final summary (`<video-name>-analysis.md`) is **always persisted** alongside the source video
- Temporary files in `/tmp` contain frames, audio, transcripts (can be large)
- User may want to keep frames for visual analysis or audio for further processing
- If keeping files, remind user that `/tmp` persists until reboot or ~3 days on macOS

**Manual Cleanup Commands (rarely needed):**

```bash
# Check if any temp files remain (shouldn't happen)
ls -lh /tmp/video-toolkit-*

# Clean all video-toolkit temp files (if automatic cleanup failed)
rm -rf /tmp/video-toolkit-*

# Check disk usage in /tmp
du -sh /tmp/video-toolkit-* 2>/dev/null || echo "No temp files found (good!)"
```

## Output Format

**Analysis Summary Template:**

```markdown
# Video Analysis: {filename}

## Overview
- **Duration**: MM:SS
- **Resolution**: WxH
- **File Size**: XX MB
- **Analysis Date**: YYYY-MM-DD

## Transcript
[Timestamped transcript from Whisper]

## Visual Analysis
### Scene 1 (00:00 - 00:XX)
- Frame descriptions
- Key moments
- Visual details

### Scene 2 (00:XX - 00:XX)
...

## Key Highlights
- Important moments
- Notable quotes
- Visual highlights

## Summary
Overall narrative and insights

---
*Generated by video-toolkit v1.0.0*
```

## Examples

**Example 1: Analyze Meeting Recording**

```
User: Can you analyze this meeting recording and summarize the key points?

Claude:
1. Run analyze_video.sh on the meeting file
2. Extract frames every 5 seconds
3. Transcribe audio with Whisper (base model)
4. Analyze slides/screen sharing in frames
5. Identify speakers and topics from transcript
6. Generate summary with:
   - Meeting agenda items
   - Decisions made
   - Action items
   - Key discussion points
```

**Example 2: Extract Highlight Clip**

```
User: Extract the segment from 2:30 to 4:15 from this video

Claude:
python scripts/edit_video.py clip input.mp4 00:02:30 00:04:15 highlight.mp4
```

**Example 3: Combine Multiple Clips**

```
User: Merge these three video files into one

Claude:
python scripts/edit_video.py merge final_video.mp4 clip1.mp4 clip2.mp4 clip3.mp4
```

## Troubleshooting

**FFmpeg Not Found:**

- Run `scripts/install_dependencies.sh`
- Or install manually: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)

**Whisper Model Download Slow:**

- Models download on first use
- Models cached in `~/.cache/whisper/`

## Best Practices

1. **Frame Interval Selection**
   - Action videos: 1-2 seconds
   - Dialogue/presentations: 3-5 seconds
   - Surveillance/static: 10+ seconds

2. **Whisper Model Selection**
   - Quick analysis: tiny.en or base
   - Important transcription: medium or large
   - Non-English: Use multilingual models (not .en)

3. **Temp File Management**
   - Clean up after analysis unless user asks to keep
   - Monitor disk space for long videos
   - Use `/tmp` for automatic cleanup on reboot

4. **Video Editing**
   - Keep original files safe (don't overwrite)
   - Use descriptive output filenames
   - Check codec compatibility for merging
