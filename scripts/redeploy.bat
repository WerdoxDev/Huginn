@echo off

docker stack rm huginn-backend
docker config rm caddy_config
docker config create caddy_config .\Caddyfile
docker stack deploy -c .\docker-stack.yaml huginn-backend --with-registry-auth
