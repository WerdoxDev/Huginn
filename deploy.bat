@echo off

echo *> .dockerignore
docker build -t ghcr.io/werdoxdev/caddy -f Dockerfile.caddy .
git checkout .dockerignore

echo **/huginn-cdn>> .dockerignore
echo **/huginn-voice>> .dockerignore
docker build -t ghcr.io/werdoxdev/huginn-server -f Dockerfile.huginn-server .
git checkout .dockerignore

echo **/huginn-server>> .dockerignore
echo **/huginn-voice>> .dockerignore
docker build -t ghcr.io/werdoxdev/huginn-cdn -f Dockerfile.huginn-cdn .
git checkout .dockerignore

echo **/huginn-server>> .dockerignore
echo **/huginn-cdn>> .dockerignore
docker build -t ghcr.io/werdoxdev/huginn-voice -f Dockerfile.huginn-voice .
git checkout .dockerignore

docker push ghcr.io/werdoxdev/caddy:latest
docker push ghcr.io/werdoxdev/huginn-server:latest
docker push ghcr.io/werdoxdev/huginn-cdn:latest
docker push ghcr.io/werdoxdev/huginn-voice:latest

docker stack rm huginn-backend
docker config rm caddy_config
docker config create caddy_config .\Caddyfile
docker stack deploy -c .\docker-stack.yaml huginn-backend --with-registry-auth
