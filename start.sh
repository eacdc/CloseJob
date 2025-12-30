#!/bin/bash

echo "========================================"
echo "Job Completion System - Local Server"
echo "========================================"
echo ""
echo "Starting local web server on port 8000..."
echo ""
echo "Open your browser and go to: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000

