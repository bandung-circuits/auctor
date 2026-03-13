#!/bin/bash
# export.sh - Export final article to DOCX and PDF
#
# Usage:
#   ./scripts/export.sh workspace/{RUN_ID}/08.article/article.md
#
# Output goes to the same workspace run directory: workspace/{RUN_ID}/_output/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Input file (required argument)
INPUT_FILE="$1"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: ./scripts/export.sh workspace/{RUN_ID}/08.article/article.md"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Derive output directory from input file path (go up from 08.article/ to run root)
ARTICLE_DIR="$(cd "$(dirname "$INPUT_FILE")" && pwd)"
RUN_DIR="$(dirname "$ARTICLE_DIR")"
OUTPUT_DIR="${RUN_DIR}/_output"

# Extract title from first heading
TITLE=$(grep -m 1 '^# ' "$INPUT_FILE" | sed 's/^# //')
if [ -z "$TITLE" ]; then
    echo "Error: No title found (expected '# Title' on first line)"
    exit 1
fi

# Sanitize title for filename (replace invalid chars with -)
SAFE_TITLE=$(echo "$TITLE" | sed 's/[:<>"|?*\/\\]/-/g' | sed 's/  */ /g')

# Add timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BASENAME="${SAFE_TITLE} [${TIMESTAMP}]"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Template files
DOCX_TEMPLATE="${SCRIPT_DIR}/docx-template.docx"
LATEX_HEADER="${SCRIPT_DIR}/latex-header.tex"

# Run pandoc from the article directory so relative paths (../images/) resolve naturally
ORIG_DIR="$(pwd)"
cd "$ARTICLE_DIR"
INPUT_BASENAME="$(basename "$INPUT_FILE")"

# Export to DOCX
echo "Exporting to DOCX..."
if [ -f "$DOCX_TEMPLATE" ]; then
    pandoc "$INPUT_BASENAME" \
        --reference-doc="$DOCX_TEMPLATE" \
        -o "${OUTPUT_DIR}/${BASENAME}.docx"
else
    pandoc "$INPUT_BASENAME" \
        -o "${OUTPUT_DIR}/${BASENAME}.docx"
fi
echo "Created: ${OUTPUT_DIR}/${BASENAME}.docx"

# Export to PDF
echo "Exporting to PDF..."
if [ -f "$LATEX_HEADER" ]; then
    pandoc "$INPUT_BASENAME" \
        --pdf-engine=xelatex \
        -H "$LATEX_HEADER" \
        -o "${OUTPUT_DIR}/${BASENAME}.pdf"
else
    pandoc "$INPUT_BASENAME" \
        --pdf-engine=xelatex \
        -o "${OUTPUT_DIR}/${BASENAME}.pdf"
fi
echo "Created: ${OUTPUT_DIR}/${BASENAME}.pdf"

cd "$ORIG_DIR"

echo "Export complete!"
