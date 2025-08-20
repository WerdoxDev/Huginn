# Changelog

## [0.24.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.23.0...api@v0.24.0) (2025-08-20)


### Features

* **api:** add message delete routes ([58de9df](https://github.com/WerdoxDev/Huginn/commit/58de9df7621d232c59dbfbae7529a0ef5933aaac))


### Bug Fixes

* **api:** reconnect to voice after gateway disconnect not working ([6a35632](https://github.com/WerdoxDev/Huginn/commit/6a356328fffa36cf7d7c126fd8a92ea7e4173d81))

## [0.23.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.4...api@v0.23.0) (2025-08-16)


### Features

* **api:** add message edit function ([fd5a691](https://github.com/WerdoxDev/Huginn/commit/fd5a69117706940c34c5db3125dfa6926109042c))

## [0.22.4](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.3...api@v0.22.4) (2025-08-11)


### Bug Fixes

* **api:** gateway should disconnect voice if a null voice state from server is received ([1a77d14](https://github.com/WerdoxDev/Huginn/commit/1a77d140df6580da30255a3c02b6a88d23f78c30))

## [0.22.3](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.2...api@v0.22.3) (2025-08-09)


### Bug Fixes

* **api:** some small promise fixes ([33bd375](https://github.com/WerdoxDev/Huginn/commit/33bd375839257d499d8a457a9e5352c64364abb6))

## [0.22.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.1...api@v0.22.2) (2025-07-29)


### Bug Fixes

* **api:** add a new status type to voice for better status tracking + some promise fixes ([998fed9](https://github.com/WerdoxDev/Huginn/commit/998fed9aa52e4d12b859975f1055463ca164a9a3))

## [0.22.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.0...api@v0.22.1) (2025-07-28)


### Bug Fixes

* **api:** consume producer hangs when consumers are created fast enough ([a64c3c0](https://github.com/WerdoxDev/Huginn/commit/a64c3c0c448767386b21bcad131f231a73960905))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.21.1...api@v0.22.0) (2025-07-24)


### Features

* **api:** add support for audio only streaming ([4030d55](https://github.com/WerdoxDev/Huginn/commit/4030d55074d14f3377e3cef311fe75c8bb76dcc2))

## [0.21.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.21.0...api@v0.21.1) (2025-07-22)


### Bug Fixes

* **api:** gateway is not reauthenticating when session is invalid ([54bdab2](https://github.com/WerdoxDev/Huginn/commit/54bdab29c615b51fd3fe323d65690f447fdde217))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.20.0...api@v0.21.0) (2025-07-20)


### Features

* **api:** add close consumer handling ([0fc9ab3](https://github.com/WerdoxDev/Huginn/commit/0fc9ab35af11de145788ef019465a6b3ab951679))
* **api:** add log sending ([cdaf64c](https://github.com/WerdoxDev/Huginn/commit/cdaf64c671c387818d6a10ea9998da968b2f7001))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.2...api@v0.20.0) (2025-07-18)


### Features

* **api:** add separate voice and camera streaming functions ([818312b](https://github.com/WerdoxDev/Huginn/commit/818312b8185cee8485a1b811bf7eb009078f3043))

## [0.19.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.1...api@v0.19.2) (2025-07-16)


### Bug Fixes

* **api:** issue with voice and gateway reconnecting ([026d442](https://github.com/WerdoxDev/Huginn/commit/026d442da424eb82b3a1095cb3d9e90162b1456a))

## [0.19.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.0...api@v0.19.1) (2025-07-11)


### Bug Fixes

* **api:** logout should wait for gateway to close ([e5c3644](https://github.com/WerdoxDev/Huginn/commit/e5c3644d627f7f3625773691b4c3ae9989335b78))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.18.1...api@v0.19.0) (2025-07-09)


### Features

* **api:** add bunch of tests for gateway and voice + some bug fixes ([dbd10ae](https://github.com/WerdoxDev/Huginn/commit/dbd10ae1cb08a3688587adb6d3f3748761d3133d))

## [0.18.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.18.0...api@v0.18.1) (2025-07-07)


### Bug Fixes

* **api:** slightly update tests + bug in reconnecting ([ca8869a](https://github.com/WerdoxDev/Huginn/commit/ca8869a70681e482d9001234cd719fafc1e15217))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.17.0...api@v0.18.0) (2025-07-04)


### Features

* **api:** add much better state tracking and initialization strategy to voice and gateway ([92e8e6e](https://github.com/WerdoxDev/Huginn/commit/92e8e6e40d78d1cea2ebe03b7d7d0e3dd622bcc9))
* **api:** add voice websocket status change event ([c569dae](https://github.com/WerdoxDev/Huginn/commit/c569daebb3ac503121ff84cc774ca38fb5abf074))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.16.0...api@v0.17.0) (2025-06-19)


### Features

* **api:** use extensive logging for gateway and voice + remove log option from gatway and voice ([dd99d78](https://github.com/WerdoxDev/Huginn/commit/dd99d7885acc448d4f807ed441461a198aac080c))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.15.0...api@v0.16.0) (2025-06-09)


### Features

* **app:** add voice screenshare fps, resolution and audio indicators ([9baca3a](https://github.com/WerdoxDev/Huginn/commit/9baca3aeb336c50a7bce19297282bb40ab1e9e9b))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.14.0...api@v0.15.0) (2025-05-31)


### Features

* **api:** implement a much better management strategy for producers & consumers ([d56460b](https://github.com/WerdoxDev/Huginn/commit/d56460b5f3794a8c273a1732417462dd8dc7ad01))


### Bug Fixes

* **api:** temporary fix for changing stream black screen problem ([0317fcd](https://github.com/WerdoxDev/Huginn/commit/0317fcda3aea80fd1df1b0a8acfc3c0a5b290d69))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.13.0...api@v0.14.0) (2025-05-16)


### Features

* **api:** add screenshare in voice handling ([803cf93](https://github.com/WerdoxDev/Huginn/commit/803cf93778965f02fceec2dbd0fc69ae732a45b4))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.12.0...api@v0.13.0) (2025-05-12)


### Features

* **api:** add update voice state function and bunch of utility for muting/pausing media ([3fd4a13](https://github.com/WerdoxDev/Huginn/commit/3fd4a1319ed9da3dec36685439bcb401e39d2563))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.11.1...api@v0.12.0) (2025-04-30)


### Features

* **api:** handle sending and processing ping ([0674b89](https://github.com/WerdoxDev/Huginn/commit/0674b89cd65ece337b9a366166b412d681e7aaca))

## [0.11.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.11.0...api@v0.11.1) (2025-04-27)


### Bug Fixes

* **api:** resetting voice class is not correct ([200a0ed](https://github.com/WerdoxDev/Huginn/commit/200a0ed1f0c845afab8bd761f4fb05b4bb503147))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.10.0...api@v0.11.0) (2025-04-26)


### Features

* **api:** add offAll to history event emitter ([c6a156e](https://github.com/WerdoxDev/Huginn/commit/c6a156e55893bada378a45afdb5ea5bd659546ab))


### Bug Fixes

* **api:** replacing audio track is not working ([29343f2](https://github.com/WerdoxDev/Huginn/commit/29343f2a00ad4274493afc607421ff71eca6b5ab))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.9.0...api@v0.10.0) (2025-04-14)


### Features

* **api:** add call ringing request ([1bf2a3d](https://github.com/WerdoxDev/Huginn/commit/1bf2a3da4722e49d517dfe52b06b2acc2b9768ee))

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
