@echo off
echo ==========================================
echo   ESCAPE ROOM - Multi-Port Setup
echo ==========================================
echo.

:: Default ports
set FRONTEND_PORT=3001
set BACKEND_PORT=8001

:: Allow custom ports via command line arguments
if not "%~1"=="" set FRONTEND_PORT=%~1
if not "%~2"=="" set BACKEND_PORT=%~2

echo Frontend will run on port: %FRONTEND_PORT%
echo Backend will run on port: %BACKEND_PORT%
echo.

:: Start Backend
echo [1/2] Starting Backend on port %BACKEND_PORT%...
start "Backend Server" cmd /k "cd backend && set PORT=%BACKEND_PORT% && python server.py"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend on port %FRONTEND_PORT%...
start "Frontend Server" cmd /k "cd frontend && set PORT=%FRONTEND_PORT% && npm start"

echo.
echo ==========================================
echo   Both servers are starting...
echo ==========================================
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%BACKEND_PORT%
echo.
echo Press any key to stop all servers...
pause >nul

:: Kill all node and python processes (optional cleanup)
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo Servers stopped.
