#!/usr/bin/env python3
"""
Export Google Docs, Sheets, and Slides to local files.

This script:
1. Parses Google Drive URLs or .gdoc/.gsheet/.gslides files
2. Extracts document IDs
3. Opens export URLs in the default browser (uses existing auth)
4. Monitors Downloads folder for the new file
5. Moves it to a temp directory
6. Returns the path to the downloaded file
"""

import json
import sys
import time
import subprocess
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import argparse
import tempfile
import shutil


# Export format mappings
EXPORT_FORMATS = {
    'document': {'format': 'docx', 'extension': '.docx'},
    'spreadsheets': {'format': 'xlsx', 'extension': '.xlsx'},
    'presentation': {'format': 'pptx', 'extension': '.pptx'}
}

# File extension to doc type mapping
FILE_EXT_TO_TYPE = {
    '.gdoc': 'document',
    '.gsheet': 'spreadsheets',
    '.gslides': 'presentation'
}


def extract_doc_id(input_path):
    """
    Extract document ID from various input formats.

    Args:
        input_path: Can be:
            - Google Drive URL (https://docs.google.com/document/d/ABC123/edit)
            - Path to .gdoc/.gsheet/.gslides file
            - Raw document ID

    Returns:
        tuple: (doc_id, doc_type) where doc_type is 'document', 'spreadsheets', or 'presentation'
    """
    # Check if it's a file path
    path = Path(input_path)
    if path.exists() and path.suffix in FILE_EXT_TO_TYPE:
        # Read JSON file
        with open(path, 'r') as f:
            data = json.load(f)
            doc_id = data.get('doc_id')
            doc_type = FILE_EXT_TO_TYPE[path.suffix]
            return doc_id, doc_type

    # Check if it's a URL
    if input_path.startswith('http'):
        parsed = urlparse(input_path)
        path_parts = parsed.path.split('/')

        # Determine doc type from URL
        if '/document/' in input_path:
            doc_type = 'document'
        elif '/spreadsheets/' in input_path:
            doc_type = 'spreadsheets'
        elif '/presentation/' in input_path:
            doc_type = 'presentation'
        else:
            raise ValueError(f"Unknown Google Docs URL format: {input_path}")

        # Extract ID from path (format: /document/d/ID/...)
        try:
            d_index = path_parts.index('d')
            doc_id = path_parts[d_index + 1]
            return doc_id, doc_type
        except (ValueError, IndexError):
            raise ValueError(f"Could not extract document ID from URL: {input_path}")

    # Assume it's a raw doc ID - default to document type
    return input_path, 'document'


def build_export_url(doc_id, doc_type):
    """Build the export URL for the given document."""
    format_info = EXPORT_FORMATS[doc_type]
    base_url = f"https://docs.google.com/{doc_type}/d/{doc_id}/export"

    if doc_type == 'presentation':
        # Presentations use a slightly different URL format
        return f"{base_url}/{format_info['format']}"
    else:
        return f"{base_url}?format={format_info['format']}"


def get_downloads_folder():
    """Get the user's Downloads folder."""
    return Path.home() / "Downloads"


def wait_for_download(downloads_folder, extension, timeout=30, initial_files=None):
    """
    Monitor Downloads folder for a new file with the given extension.

    Args:
        downloads_folder: Path to Downloads folder
        extension: File extension to look for (e.g., '.docx')
        timeout: Maximum seconds to wait
        initial_files: Set of files that existed before download started

    Returns:
        Path to the downloaded file, or None if timeout
    """
    if initial_files is None:
        initial_files = set()

    start_time = time.time()

    while time.time() - start_time < timeout:
        current_files = set(downloads_folder.glob(f'*{extension}'))
        new_files = current_files - initial_files

        if new_files:
            # Return the most recently modified file
            return max(new_files, key=lambda p: p.stat().st_mtime)

        time.sleep(0.5)

    return None


def export_gdoc(input_path, output_dir=None, wait_timeout=30):
    """
    Export a Google Docs file to a local format.

    Args:
        input_path: URL or path to .gdoc file
        output_dir: Directory to save the exported file (defaults to temp directory)
        wait_timeout: Seconds to wait for download to complete

    Returns:
        Path to the exported file
    """
    # Extract document ID and type
    doc_id, doc_type = extract_doc_id(input_path)
    format_info = EXPORT_FORMATS[doc_type]
    extension = format_info['extension']

    print(f"Exporting {doc_type}: {doc_id}")
    print(f"Format: {format_info['format']}")

    # Get current files in Downloads before triggering download
    downloads_folder = get_downloads_folder()
    initial_files = set(downloads_folder.glob(f'*{extension}'))

    # Build and open export URL in browser
    export_url = build_export_url(doc_id, doc_type)
    print(f"Opening export URL in browser: {export_url}")
    subprocess.run(['open', export_url], check=True)

    # Wait for file to appear in Downloads
    print(f"Waiting for download to complete (timeout: {wait_timeout}s)...")
    downloaded_file = wait_for_download(downloads_folder, extension, wait_timeout, initial_files)

    if not downloaded_file:
        raise TimeoutError(f"Download did not complete within {wait_timeout} seconds")

    print(f"Download complete: {downloaded_file}")

    # Move to output directory
    if output_dir is None:
        output_dir = Path(tempfile.gettempdir()) / "gdoc_exports"
        output_dir.mkdir(exist_ok=True)
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique filename based on doc_id
    output_file = output_dir / f"{doc_id}{extension}"

    # If file already exists, remove it
    if output_file.exists():
        output_file.unlink()

    # Move the file
    shutil.move(str(downloaded_file), str(output_file))
    print(f"Moved to: {output_file}")

    return output_file


def main():
    parser = argparse.ArgumentParser(
        description='Export Google Docs, Sheets, and Slides to local files'
    )
    parser.add_argument(
        'input',
        help='Google Drive URL, .gdoc/.gsheet/.gslides file path, or document ID'
    )
    parser.add_argument(
        '-o', '--output-dir',
        help='Output directory (defaults to temp directory)',
        default=None
    )
    parser.add_argument(
        '-t', '--timeout',
        type=int,
        default=30,
        help='Download timeout in seconds (default: 30)'
    )

    args = parser.parse_args()

    try:
        output_file = export_gdoc(args.input, args.output_dir, args.timeout)
        print(f"\n✅ Success! File saved to: {output_file}")
        return 0
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
