# Changelog

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/api-v0.3.0...api@v0.4.0) (2025-01-06)


### Features

* **all:** migrated to bun's text .lock file instead of binary .lockb file ([d1731a8](https://github.com/WerdoxDev/Huginn/commit/d1731a8189a8de54da14975ac47ece57564938bd))
* **api:** cleanup default options + better folder structure ([3b5fc8f](https://github.com/WerdoxDev/Huginn/commit/3b5fc8f497258bae346039340565f6a1ff8fd459))
* **api:** remove all old tests and add only code related tests ([e2e5e39](https://github.com/WerdoxDev/Huginn/commit/e2e5e399dd1191a4f99fdd43dc151a105a566d76))
* **app:** add app visual notification and new message indicator (unfinished visual) ([b37865b](https://github.com/WerdoxDev/Huginn/commit/b37865bbb2fc96a0747d8d115318ac5c50269c7e))
* **app:** simplify client initialization + migration to react 19 ([b3b78da](https://github.com/WerdoxDev/Huginn/commit/b3b78daec7a2b4ea6ae7264b0777d5eea7057d36))
* **app:** unfinished migration to react 19 ([e18ed5d](https://github.com/WerdoxDev/Huginn/commit/e18ed5d3998ac7db48c583ee1e432d8afb8e9acb))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add google oauth logical tests + remove 'action' from oauth ([b949186](https://github.com/WerdoxDev/Huginn/commit/b949186529dca297882fb7ece011bf92d2b83a26))
* **server:** better test performance + gateway connection tests ([21728d6](https://github.com/WerdoxDev/Huginn/commit/21728d68c31d64d122d49914c42d2262cf41f23e))
* **server:** complete gateway tests for current development cycle ([6e444c4](https://github.com/WerdoxDev/Huginn/commit/6e444c4507579c55f890338f0dcdc6daf2ab3b88))


### Bug Fixes

* **api, app, server:** remove ui logs, fix api tests, fix server error for getting a channel's message ([5720190](https://github.com/WerdoxDev/Huginn/commit/57201901554ac86dc0c6fd805d4b30d13201bed7))
* **api,shared:** increase api test timeout time. fix file path in file-resolver.ts ([ae31d57](https://github.com/WerdoxDev/Huginn/commit/ae31d57521d1c6b02e9158722dbca9eee5c64d8e))
* **api:** change test url port to be local bifrost port ([f140419](https://github.com/WerdoxDev/Huginn/commit/f1404195b5d96a324715a827ec3e2a42d8e84644))
* **api:** remove unused type from utils ([5d82c29](https://github.com/WerdoxDev/Huginn/commit/5d82c294f0c30e9603b4abcc6a29ab4a6e00e43d))
* empty username is no longer allowed ([c0fdefb](https://github.com/WerdoxDev/Huginn/commit/c0fdefb2cdc014880004d8adb2ff90093dcf2a2c))
