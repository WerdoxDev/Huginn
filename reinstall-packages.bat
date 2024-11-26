@echo off
:: Confirm user wants to proceed
echo This will delete all "node_modules" folders from the current directory and subdirectories.
set /p "confirm=Are you sure? (y/n): "
if /i not "%confirm%"=="y" (
    echo Operation canceled.
    exit /b
)

:: Loop through and delete all node_modules folders
for /d /r . %%d in (node_modules) do (
    echo Deleting folder: %%d
    rd /s /q "%%d"
)

echo All "node_modules" folders have been deleted.
echo Installing packages...
powershell -Command "bun i"
pause
