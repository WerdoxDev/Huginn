@echo off
REM Script to count lines of code excluding node_modules and src-tauri using cloc

REM Check if cloc is installed
where cloc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo cloc is not installed. Please install cloc and ensure it is in your PATH.
    exit /b 1
)

REM Run cloc per file and output to count.csv
@REM cloc --vcs=git --by-file --csv --out=count.csv .

@REM Run cloc normally
cloc --vcs=git .

REM Exit the script
exit /b 0
