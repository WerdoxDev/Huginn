# Changelog

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.8.0...api@v0.9.0) (2025-04-04)


### Features

* **api:** add all event listeners for voice ([f15257e](https://github.com/WerdoxDev/Huginn/commit/f15257e857acbd86dd821d8e4637543893355dc9))
* **api:** add full closing and voice disconnect gateway message ([548afd0](https://github.com/WerdoxDev/Huginn/commit/548afd0b6d0a4277fafc91c2b2b2d910cca3be69))
* **api:** add initial functionality for voice ([207c807](https://github.com/WerdoxDev/Huginn/commit/207c8076cda418769d46e43113ba6491ebc9f1b6))
* **api:** add listen function returning an unlisten ([3ba1de5](https://github.com/WerdoxDev/Huginn/commit/3ba1de5ad44e6686dd8efad6ee1351fc9ff78c07))
* **api:** add transport creation ws requests ([d0d856f](https://github.com/WerdoxDev/Huginn/commit/d0d856ff8e959a8b27a6a8dd4f04ca054b6a2955))
* **api:** add voice websocket identify sending ([d006ba1](https://github.com/WerdoxDev/Huginn/commit/d006ba14671eca4f2816589f282d552f3ab5411e))
* **api:** voice event changes ([769d08e](https://github.com/WerdoxDev/Huginn/commit/769d08eb42efcce76eda96679df4f7f005dc5dd8))


### Bug Fixes

* **api:** revert type name change ([1f64c86](https://github.com/WerdoxDev/Huginn/commit/1f64c865ae4b00aab676678d35d045cd5937e5ae))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.7.1...api@v0.8.0) (2025-03-02)


### Features

* **api:** add aborting capability to xhr ([0fb2855](https://github.com/WerdoxDev/Huginn/commit/0fb2855a64e14383a70b5c1e63df66ba2179f4f0))

## [0.7.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.7.0...api@v0.7.1) (2025-02-18)


### Bug Fixes

* **api:** add the browser checking function to utils ([45b6851](https://github.com/WerdoxDev/Huginn/commit/45b6851743e4ca6e2ae32a689b139f3d9af70bbe))
* **api:** make files optional on createMessage ([4ab9e83](https://github.com/WerdoxDev/Huginn/commit/4ab9e839b113a9807a9adc72327ae2e765c9a8d6))
* **api:** prevent non browser environments from using XHR ([0ac5cd0](https://github.com/WerdoxDev/Huginn/commit/0ac5cd03a0e8501fe43ef0cf57272bbaff9b0b73))
* **api:** remove error throws from gateway authenticate because they cannot be catched ([e1385ca](https://github.com/WerdoxDev/Huginn/commit/e1385ca7592ebb831b5c5fbf286523f954a238e7))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.6.0...api@v0.7.0) (2025-02-15)


### Features

* **api:** add xhr support to requests ([d634709](https://github.com/WerdoxDev/Huginn/commit/d634709fc6afbd7df0966373441c2d505c6ed627))


### Bug Fixes

* **api:** add a custom close code to prevent issues with compatibility ([b6b05d8](https://github.com/WerdoxDev/Huginn/commit/b6b05d8f60de8b3e50cd0c9042a3ac60fc9cd23c))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.5.0...api@v0.6.0) (2025-02-11)


### Features

* **app:** add status bar ([66cefb3](https://github.com/WerdoxDev/Huginn/commit/66cefb38090e10e3c4c6d556ba178a075a645d64))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.4.0...api@v0.5.0) (2025-02-01)


### Features

* **api:** add much better gateway reconnect handling ([8121a92](https://github.com/WerdoxDev/Huginn/commit/8121a92005a5ad73dc7e2e6c3d82369603af34e4))
* **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))


### Bug Fixes

* **api:** client gateway is no longer required to make a fetch to /api first ([65ca836](https://github.com/WerdoxDev/Huginn/commit/65ca8368472e75f8a7cbd2f228615d2c6f264d22))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/api-v0.3.0...api@v0.4.0) (2025-01-07)


### Features

* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))


### Bug Fixes

* action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
* action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
* **api:** remove unused type from utils ([5d82c29](https://github.com/WerdoxDev/Huginn/commit/5d82c294f0c30e9603b4abcc6a29ab4a6e00e43d))
