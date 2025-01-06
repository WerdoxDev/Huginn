# Changelog

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/shared-v0.5.0...shared@v0.6.0) (2025-01-06)


### Features

* **all:** migrated to bun's text .lock file instead of binary .lockb file ([d1731a8](https://github.com/WerdoxDev/Huginn/commit/d1731a8189a8de54da14975ac47ece57564938bd))
* **api:** remove all old tests and add only code related tests ([e2e5e39](https://github.com/WerdoxDev/Huginn/commit/e2e5e399dd1191a4f99fdd43dc151a105a566d76))
* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app,server:** read state tests + better message notification design + 0.3.6-nightly.10 release ([512a41c](https://github.com/WerdoxDev/Huginn/commit/512a41cb82c1a907c0000aa0ed1b0c8577a9063a))
* **app:** 0.3.6-nightly.1 release + dynamic connecting message border radius ([679bfe4](https://github.com/WerdoxDev/Huginn/commit/679bfe498d881b332721b0102f4192b0bcbfb872))
* **app:** add app visual notification and new message indicator (unfinished visual) ([b37865b](https://github.com/WerdoxDev/Huginn/commit/b37865bbb2fc96a0747d8d115318ac5c50269c7e))
* **app:** migration of routes to react-router ([f4f2d26](https://github.com/WerdoxDev/Huginn/commit/f4f2d262583851da9d8670174f0c7736ce9c0d00))
* **app:** multiformat support for markdown (has some more work left) ([b2e83da](https://github.com/WerdoxDev/Huginn/commit/b2e83da54109326800b8675e6d484258a4c84785))
* **app:** simplify client initialization + migration to react 19 ([b3b78da](https://github.com/WerdoxDev/Huginn/commit/b3b78daec7a2b4ea6ae7264b0777d5eea7057d36))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add google oauth logical tests + remove 'action' from oauth ([b949186](https://github.com/WerdoxDev/Huginn/commit/b949186529dca297882fb7ece011bf92d2b83a26))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
* **server:** add new formatting to getting releases ([c644505](https://github.com/WerdoxDev/Huginn/commit/c644505a5ec9046e6bf55660c1423c6051da6e37))
* **server:** better test performance + gateway connection tests ([21728d6](https://github.com/WerdoxDev/Huginn/commit/21728d68c31d64d122d49914c42d2262cf41f23e))
* **server:** complete gateway tests for current development cycle ([6e444c4](https://github.com/WerdoxDev/Huginn/commit/6e444c4507579c55f890338f0dcdc6daf2ab3b88))
* **server:** message generated embeds now process after the response ([94e2514](https://github.com/WerdoxDev/Huginn/commit/94e2514289d6e4a11595dd86d829b57eaa7844f6))
* **shared:** add aws-types, APICheckUpdateResult ([a217dc9](https://github.com/WerdoxDev/Huginn/commit/a217dc911ab0d78a1b9a6a6df17432eac1baefcd))
* **shared:** add embed api types ([4da9ed6](https://github.com/WerdoxDev/Huginn/commit/4da9ed60cf56a83952c69465ddef05d9fd55cb33))
* **shared:** new Unpacked type and GetReleases type ([e7dc260](https://github.com/WerdoxDev/Huginn/commit/e7dc2602597b284fdeb03fc1db6a43ac69358868))
* **website:** website rework ([#26](https://github.com/WerdoxDev/Huginn/issues/26)) ([c90b558](https://github.com/WerdoxDev/Huginn/commit/c90b558f7645733c622e7aa17d1a67e754b8324a))


### Bug Fixes

* **api, app, server:** remove ui logs, fix api tests, fix server error for getting a channel's message ([5720190](https://github.com/WerdoxDev/Huginn/commit/57201901554ac86dc0c6fd805d4b30d13201bed7))
* **api,shared:** increase api test timeout time. fix file path in file-resolver.ts ([ae31d57](https://github.com/WerdoxDev/Huginn/commit/ae31d57521d1c6b02e9158722dbca9eee5c64d8e))
* empty username is no longer allowed ([c0fdefb](https://github.com/WerdoxDev/Huginn/commit/c0fdefb2cdc014880004d8adb2ff90093dcf2a2c))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/shared-v0.4.0...shared@v0.5.0) (2025-01-06)


### Features

* **all:** migrated to bun's text .lock file instead of binary .lockb file ([d1731a8](https://github.com/WerdoxDev/Huginn/commit/d1731a8189a8de54da14975ac47ece57564938bd))
* **api:** remove all old tests and add only code related tests ([e2e5e39](https://github.com/WerdoxDev/Huginn/commit/e2e5e399dd1191a4f99fdd43dc151a105a566d76))
* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app,server:** read state tests + better message notification design + 0.3.6-nightly.10 release ([512a41c](https://github.com/WerdoxDev/Huginn/commit/512a41cb82c1a907c0000aa0ed1b0c8577a9063a))
* **app:** 0.3.6-nightly.1 release + dynamic connecting message border radius ([679bfe4](https://github.com/WerdoxDev/Huginn/commit/679bfe498d881b332721b0102f4192b0bcbfb872))
* **app:** add app visual notification and new message indicator (unfinished visual) ([b37865b](https://github.com/WerdoxDev/Huginn/commit/b37865bbb2fc96a0747d8d115318ac5c50269c7e))
* **app:** migration of routes to react-router ([f4f2d26](https://github.com/WerdoxDev/Huginn/commit/f4f2d262583851da9d8670174f0c7736ce9c0d00))
* **app:** multiformat support for markdown (has some more work left) ([b2e83da](https://github.com/WerdoxDev/Huginn/commit/b2e83da54109326800b8675e6d484258a4c84785))
* **app:** simplify client initialization + migration to react 19 ([b3b78da](https://github.com/WerdoxDev/Huginn/commit/b3b78daec7a2b4ea6ae7264b0777d5eea7057d36))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add google oauth logical tests + remove 'action' from oauth ([b949186](https://github.com/WerdoxDev/Huginn/commit/b949186529dca297882fb7ece011bf92d2b83a26))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
* **server:** add new formatting to getting releases ([c644505](https://github.com/WerdoxDev/Huginn/commit/c644505a5ec9046e6bf55660c1423c6051da6e37))
* **server:** better test performance + gateway connection tests ([21728d6](https://github.com/WerdoxDev/Huginn/commit/21728d68c31d64d122d49914c42d2262cf41f23e))
* **server:** complete gateway tests for current development cycle ([6e444c4](https://github.com/WerdoxDev/Huginn/commit/6e444c4507579c55f890338f0dcdc6daf2ab3b88))
* **server:** message generated embeds now process after the response ([94e2514](https://github.com/WerdoxDev/Huginn/commit/94e2514289d6e4a11595dd86d829b57eaa7844f6))
* **shared:** add aws-types, APICheckUpdateResult ([a217dc9](https://github.com/WerdoxDev/Huginn/commit/a217dc911ab0d78a1b9a6a6df17432eac1baefcd))
* **shared:** add embed api types ([4da9ed6](https://github.com/WerdoxDev/Huginn/commit/4da9ed60cf56a83952c69465ddef05d9fd55cb33))
* **shared:** new Unpacked type and GetReleases type ([e7dc260](https://github.com/WerdoxDev/Huginn/commit/e7dc2602597b284fdeb03fc1db6a43ac69358868))
* **website:** website rework ([#26](https://github.com/WerdoxDev/Huginn/issues/26)) ([c90b558](https://github.com/WerdoxDev/Huginn/commit/c90b558f7645733c622e7aa17d1a67e754b8324a))


### Bug Fixes

* **api, app, server:** remove ui logs, fix api tests, fix server error for getting a channel's message ([5720190](https://github.com/WerdoxDev/Huginn/commit/57201901554ac86dc0c6fd805d4b30d13201bed7))
* **api,shared:** increase api test timeout time. fix file path in file-resolver.ts ([ae31d57](https://github.com/WerdoxDev/Huginn/commit/ae31d57521d1c6b02e9158722dbca9eee5c64d8e))
* empty username is no longer allowed ([c0fdefb](https://github.com/WerdoxDev/Huginn/commit/c0fdefb2cdc014880004d8adb2ff90093dcf2a2c))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/huginn-shared-v0.3.0...huginn-shared@v0.4.0) (2025-01-06)


### Features

* **all:** migrated to bun's text .lock file instead of binary .lockb file ([d1731a8](https://github.com/WerdoxDev/Huginn/commit/d1731a8189a8de54da14975ac47ece57564938bd))
* **api:** remove all old tests and add only code related tests ([e2e5e39](https://github.com/WerdoxDev/Huginn/commit/e2e5e399dd1191a4f99fdd43dc151a105a566d76))
* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app,server:** read state tests + better message notification design + 0.3.6-nightly.10 release ([512a41c](https://github.com/WerdoxDev/Huginn/commit/512a41cb82c1a907c0000aa0ed1b0c8577a9063a))
* **app:** 0.3.6-nightly.1 release + dynamic connecting message border radius ([679bfe4](https://github.com/WerdoxDev/Huginn/commit/679bfe498d881b332721b0102f4192b0bcbfb872))
* **app:** add app visual notification and new message indicator (unfinished visual) ([b37865b](https://github.com/WerdoxDev/Huginn/commit/b37865bbb2fc96a0747d8d115318ac5c50269c7e))
* **app:** migration of routes to react-router ([f4f2d26](https://github.com/WerdoxDev/Huginn/commit/f4f2d262583851da9d8670174f0c7736ce9c0d00))
* **app:** multiformat support for markdown (has some more work left) ([b2e83da](https://github.com/WerdoxDev/Huginn/commit/b2e83da54109326800b8675e6d484258a4c84785))
* **app:** simplify client initialization + migration to react 19 ([b3b78da](https://github.com/WerdoxDev/Huginn/commit/b3b78daec7a2b4ea6ae7264b0777d5eea7057d36))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add google oauth logical tests + remove 'action' from oauth ([b949186](https://github.com/WerdoxDev/Huginn/commit/b949186529dca297882fb7ece011bf92d2b83a26))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
* **server:** add new formatting to getting releases ([c644505](https://github.com/WerdoxDev/Huginn/commit/c644505a5ec9046e6bf55660c1423c6051da6e37))
* **server:** better test performance + gateway connection tests ([21728d6](https://github.com/WerdoxDev/Huginn/commit/21728d68c31d64d122d49914c42d2262cf41f23e))
* **server:** complete gateway tests for current development cycle ([6e444c4](https://github.com/WerdoxDev/Huginn/commit/6e444c4507579c55f890338f0dcdc6daf2ab3b88))
* **server:** message generated embeds now process after the response ([94e2514](https://github.com/WerdoxDev/Huginn/commit/94e2514289d6e4a11595dd86d829b57eaa7844f6))
* **shared:** add aws-types, APICheckUpdateResult ([a217dc9](https://github.com/WerdoxDev/Huginn/commit/a217dc911ab0d78a1b9a6a6df17432eac1baefcd))
* **shared:** add embed api types ([4da9ed6](https://github.com/WerdoxDev/Huginn/commit/4da9ed60cf56a83952c69465ddef05d9fd55cb33))
* **shared:** new Unpacked type and GetReleases type ([e7dc260](https://github.com/WerdoxDev/Huginn/commit/e7dc2602597b284fdeb03fc1db6a43ac69358868))
* **website:** website rework ([#26](https://github.com/WerdoxDev/Huginn/issues/26)) ([c90b558](https://github.com/WerdoxDev/Huginn/commit/c90b558f7645733c622e7aa17d1a67e754b8324a))


### Bug Fixes

* **api, app, server:** remove ui logs, fix api tests, fix server error for getting a channel's message ([5720190](https://github.com/WerdoxDev/Huginn/commit/57201901554ac86dc0c6fd805d4b30d13201bed7))
* **api,shared:** increase api test timeout time. fix file path in file-resolver.ts ([ae31d57](https://github.com/WerdoxDev/Huginn/commit/ae31d57521d1c6b02e9158722dbca9eee5c64d8e))
* empty username is no longer allowed ([c0fdefb](https://github.com/WerdoxDev/Huginn/commit/c0fdefb2cdc014880004d8adb2ff90093dcf2a2c))
