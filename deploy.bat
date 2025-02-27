@echo off

echo **/huginn-cdn>> .dockerignore
docker build -t ghcr.io/werdoxdev/huginn-server -f Dockerfile.huginn-server .
git checkout .dockerignore

echo **/huginn-server>> .dockerignore
docker build -t ghcr.io/werdoxdev/huginn-cdn -f Dockerfile.huginn-cdn .
git checkout .dockerignore

docker push ghcr.io/werdoxdev/huginn-server:latest
docker push ghcr.io/werdoxdev/huginn-cdn:latest

docker stack rm huginn-backend
docker config rm caddy_config
docker config create caddy_config .\Caddyfile
docker stack deploy -c .\docker-stack.yaml huginn-backend --with-registry-auth
