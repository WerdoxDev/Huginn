# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.1.29 AS base
WORKDIR /huginn

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# run the app
# RUN useradd -ms /bin/bash bun
RUN chown -R bun:bun /huginn
RUN chmod 755 /huginn
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "bifrost" ]
