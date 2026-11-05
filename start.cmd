@echo off
setlocal
node "%~dp0scripts\serve.mjs"
if errorlevel 1 (
  echo.
  echo The workspace could not start. Check that Node.js 20 or newer is installed.
  pause
)
