# Changelog

All notable changes to the video-toolkit plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-22

### Added
- Initial release of video-toolkit plugin
- Frame extraction from videos at specified intervals
- Scene detection mode for intelligent frame extraction
- Audio extraction and Whisper-based transcription
- Silent video handling (gracefully skips transcription)
- Video editing operations (clip, merge, split)
- Multi-modal analysis combining visual frames and audio transcripts
- Markdown output for transcripts (`transcript.md`) with YAML frontmatter
- Markdown analysis summaries (`analysis-summary.md`) with YAML frontmatter
- `/video-toolkit` slash command for video analysis
- `/upgrade` command for automatic plugin updates
- PreToolUse:Read hook that intercepts video file reads and suggests using video-toolkit
- Automatic video file detection and analysis workflow guidance
- FFmpeg integration for reliable video processing
- Python 3.12 support (recommended version)
- Comprehensive summary generation with discussion support
