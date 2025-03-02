# Changelog

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.9.0...cdn@v0.10.0) (2025-03-02)


### Features

* **cdn:** migrate to bun S3 client ([d5e8dd4](https://github.com/WerdoxDev/Huginn/commit/d5e8dd450ff33bf3328259f7ac571b7c0d4ec42d))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.8.0...cdn@v0.9.0) (2025-02-25)


### Features

* **cdn:** add attachment video byte range support ([e247fab](https://github.com/WerdoxDev/Huginn/commit/e247fab4e393d52e8e17b9843a90719adf26f9ed))


### Bug Fixes

* **cdn:** convert to reading from streams instead of arraybuffers + writing to s3 after response ([89d16eb](https://github.com/WerdoxDev/Huginn/commit/89d16eb283a77d234557aed3562626d8b6ebb698))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.7.0...cdn@v0.8.0) (2025-02-23)


### Features

* **cdn:** add concurrency limiting + save image with quality query param ([0248707](https://github.com/WerdoxDev/Huginn/commit/024870757a6d82d54235db48dac91648a7ace706))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.6.0...cdn@v0.7.0) (2025-02-19)


### Features

* **cdn:** add quality option to attachment  fetching ([7f4ba7e](https://github.com/WerdoxDev/Huginn/commit/7f4ba7e9c192392ffd81ca56a81d920f894edbdb))
* **cdn:** add subdirectory in logs ([7ec8767](https://github.com/WerdoxDev/Huginn/commit/7ec87672da5fdc0434aa08b012ce422245d97182))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.5.0...cdn@v0.6.0) (2025-02-18)


### Features

* **cdn:** add startup text ([3f37887](https://github.com/WerdoxDev/Huginn/commit/3f37887a862290c33fbdb1731dbf2c5807e57667))
* **cdn:** move back to array buffers instead of stream to see if performance is better ([bed7830](https://github.com/WerdoxDev/Huginn/commit/bed78309f636a8b111727286be9bd75e8bc7e95c))


### Bug Fixes

* **cdn:** file extension is not correctly found ([84764fd](https://github.com/WerdoxDev/Huginn/commit/84764fd6786c0dbd00763bb5444cf9293a88f7fe))
* **cdn:** file extension is not normalized to lower case ([fd94b62](https://github.com/WerdoxDev/Huginn/commit/fd94b62320767e1aaff4799a6b09f888f10fac03))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.4.1...cdn@v0.5.0) (2025-02-11)


### Features

* **cdn:** add attachment upload/get routes ([58cd333](https://github.com/WerdoxDev/Huginn/commit/58cd333934bb5979931bf42415de62db2912468e))

## [0.4.1](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.4.0...cdn@v0.4.1) (2025-02-07)


### Bug Fixes

* **cdn:** cors was not applied to cdn ([db7dce6](https://github.com/WerdoxDev/Huginn/commit/db7dce64c6bdf672f49bb91d3cfa1ad779e2db26))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.3.0...cdn@v0.4.0) (2025-02-01)


### Features

* **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))
* **cdn:** migrate cdn to use nitro + working tests ([5761b17](https://github.com/WerdoxDev/Huginn/commit/5761b177f02c09bf285d29a913d221d0bb6787d3))

## [0.3.0](https://github.com/WerdoxDev/Huginn/compare/cdn-v0.2.0...cdn@v0.3.0) (2025-01-07)


### Features

* **cdn:** move h3 handlers to the backend shared package ([f8645ad](https://github.com/WerdoxDev/Huginn/commit/f8645ad9f048d7e8da9645412958cedcfcc948d8))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))


### Bug Fixes

* action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
* action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
* **server,cdn,bifrost:** move handler registration place ([36f9d8d](https://github.com/WerdoxDev/Huginn/commit/36f9d8d005f94509c5e23b52e9a84344db335fcb))
