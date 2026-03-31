@echo off
setlocal
:: ═══════════════════════════════════════════════
# INTELLISTRUCT – ENVIRONMENT SETUP UTILITY
# Composite Bar Analyzer – Full-Stack System
# ═══════════════════════════════════════════════

set PROJECT_ROOT=%~dp0..
cd /d %PROJECT_ROOT%

echo [1/4] 📦 Setting up Backend (Python)...
cd backend
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate
echo Installing requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
)
cd ..

echo [2/4] 🛠️ Setting up Frontend (Node.js)...
cd frontend
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
)
cd ..

echo [3/4] 📁 Initializing Reports Directory...
if not exist reports (
    mkdir reports
)

echo [4/4] ✅ Setup Complete!
echo You can now launch the platform using: scripts\start.bat
echo or by running "npm run dev" in frontend and "uvicorn app.main:app" in backend.
pause
exit
