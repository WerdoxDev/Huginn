# Changelog

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.17.0...server@v0.18.0) (2025-03-06)


### Features

* **server:** add new tests for attachments and embeds ([97d07c0](https://github.com/WerdoxDev/Huginn/commit/97d07c0e0ba54947f64031e3385da634e037224c))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.16.0...server@v0.17.0) (2025-03-03)


### Features

* **server:** add embed image and video types + fix link detection ([0e028f0](https://github.com/WerdoxDev/Huginn/commit/0e028f039d12062a9b6ef3da1a9388bdae8348da))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.15.1...server@v0.16.0) (2025-02-25)


### Features

* **server:** add ffmpge video probing ([2236c9d](https://github.com/WerdoxDev/Huginn/commit/2236c9df9312d42899e51dbb4836517d4ecf600a))


### Bug Fixes

* **server:** add larger idle timeout ([1cf8c80](https://github.com/WerdoxDev/Huginn/commit/1cf8c8019a70c87a1f5d6c504eac667d3c53c0de))
* **server:** ffmpeg temp dir is wrong ([5fdc805](https://github.com/WerdoxDev/Huginn/commit/5fdc8054e809b58e71cbc466a0e45d322059ceff))

## [0.15.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.15.0...server@v0.15.1) (2025-02-23)


### Bug Fixes

* **server:** remove unused imports ([1cf797e](https://github.com/WerdoxDev/Huginn/commit/1cf797ed682a20312dcd1a752d1738ad12f3c550))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.14.0...server@v0.15.0) (2025-02-19)


### Features

* **server:** remove image size constrains in favour of app auto constrains ([3f439bb](https://github.com/WerdoxDev/Huginn/commit/3f439bb7d0d6e8dcb7f3ab31b3d8cac0ee1fb4b3))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.13.1...server@v0.14.0) (2025-02-18)


### Features

* **server:** add startup text ([c386c63](https://github.com/WerdoxDev/Huginn/commit/c386c63423fd26f4ab2f34ad47def2633acaa8a6))
* **server:** add utility function to get an attachments url ([9a61380](https://github.com/WerdoxDev/Huginn/commit/9a6138064b0ad28e2457a634acbd947e956b1919))


### Bug Fixes

* **server:** cdn attachments url is a localhost and not midgard ([981e764](https://github.com/WerdoxDev/Huginn/commit/981e76453cbe952aaf4f64410e949568a9bd5b4f))
* **server:** use better names for cdn local and public url ([e63055e](https://github.com/WerdoxDev/Huginn/commit/e63055e62b97656b1eb21ba41718ab22ab95667e))

## [0.13.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.13.0...server@v0.13.1) (2025-02-15)


### Bug Fixes

* **server:** better image type detection for attachments ([44e23d5](https://github.com/WerdoxDev/Huginn/commit/44e23d5ab48ca13e3629df811418f2b237d4b662))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.12.0...server@v0.13.0) (2025-02-11)


### Features

* **server:** add attachment creation + cdn attachment upload ([c63f0ef](https://github.com/WerdoxDev/Huginn/commit/c63f0ef8c808b17b5fd11e6393ce0e3f90c7e8be))


### Bug Fixes

* **server:** image data from url is not handled correctly ([c2fb6f4](https://github.com/WerdoxDev/Huginn/commit/c2fb6f4c1a8605b7fe1f0859c9696c22b2c44962))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.2...server@v0.12.0) (2025-02-10)


### Features

* **server:** add form body handling to message.post ([46942ca](https://github.com/WerdoxDev/Huginn/commit/46942ca35b80bb652acc7bd9a6aee9f71831218f))


### Bug Fixes

* **server:** getting github tags should be paginated to get all available ones ([a8f3665](https://github.com/WerdoxDev/Huginn/commit/a8f36657d14da7f9c04cdffbe27e1b63aa737504))

## [0.11.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.1...server@v0.11.2) (2025-02-09)


### Bug Fixes

* **server:** fix google callback redirect mismatch ([ba6bae6](https://github.com/WerdoxDev/Huginn/commit/ba6bae6c66306063f5a03a8238e34ff6893e5e96))

## [0.11.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.0...server@v0.11.1) (2025-02-08)


### Bug Fixes

* **server:** fix redirect host not being correct on prod ([7bfbdc6](https://github.com/WerdoxDev/Huginn/commit/7bfbdc68ff3bb49e3c4c581428640a63b71df35a))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.10.0...server@v0.11.0) (2025-02-07)


### Features

* **server:** add test messages to prepration script ([a680e7a](https://github.com/WerdoxDev/Huginn/commit/a680e7a2660d266492c23d04fbe50c7d0b69aa6f))


### Bug Fixes

* **server:** static routes not working after migration to hono ([f27086c](https://github.com/WerdoxDev/Huginn/commit/f27086c4e91e3cbb1d1b0435ba9233bccf115844))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.9.0...server@v0.10.0) (2025-02-01)


### Features

* **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))
* **server:** add command driven nitro build ([d26919e](https://github.com/WerdoxDev/Huginn/commit/d26919ea0073f5e2f1f55863e7f5cef8f4c93cd8))
* **server:** complete test migration ([4e369ba](https://github.com/WerdoxDev/Huginn/commit/4e369baca343525f462b66799117b3fbd39df937))
* **server:** use backend-shared's test utils instead ([de63d39](https://github.com/WerdoxDev/Huginn/commit/de63d39913f7da0023736d566e641c21ccdb893e))


### Bug Fixes

* **server:** fix problem with user patching and password getting reset + remove unused methods ([c16552d](https://github.com/WerdoxDev/Huginn/commit/c16552d6e8938f7d086142558e4d25b5d3c0c3e1))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.8.0...server@v0.9.0) (2025-01-08)


### Features

* **server:** move version checking to github releases instead of aws s3 ([ffb972f](https://github.com/WerdoxDev/Huginn/commit/ffb972f9e771b52093f54eedb89cf8f073e88b5d))


### Bug Fixes

* **server:** check-update should only check if target includes a certain string ([84e1400](https://github.com/WerdoxDev/Huginn/commit/84e14007f828f0e6da872c26dc1e9b1d7c64f8b3))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/server-v0.7.0...server@v0.8.0) (2025-01-07)


### Features

* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
* **server:** add unstable message embed generation ([6199ef9](https://github.com/WerdoxDev/Huginn/commit/6199ef94237d130eebac8eca0a15239af074fc54))
* **server:** add waitUntil + embed thumbnail processing ([9894172](https://github.com/WerdoxDev/Huginn/commit/9894172f16722ee64151fd068b3b129f0b259f0a))
* **server:** message generated embeds now process after the response ([94e2514](https://github.com/WerdoxDev/Huginn/commit/94e2514289d6e4a11595dd86d829b57eaa7844f6))
* **server:** move h3 handlers to the backend shared package ([59146b2](https://github.com/WerdoxDev/Huginn/commit/59146b22cac518e3aafbd51b150f41650fe9a14d))
* **server:** remove nightly from app releases endpoints ([9289f39](https://github.com/WerdoxDev/Huginn/commit/9289f39e2a99ccdcc744ba8a0c63509eb791aa2d))


### Bug Fixes

* action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
* action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
* **app:** message ack from ws should only be used when in other channels ([4e19c67](https://github.com/WerdoxDev/Huginn/commit/4e19c674cf2331ee1a80855789a5b208d5387164))
* **server,cdn,bifrost:** move handler registration place ([36f9d8d](https://github.com/WerdoxDev/Huginn/commit/36f9d8d005f94509c5e23b52e9a84344db335fcb))
* **server:** remove unused import ([7a1d25a](https://github.com/WerdoxDev/Huginn/commit/7a1d25a3b01c92e621c6c0a423b00437fb20c7c1))
