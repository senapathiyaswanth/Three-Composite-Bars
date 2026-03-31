@echo off
setlocal
:: ═══════════════════════════════════════════════
# INTELLISTRUCT – COMPOSITE BAR ANALYZER
# Automated Developer Start-up Utility
# ═══════════════════════════════════════════════

set PROJECT_ROOT=%~dp0..
cd /d %PROJECT_ROOT%

echo [1/3] 🔌 Checking Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Task killing internal process %%a...
    taskkill /F /PID %%a
)

echo [2/3] 🔌 Checking Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Task killing internal process %%a...
    taskkill /F /PID %%a
)

echo [3/3] 🚀 Launching Integrated Services...

:: --- Backend ---
start "IntelliStruct-Backend" cmd /c "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: --- Frontend ---
start "IntelliStruct-Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo 🌊 MosF Platform is now scaling...
echo ➜  Backend:  http://localhost:8000
echo ➜  Frontend: http://localhost:5173
echo.
echo Press any key to stop all processes gracefully...
pause > nul

taskkill /F /FI "WINDOWTITLE eq IntelliStruct-Backend"
taskkill /F /FI "WINDOWTITLE eq IntelliStruct-Frontend"
echo 🌈 System shutdown complete.
exit
