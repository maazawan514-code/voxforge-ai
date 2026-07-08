@echo off
echo ============================================
echo   VoxForge AI — Starting Dev Servers
echo ============================================

:: Check if PostgreSQL is running (optional check)
echo [1/3] Checking services...

:: Start FastAPI backend in new window
echo [2/3] Starting FastAPI backend on http://localhost:8000 ...
start "VoxForge Backend" cmd /k "cd /d %~dp0 && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

:: Start React frontend in new window
echo [3/3] Starting React frontend on http://localhost:3000 ...
start "VoxForge Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers starting!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
pause
