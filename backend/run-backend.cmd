@echo off
setlocal
cd /d "%~dp0"
echo Starting Celestia backend from %CD%
echo Keep this window open while using the application.
node start-with-dns.mjs
if errorlevel 1 (
  echo.
  echo Backend stopped with an error. Check backend/.env and MongoDB access.
  pause
)
