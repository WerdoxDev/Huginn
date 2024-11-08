# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.1.29 AS base
WORKDIR /huginn

# install dependencies into temp directory
# this will cache them and speed up future builds
# FROM base AS install
# RUN mkdir -p /temp/dev
# COPY package.json bun.lockb /temp/dev/
# RUN cd /temp/dev && bun install
# preperation

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS release
# COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun install

# run the app
RUN chown -R bun:bun packages/huginn-cdn/uploads
RUN chown -R bun:bun packages/huginn-server/package.json
RUN chmod 755 packages/huginn-cdn/uploads
RUN chmod 755 packages/huginn-server/package.json
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "bifrost" ]
