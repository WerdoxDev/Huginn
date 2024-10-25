@echo off
REM Script to count lines of code excluding node_modules and src-tauri using cloc

REM Check if cloc is installed
where cloc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo cloc is not installed. Please install cloc and ensure it is in your PATH.
    exit /b 1
)

REM Run cloc and exclude node_modules
cloc --exclude-dir=node_modules,src-tauri .

REM Exit the script
exit /b 0
