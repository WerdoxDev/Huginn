@echo off
setlocal enabledelayedexpansion

:: ========================================
:: Configuration
:: ========================================
set PUSH_TO_REGISTRY=true
set STACK_NAME=huginn-backend

:: Packages: key#image#dockerfile
:: NOTE: field separator is '#', NOT '='.
:: cmd.exe's plain FOR command treats '=' as a default delimiter
:: (same as space/tab/comma/semicolon), so "key=image=dockerfile"
:: silently gets split into 3 separate loop iterations, which is why
:: %%L and %%M were always empty. '#' avoids that.
set PACKAGES=caddy#ghcr.io/werdoxdev/caddy#Dockerfile.caddy huginn-server#ghcr.io/werdoxdev/huginn-server#Dockerfile.huginn-server huginn-cdn#ghcr.io/werdoxdev/huginn-cdn#Dockerfile.huginn-cdn huginn-voice#ghcr.io/werdoxdev/huginn-voice#Dockerfile.huginn-voice

:: Initialize skip flags to false
for %%P in (%PACKAGES%) do (
    set "PKG=%%P"
    call :init_skip
)

:: ========================================
:: Parse command line arguments
:: ========================================
:parse_args
if "%~1"=="" goto :args_done

if /i "%~1"=="nopush" set PUSH_TO_REGISTRY=false
if /i "%~1"=="local" set PUSH_TO_REGISTRY=false

if /i "%~1"=="help" goto :usage
if /i "%~1"=="/?" goto :usage

set "ARG=%~1"
set "PREFIX=!ARG:~0,5!"
if /i "%PREFIX%"=="skip:" (
    set "SKIPLIST=!ARG:~5!"
    call :process_skip "!SKIPLIST!"
)

shift
goto :parse_args

:process_skip
set "LIST=%~1"
set "LIST=%LIST:,= %"
for %%S in (%LIST%) do call :skip_one "%%S"
goto :eof

:skip_one
set "PKGKEY=%~1"
set "FOUND=false"
for %%P in (%PACKAGES%) do (
    set "PKG=%%P"
    call :match_skip
)
if "%FOUND%"=="false" echo WARNING: Unknown package "%PKGKEY%" in skip list, ignoring.
goto :eof

:match_skip
for /f "tokens=1 delims=#" %%K in ("%PKG%") do (
    if /i "%%K"=="%PKGKEY%" (
        set "SKIP_%%K=true"
        set "FOUND=true"
    )
)
goto :eof

:init_skip
for /f "tokens=1 delims=#" %%K in ("%PKG%") do set "SKIP_%%K=false"
goto :eof

:usage
echo Usage: %~n0 [nopush^|local] [skip:pkg1,pkg2,...] [help]
echo.
echo   nopush / local   Build only, do not push or use registry auth on deploy
echo   skip:pkg,...     Skip building ^(and pushing^) the listed packages
echo.
echo Available package keys:
for %%P in (%PACKAGES%) do (
    set "PKG=%%P"
    call :print_key
)
goto :end

:print_key
for /f "tokens=1 delims=#" %%K in ("%PKG%") do echo   - %%K
goto :eof

:args_done

echo ========================================
echo Building Docker Images
echo ========================================

for %%P in (%PACKAGES%) do (
    set "PKG=%%P"
    call :build_one
    if errorlevel 1 goto :error
)

echo.
echo ========================================
if /i "%PUSH_TO_REGISTRY%"=="true" (
    echo Pushing Images to Registry
    echo ========================================

    for %%P in (%PACKAGES%) do (
        set "PKG=%%P"
        call :push_one
        if errorlevel 1 goto :error
    )
) else (
    echo Skipping Registry Push
    echo ========================================
    echo WARNING: Using local images only.
    echo This only works on single-node swarm!
    echo.
)

echo.
echo ========================================
echo Deploying Stack
echo ========================================

:: Remove old stack
echo Removing old stack...
docker stack rm %STACK_NAME% 2>nul
if not errorlevel 1 (
    echo Waiting for stack removal...
    timeout /t 10 /nobreak >nul
)

:: Update Caddy config
echo Updating Caddy config...
docker config rm caddy_config 2>nul
docker config create caddy_config .\Caddyfile
if errorlevel 1 goto :error

:: Deploy new stack
echo Deploying new stack...
if /i "%PUSH_TO_REGISTRY%"=="true" (
    docker stack deploy -c .\docker-stack.yaml %STACK_NAME% --with-registry-auth
) else (
    docker stack deploy -c .\docker-stack.yaml %STACK_NAME%
)
if errorlevel 1 goto :error

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo View services: docker stack services %STACK_NAME%
echo View logs: docker service logs %STACK_NAME%_[service_name] -f
echo.

goto :end

:build_one
for /f "tokens=1,2,3 delims=#" %%K in ("%PKG%") do (
    call set "ISSKIP=%%SKIP_%%K%%"
    if /i "!ISSKIP!"=="true" (
        echo Skipping build: %%K
    ) else (
        echo Building %%K...
        docker build -t %%L -f %%M .
    )
)
goto :eof

:push_one
for /f "tokens=1,2 delims=#" %%K in ("%PKG%") do (
    call set "ISSKIP=%%SKIP_%%K%%"
    if /i "!ISSKIP!"=="true" (
        echo Skipping push: %%K
    ) else (
        docker push %%L:latest
    )
)
goto :eof

:error
echo.
echo ========================================
echo ERROR: Deployment failed!
echo ========================================
exit /b 1

:end
endlocal
