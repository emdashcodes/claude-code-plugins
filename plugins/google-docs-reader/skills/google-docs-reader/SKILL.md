---
name: google-docs-reader
description: Read and analyze Google Docs, Sheets, and Slides by exporting them to local formats (DOCX, XLSX, PPTX) via browser download. Use this skill when users request to read, summarize, or analyze content from Google Drive URLs or .gdoc/.gsheet/.gslides files.
---

# Google Docs Reader

## Overview

Read and analyze Google Workspace documents (Docs, Sheets, Slides) without direct API access. This skill exports Google Drive documents to local formats by opening export URLs in the browser, monitoring the Downloads folder, and moving files to a temporary directory for processing.

## When to Use This Skill

Activate this skill when users ask to:

- Read or summarize Google Docs, Sheets, or Slides
- Extract content from Google Drive URLs
- Analyze `.gdoc`, `.gsheet`, or `.gslides` files from Google Drive File Stream/Desktop
- Process multiple Google Workspace documents

**Example user requests:**

- "Read this Google Doc and summarize it: <https://docs.google.com/document/d/ABC123/edit>"
- "What's in this spreadsheet?" (pointing to a `.gsheet` file)
- "Analyze the data in this Google Sheets URL"
- "Convert this Google Slides to markdown"

## How It Works

The skill uses a browser-based export workflow:

1. **Extract document ID** from URL or `.gdoc`/`.gsheet`/`.gslides` file
2. **Determine document type** (Docs, Sheets, or Slides)
3. **Build export URL** with appropriate format (DOCX, XLSX, PPTX)
4. **Open URL in browser** (leverages existing Google account session)
5. **Monitor Downloads folder** for the downloaded file
6. **Move to temp directory** (`/tmp/gdoc_exports/`)
7. **Process with document skills** (docx, xlsx, pptx skills)
8. **Clean up** temporary file after reading

## Export Formats

- **Google Docs** → DOCX (Microsoft Word format)
- **Google Sheets** → XLSX (Microsoft Excel format)
- **Google Slides** → PPTX (Microsoft PowerPoint format)

## Reading Google Docs

### Complete Workflow (Export + Read)

The simplest approach is to use both scripts together:

```bash
# 1. Export the Google Doc
EXPORTED=$(python3 ${CLAUDE_PLUGIN_ROOT}/skills/google-docs-reader/scripts/export_gdoc.py "<google-drive-url-or-file>")

# 2. Read the exported file
python3 ${CLAUDE_PLUGIN_ROOT}/skills/google-docs-reader/scripts/read_exported_doc.py "$EXPORTED"
```

### Step-by-Step Workflow

#### Step 1: Export

Run the export script with your Google Docs URL or file:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/google-docs-reader/scripts/export_gdoc.py <input>
```

Where `<input>` can be:

- Google Drive URL (e.g., `https://docs.google.com/document/d/ABC123/edit`)
- Path to `.gdoc`, `.gsheet`, or `.gslides` file
- Raw document ID (assumes Google Docs type)

The script will:

- Open the export URL in the default browser
- Wait up to 30 seconds for download to complete
- Move file to `/tmp/gdoc_exports/{DOC_ID}.{extension}`
- Print the output file path

#### Step 2: Read

Read the exported file using the integrated reading script:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/google-docs-reader/scripts/read_exported_doc.py <exported-file>
```

This automatically uses the appropriate tool based on file type:

- **DOCX** → pandoc (markdown conversion)
- **XLSX** → pandas (data analysis with preview, statistics)
- **PPTX** → pandoc (text/markdown extraction)

### Example Usage

**Reading a Google Doc:**

```bash
# Export
python3 scripts/export_gdoc.py "https://docs.google.com/document/d/1abc.../edit"
# Output: /tmp/gdoc_exports/1abc...docx

# Read as markdown
python3 scripts/read_exported_doc.py /tmp/gdoc_exports/1abc...docx
```

**Reading a Google Sheet:**

```bash
# Export
python3 scripts/export_gdoc.py "https://docs.google.com/spreadsheets/d/1xyz.../edit"
# Output: /tmp/gdoc_exports/1xyz...xlsx

