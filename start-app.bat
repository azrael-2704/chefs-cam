@echo off
echo Starting Smart Recipe Generator...

:: This command makes the script run relative to its own location
cd /d "%~dp0"

:: --- Start Backend ---
echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "conda activate chefs-cam && python main.py"

:: Give the backend a moment to start up
timeout /t 5

:: --- Start Frontend ---
echo Starting Frontend Development Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting up...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs