#!/usr/bin/env python3
"""
Read exported Google Docs files using appropriate tools.

This script provides a unified interface for reading exported Google Docs:
- DOCX: Uses pandoc for markdown conversion
- XLSX: Uses pandas for data analysis
- PPTX: Uses pandoc for text extraction
"""

import sys
import subprocess
import argparse
from pathlib import Path
import json


def read_docx(file_path, output_format='markdown'):
    """
    Read a DOCX file using pandoc.

    Args:
        file_path: Path to DOCX file
        output_format: Output format (markdown, plain, json)

    Returns:
        str: Converted content
    """
    formats = {
        'markdown': 'markdown',
        'md': 'markdown',
        'plain': 'plain',
        'txt': 'plain',
        'json': 'json'
    }

    pandoc_format = formats.get(output_format, 'markdown')

    try:
        result = subprocess.run(
            ['pandoc', str(file_path), '-t', pandoc_format],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error converting DOCX: {e.stderr}", file=sys.stderr)
        raise
    except FileNotFoundError:
        print("Error: pandoc not found. Install with: brew install pandoc", file=sys.stderr)
        raise


def read_xlsx(file_path, output_format='summary'):
    """
    Read an XLSX file using pandas.

    Args:
        file_path: Path to XLSX file
        output_format: Output format (summary, csv, json)

    Returns:
        str: Data representation
    """
    try:
        import pandas as pd
    except ImportError:
        print("Error: pandas not found. Install with: pip install pandas openpyxl", file=sys.stderr)
        raise

    # Read all sheets with date parsing disabled to avoid datetime conversion issues
    # This keeps dates as strings for better display in summary format
    sheets = pd.read_excel(file_path, sheet_name=None, parse_dates=False)

    if output_format == 'summary':
        output = []
        output.append(f"Spreadsheet: {Path(file_path).name}")
        output.append(f"Sheets: {len(sheets)}\n")

        for sheet_name, df in sheets.items():
            output.append(f"## Sheet: {sheet_name}")
            output.append(f"Dimensions: {df.shape[0]} rows × {df.shape[1]} columns")

            # Convert columns to strings to handle datetime and other types
            column_names = [str(col) for col in df.columns.tolist()]
            output.append(f"\nColumns: {', '.join(column_names)}")
            output.append(f"\nPreview (first 10 rows):")
            output.append(df.head(10).to_string())

            # Only show statistics for numeric columns
            numeric_df = df.select_dtypes(include=['number'])
            if not numeric_df.empty:
                output.append(f"\nStatistics:")
                output.append(numeric_df.describe().to_string())

            output.append("\n" + "="*80 + "\n")

        return "\n".join(output)

    elif output_format == 'csv':
        # Convert first sheet to CSV
        first_sheet = list(sheets.values())[0]
        return first_sheet.to_csv(index=False)

    elif output_format == 'json':
        # Convert all sheets to JSON
        result = {}
        for sheet_name, df in sheets.items():
            result[sheet_name] = df.to_dict(orient='records')
        return json.dumps(result, indent=2)

    else:
        raise ValueError(f"Unknown output format: {output_format}")


def read_pptx(file_path, output_format='markdown'):
    """
    Read a PPTX file using pandoc.

    Args:
        file_path: Path to PPTX file
        output_format: Output format (markdown, plain, json)

    Returns:
        str: Converted content
    """
    formats = {
        'markdown': 'markdown',
        'md': 'markdown',
        'plain': 'plain',
        'txt': 'plain',
        'json': 'json'
    }

    pandoc_format = formats.get(output_format, 'markdown')

    try:
        result = subprocess.run(
            ['pandoc', str(file_path), '-t', pandoc_format],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error converting PPTX: {e.stderr}", file=sys.stderr)
        raise
    except FileNotFoundError:
        print("Error: pandoc not found. Install with: brew install pandoc", file=sys.stderr)
        raise


def read_exported_doc(file_path, output_format=None):
    """
    Read an exported Google Docs file using the appropriate tool.

    Args:
        file_path: Path to exported file (DOCX, XLSX, or PPTX)
        output_format: Desired output format (auto-detected if None)

    Returns:
        str: File content in requested format
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    extension = path.suffix.lower()

    if extension == '.docx':
        return read_docx(file_path, output_format or 'markdown')
    elif extension == '.xlsx':
        return read_xlsx(file_path, output_format or 'summary')
    elif extension == '.pptx':
        return read_pptx(file_path, output_format or 'markdown')
    else:
        raise ValueError(f"Unsupported file type: {extension}")


def main():
    parser = argparse.ArgumentParser(
        description='Read exported Google Docs files (DOCX, XLSX, PPTX)'
    )
    parser.add_argument(
        'file',
        help='Path to exported file'
    )
    parser.add_argument(
        '-f', '--format',
        help='Output format (markdown, plain, json, summary, csv)',
        default=None
    )
    parser.add_argument(
        '-o', '--output',
        help='Output file (default: stdout)',
        default=None
    )

    args = parser.parse_args()

    try:
        content = read_exported_doc(args.file, args.format)

        if args.output:
            with open(args.output, 'w') as f:
                f.write(content)
            print(f"✅ Output saved to: {args.output}")
        else:
            print(content)

        return 0
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
