@echo off
echo Starting local web server...
echo Open your browser to: http://localhost:8000
echo Press Ctrl+C to stop the server
python -m http.server 8000
pause
