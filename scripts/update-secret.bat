@echo off

docker stack rm huginn-backend
docker secret rm backend_secrets

docker secret create backend_secrets secrets.env
./scripts/redeploy.bat
