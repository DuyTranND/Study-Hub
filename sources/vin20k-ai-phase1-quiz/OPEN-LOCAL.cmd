@echo off
powershell.exe -NoProfile -File "%~dp0OPEN-LOCAL.ps1"
if errorlevel 1 pause
