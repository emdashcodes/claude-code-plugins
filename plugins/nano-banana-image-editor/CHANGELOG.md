# Changelog

All notable changes to the nano-banana-image-editor plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-21

### Added

- New "Recreating Templates with Different Characters" section in SKILL.md with guidance on passing both template and character references

### Fixed

- Corrected `ImageConfig` parameter names to use Python snake_case (`aspect_ratio` and `image_size` instead of camelCase `aspectRatio` and `imageSize`)
- Documented that prompts requesting "remove watermark" trigger Gemini content policy blocks to protect SynthID watermarks

## [1.0.0] - 2025-11-21

### Added

- Initial release of nano-banana-image-editor plugin
- Image creation using Gemini 3 Pro Image model
- PIL/Pillow integration for quick cropping operations
- `/nano-banana-image-editor:image` slash command for easy access
- Automated dependency installation script
- Gemini API token setup script
- Comprehensive prompting guide with best practices
