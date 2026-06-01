@echo off
setlocal

:: Configuration
set PUSH_TO_REGISTRY=true
set STACK_NAME=huginn-backend

:: Override with command line argument
if /i "%1"=="nopush" set PUSH_TO_REGISTRY=false
if /i "%1"=="local" set PUSH_TO_REGISTRY=false

echo ========================================
echo Building Docker Images
echo ========================================

docker build -t ghcr.io/werdoxdev/caddy -f Dockerfile.caddy .
if errorlevel 1 goto :error

docker build -t ghcr.io/werdoxdev/huginn-server -f Dockerfile.huginn-server .
if errorlevel 1 goto :error

docker build -t ghcr.io/werdoxdev/huginn-cdn -f Dockerfile.huginn-cdn .
if errorlevel 1 goto :error

docker build -t ghcr.io/werdoxdev/huginn-voice -f Dockerfile.huginn-voice .
if errorlevel 1 goto :error

echo.
echo ========================================
if /i "%PUSH_TO_REGISTRY%"=="true" (
    echo Pushing Images to Registry
    echo ========================================

    docker push ghcr.io/werdoxdev/caddy:latest
    if errorlevel 1 goto :error

    docker push ghcr.io/werdoxdev/huginn-server:latest
    if errorlevel 1 goto :error

    docker push ghcr.io/werdoxdev/huginn-cdn:latest
    if errorlevel 1 goto :error

    docker push ghcr.io/werdoxdev/huginn-voice:latest
    if errorlevel 1 goto :error
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

:error
echo.
echo ========================================
echo ERROR: Deployment failed!
echo ========================================
exit /b 1

:end
endlocal
