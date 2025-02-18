@echo off

docker build -t ghcr.io/werdoxdev/huginn-server -f Dockerfile.huginn-server .
docker build -t ghcr.io/werdoxdev/huginn-cdn -f Dockerfile.huginn-cdn .

docker push ghcr.io/werdoxdev/huginn-server:latest
docker push ghcr.io/werdoxdev/huginn-cdn:latest

docker stack rm huginn-backend
docker config rm caddy_config
docker config create caddy_config .\Caddyfile
timeout 5
docker stack deploy -c .\docker-stack.yaml huginn-backend --with-registry-auth
