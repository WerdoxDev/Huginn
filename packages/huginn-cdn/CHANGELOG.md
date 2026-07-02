# Changelog

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.19.0...cdn@v0.20.0) (2026-07-02)


### Features

* **assets:** add assets project ([4667a6c](https://github.com/WerdoxDev/Huginn/commit/4667a6ce6faf05a4aca9ae07d2939b735fe7c507))
* **cdn:** tests touchup and better run method ([d3b6f93](https://github.com/WerdoxDev/Huginn/commit/d3b6f937d0ebfcff58fcfb402571bff1aff4f7b5))
* **shared:** move emoji stuff to a new file ([169fe93](https://github.com/WerdoxDev/Huginn/commit/169fe93994e7ee03085642258313415a3ba9fe00))


### Bug Fixes

* **app:** revert emojis having id ([d85b6bd](https://github.com/WerdoxDev/Huginn/commit/d85b6bdf41a451e37be40ae38f10294353ea5ad0))
* **assets:** get emoji codepoint from shared pacakge ([0ab4a64](https://github.com/WerdoxDev/Huginn/commit/0ab4a644da9960bcace23cd71034e767184efa7e))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.18.0...cdn@v0.19.0) (2026-06-27)

### Features

- **cdn:** migrate out old logging to pino ([6f5aa62](https://github.com/WerdoxDev/Huginn/commit/6f5aa62213eb87814b7dec9a2ad06256477bef56))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.17.0...cdn@v0.18.0) (2026-06-10)

### Features

- **cdn:** add get emoji route + script to upoad all emojis to cdn ([b30ac11](https://github.com/WerdoxDev/Huginn/commit/b30ac113716ebbad9bf72b0a795dc2dc33bd7923))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.16.0...cdn@v0.17.0) (2026-06-05)

### Features

- **cdn:** implement OTel at elysia level ([83f81de](https://github.com/WerdoxDev/Huginn/commit/83f81debfea208e0ea6f8a67295675106edbac0a))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.15.0...cdn@v0.16.0) (2026-05-31)

### Features

- **cdn:** use bun's image class + cache control ([30c3d48](https://github.com/WerdoxDev/Huginn/commit/30c3d4802f2d0b61be36b0c80ac58471ada07ba0))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.14.2...cdn@v0.15.0) (2026-05-21)

### Features

- **cdn:** add banner image upload ([a121f00](https://github.com/WerdoxDev/Huginn/commit/a121f00d53a1a0d1ab994049497e5c987b384043))
- migrate prettier to oxfmt and full format ([#237](https://github.com/WerdoxDev/Huginn/issues/237)) ([62481be](https://github.com/WerdoxDev/Huginn/commit/62481beb58232bc373358338fa9bc19c889bddc8))

### Bug Fixes

- **cdn:** new way of file schema handling ([3ca3ca7](https://github.com/WerdoxDev/Huginn/commit/3ca3ca7bce44316650162b82d5f67b07f3f555b8))

## [0.14.2](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.14.1...cdn@v0.14.2) (2025-12-14)

### Bug Fixes

- **cdn:** fix potential static routes ([6ca665b](https://github.com/WerdoxDev/Huginn/commit/6ca665b6dfd563f219e9dd43fa322dce903019d0))

## [0.14.1](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.14.0...cdn@v0.14.1) (2025-11-18)

### Bug Fixes

- **cdn:** attachment path is not correctly decoded ([27b5284](https://github.com/WerdoxDev/Huginn/commit/27b5284ef9ff74f6b86b9676071e77df3d86a18e))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.13.0...cdn@v0.14.0) (2025-11-05)

### Features

- a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
- **cdn:** migrate all routes to ElysiaJS ([5d5f8ea](https://github.com/WerdoxDev/Huginn/commit/5d5f8ea9288ad9bc73b6f1c5d2957d3cc8898ecf))

### Bug Fixes

- **cdn:** file body is incorrectly handled ([93f3b9d](https://github.com/WerdoxDev/Huginn/commit/93f3b9d6f47b23eedfaa2b4a58d9ed9886d80d03))
- **cdn:** little change in application icon handling ([3e4ae23](https://github.com/WerdoxDev/Huginn/commit/3e4ae23308b91b3f6c012f00e96159c61afcb424))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.12.0...cdn@v0.13.0) (2025-09-14)

### Features

- **cdn:** add application icon uploading and getting routes ([1de047d](https://github.com/WerdoxDev/Huginn/commit/1de047d86d248a5053667d3f3546de74746b2c89))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.11.0...cdn@v0.12.0) (2025-09-06)

### Features

- **cdn:** add attachment hmac verification ([711a552](https://github.com/WerdoxDev/Huginn/commit/711a552e2334831c84728c3eb02db5fe35dc7d7d))
- **cdn:** add better tests + upload authentication ([756d4f1](https://github.com/WerdoxDev/Huginn/commit/756d4f144c26e3cfc654b109fc8af66d70121681))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.10.3...cdn@v0.11.0) (2025-04-11)

### Features

- **app:** finish migration to electron ([13650fb](https://github.com/WerdoxDev/Huginn/commit/13650fbd6b1bfaf2eaff70f62974361ffbcc34c7))

## [0.10.3](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.10.2...cdn@v0.10.3) (2025-03-06)

### Bug Fixes

- **cdn:** remove test flag from cdn as it is now in backend-shared ([143b168](https://github.com/WerdoxDev/Huginn/commit/143b16842312fe19d44b871d14c1d06bbdf43f43))

## [0.10.2](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.10.1...cdn@v0.10.2) (2025-03-03)

### Bug Fixes

- **cdn:** file type convesion is failing with 404 ([dbf55d2](https://github.com/WerdoxDev/Huginn/commit/dbf55d2513cbd861f2ba81ea5564baa257666c0f))

## [0.10.1](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.10.0...cdn@v0.10.1) (2025-03-03)

### Bug Fixes

- **cdn:** dev script --hot is not in the correct place ([40cdd16](https://github.com/WerdoxDev/Huginn/commit/40cdd1686933f91f830b4e6bb4e468ab54ceffd7))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.9.0...cdn@v0.10.0) (2025-03-02)

### Features

- **cdn:** migrate to bun S3 client ([d5e8dd4](https://github.com/WerdoxDev/Huginn/commit/d5e8dd450ff33bf3328259f7ac571b7c0d4ec42d))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.8.0...cdn@v0.9.0) (2025-02-25)

### Features

- **cdn:** add attachment video byte range support ([e247fab](https://github.com/WerdoxDev/Huginn/commit/e247fab4e393d52e8e17b9843a90719adf26f9ed))

### Bug Fixes

- **cdn:** convert to reading from streams instead of arraybuffers + writing to s3 after response ([89d16eb](https://github.com/WerdoxDev/Huginn/commit/89d16eb283a77d234557aed3562626d8b6ebb698))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.7.0...cdn@v0.8.0) (2025-02-23)

### Features

- **cdn:** add concurrency limiting + save image with quality query param ([0248707](https://github.com/WerdoxDev/Huginn/commit/024870757a6d82d54235db48dac91648a7ace706))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.6.0...cdn@v0.7.0) (2025-02-19)

### Features

- **cdn:** add quality option to attachment fetching ([7f4ba7e](https://github.com/WerdoxDev/Huginn/commit/7f4ba7e9c192392ffd81ca56a81d920f894edbdb))
- **cdn:** add subdirectory in logs ([7ec8767](https://github.com/WerdoxDev/Huginn/commit/7ec87672da5fdc0434aa08b012ce422245d97182))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.5.0...cdn@v0.6.0) (2025-02-18)

### Features

- **cdn:** add startup text ([3f37887](https://github.com/WerdoxDev/Huginn/commit/3f37887a862290c33fbdb1731dbf2c5807e57667))
- **cdn:** move back to array buffers instead of stream to see if performance is better ([bed7830](https://github.com/WerdoxDev/Huginn/commit/bed78309f636a8b111727286be9bd75e8bc7e95c))

### Bug Fixes

- **cdn:** file extension is not correctly found ([84764fd](https://github.com/WerdoxDev/Huginn/commit/84764fd6786c0dbd00763bb5444cf9293a88f7fe))
- **cdn:** file extension is not normalized to lower case ([fd94b62](https://github.com/WerdoxDev/Huginn/commit/fd94b62320767e1aaff4799a6b09f888f10fac03))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.4.1...cdn@v0.5.0) (2025-02-11)

### Features

- **cdn:** add attachment upload/get routes ([58cd333](https://github.com/WerdoxDev/Huginn/commit/58cd333934bb5979931bf42415de62db2912468e))

## [0.4.1](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.4.0...cdn@v0.4.1) (2025-02-07)

### Bug Fixes

- **cdn:** cors was not applied to cdn ([db7dce6](https://github.com/WerdoxDev/Huginn/commit/db7dce64c6bdf672f49bb91d3cfa1ad779e2db26))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/cdn@v0.3.0...cdn@v0.4.0) (2025-02-01)

### Features

- **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))
- **cdn:** migrate cdn to use nitro + working tests ([5761b17](https://github.com/WerdoxDev/Huginn/commit/5761b177f02c09bf285d29a913d221d0bb6787d3))

## [0.3.0](https://github.com/WerdoxDev/Huginn/compare/cdn-v0.2.0...cdn@v0.3.0) (2025-01-07)

### Features

- **cdn:** move h3 handlers to the backend shared package ([f8645ad](https://github.com/WerdoxDev/Huginn/commit/f8645ad9f048d7e8da9645412958cedcfcc948d8))
- prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))

### Bug Fixes

- action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
- action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
- action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
- **server,cdn,bifrost:** move handler registration place ([36f9d8d](https://github.com/WerdoxDev/Huginn/commit/36f9d8d005f94509c5e23b52e9a84344db335fcb))
