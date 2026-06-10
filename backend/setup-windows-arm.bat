@echo off
echo ===============================================
echo OpenRoad Agent - Backend Setup
echo ===============================================
echo.
echo NOTE: Windows ARM64 is not supported for local development.
echo.
echo RECOMMENDED OPTIONS:
echo.
echo 1. Use WSL2 (Windows Subsystem for Linux)
echo    - Install WSL2: wsl --install
echo    - Run all npm/wrangler commands in WSL2
echo.
echo 2. Deploy directly to Cloudflare (no local dev)
echo    - Set up secrets via Cloudflare dashboard
echo    - Deploy: npm run deploy
echo.
echo 3. Use Cloudflare Dashboard for development
echo    - Go to dash.cloudflare.com
echo    - Create a new Worker manually
echo    - Upload your code via the dashboard
echo.
echo ===============================================
echo.
pause