# Read with data analysis
python3 scripts/read_exported_doc.py /tmp/gdoc_exports/1xyz...xlsx
# Shows: sheet names, dimensions, columns, preview, statistics
```

**Reading a Google Slides:**

```bash
# Export
python3 scripts/export_gdoc.py "https://docs.google.com/presentation/d/1def.../edit"
# Output: /tmp/gdoc_exports/1def...pptx

# Read as markdown
python3 scripts/read_exported_doc.py /tmp/gdoc_exports/1def...pptx
```

### Script Options

```bash
python3 scripts/export_gdoc.py <input> [options]

Options:
  -o, --output-dir DIR    Output directory (default: /tmp/gdoc_exports)
  -t, --timeout SECONDS   Download timeout (default: 30)
  -h, --help              Show help message
```

## Processing Exported Files

After export, use the appropriate tool to read content:

### Google Docs (DOCX)

- **Activate docx skill** if available
- **Use pandoc** for markdown conversion: `pandoc file.docx -t markdown`
- **Read directly** with document processing tools

### Google Sheets (XLSX)

- **Activate xlsx skill** if available for data analysis
- **Use pandas** for programmatic access
- **Convert to CSV** for simple text processing

### Google Slides (PPTX)

- **Activate pptx skill** if available
- **Use pandoc** for text extraction: `pandoc file.pptx -t markdown`
- **Extract speaker notes** with PowerPoint libraries

## Authentication Requirements

**Important:** This skill requires the user to be logged into Google in their default browser. The browser-based export method uses existing session cookies, avoiding the need for API credentials or OAuth flows.

If exports fail with authentication errors, ask the user to:

1. Open the browser and log into the Google account
2. Verify the account has access to the document
3. Try the export again

## Cleanup

Exported files are stored in `/tmp/gdoc_exports/` by default. This directory can be cleaned up manually or automatically:

```bash
# Remove all exported files
rm -rf /tmp/gdoc_exports/

# Remove specific file after processing
rm /tmp/gdoc_exports/{DOC_ID}.docx
```

## Troubleshooting

### Download timeout

If downloads take longer than 30 seconds:

```bash
python3 scripts/export_gdoc.py <input> --timeout 60
```

### File not found in Downloads

- Check that browser is set to download files to `~/Downloads`
- Verify no "Save As" dialog is blocking the download
- Ensure sufficient disk space

### Authentication errors

- Log into Google account in the browser
- Verify document sharing permissions
- Try opening the document URL manually first

## Dependencies

The reading functionality requires these tools:

- **pandoc**: For reading DOCX and PPTX files

  ```bash
  brew install pandoc  # macOS
  ```

- **pandas + openpyxl**: For reading XLSX files

  ```bash
  pip3 install pandas openpyxl
  ```

These dependencies are only needed for the reading step, not for export.

## Resources

### scripts/export_gdoc.py

Python script that handles the complete export workflow:

- Parses Google Drive URLs and `.gdoc` files
- Extracts document IDs and determines document types
- Builds and opens export URLs
- Monitors Downloads folder
- Moves files to temp directory

Execute directly or import as a module for custom workflows.

### scripts/read_exported_doc.py

Python script that reads exported files using appropriate tools:

- **DOCX files**: Converts to markdown using pandoc
- **XLSX files**: Analyzes with pandas (shows preview, statistics, sheet info)
- **PPTX files**: Extracts text using pandoc

Supports multiple output formats:

- DOCX: `markdown` (default), `plain`, `json`
- XLSX: `summary` (default), `csv`, `json`
- PPTX: `markdown` (default), `plain`, `json`

Usage:

```bash
python3 scripts/read_exported_doc.py <file> [--format <format>] [--output <file>]
```

### references/export_formats.md

Detailed reference on:

- Available export formats for each Google Workspace type
- URL patterns and format parameters
- Quality trade-offs between formats
- Document ID extraction methods
- Authentication requirements

Load this file when users ask about format options or need deeper understanding of export mechanisms.
