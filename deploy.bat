@echo off

docker build -t ghcr.io/werdoxdev/caddy -f Dockerfile.caddy .

docker build -t ghcr.io/werdoxdev/huginn-server -f Dockerfile.huginn-server .
docker build -t ghcr.io/werdoxdev/huginn-cdn -f Dockerfile.huginn-cdn .
docker build -t ghcr.io/werdoxdev/huginn-voice -f Dockerfile.huginn-voice .

docker push ghcr.io/werdoxdev/caddy:latest
docker push ghcr.io/werdoxdev/huginn-server:latest
docker push ghcr.io/werdoxdev/huginn-cdn:latest
docker push ghcr.io/werdoxdev/huginn-voice:latest

docker stack rm huginn-backend
docker config rm caddy_config
docker config create caddy_config .\Caddyfile
docker stack deploy -c .\docker-stack.yaml huginn-backend --with-registry-auth
