@echo off
echo Starting Mekeni Game Engine Development Server...
echo.
echo Navigate to: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
python -m http.server 8000
pause
