# Changelog

## [0.43.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.43.1...api@v0.43.2) (2026-08-08)


### Bug Fixes

* **api:** small fixes to how voice state is sent after authentication ([4ca56ff](https://github.com/WerdoxDev/Huginn/commit/4ca56ff5d442138e0740d3e64bbd6c8e41d496e7))

## [0.43.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.43.0...api@v0.43.1) (2026-08-04)


### Bug Fixes

* **api:** VoiceState should take control of the gateway voice state ([76a7539](https://github.com/WerdoxDev/Huginn/commit/76a75392a4171029f44252d8df7c86739a53a10a))

## [0.43.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.42.4...api@v0.43.0) (2026-08-02)


### Features

* **api:** add pause consumer and move voice preferences to user settings ([cc1363f](https://github.com/WerdoxDev/Huginn/commit/cc1363f72000b35cbf9f26c0a34af7ddd4097879))
* **api:** add requried fields for publishing ([b9e299d](https://github.com/WerdoxDev/Huginn/commit/b9e299dcf63a197d48ce87be1ff1759e0b4a7a4f))
* **api:** add transport options to voice options ([0e691ad](https://github.com/WerdoxDev/Huginn/commit/0e691ad85a3c16bce5ffd8b997978c3ead0dee0d))
* **api:** fix bunch of unhandled promise rejection stuff + handle voice token expiration ([08a94d6](https://github.com/WerdoxDev/Huginn/commit/08a94d617cb962d179b7da5dd7a0757bc0b029b7))
* **api:** remove constant ping pong messaging ([3247c27](https://github.com/WerdoxDev/Huginn/commit/3247c27397b36c1c4da3f04950bb17892ee20228))
* rename @huginn/shared to @huginnjs/shared + fix @huginnjs/api dependencies for npm ([7c0cb4c](https://github.com/WerdoxDev/Huginn/commit/7c0cb4c04be00fd8dc3fc23907dfaf368461cd1c))


### Bug Fixes

* **api:** add a small readme ([99c0310](https://github.com/WerdoxDev/Huginn/commit/99c0310c96a7bbc0c8b88d61ee2ddad35e29096b))
* **api:** pause created consumers and manage its state later on applyVoiceState ([ad8e9f9](https://github.com/WerdoxDev/Huginn/commit/ad8e9f9ff0fa971924d8d932f0c41c4269eb67b6))
* **api:** some analytic fixes ([22fbf66](https://github.com/WerdoxDev/Huginn/commit/22fbf6636ff1a0c6a73bb42b6a1b27a3286c365f))
* remove @std/encoding from api and shared ([87903a3](https://github.com/WerdoxDev/Huginn/commit/87903a33f86904f37192221b729db7d78bc1b0dd))

## [0.42.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.41.1...api@v0.42.0) (2026-07-22)


### Features

* **api:** fix bunch of unhandled promise rejection stuff + handle voice token expiration ([08a94d6](https://github.com/WerdoxDev/Huginn/commit/08a94d617cb962d179b7da5dd7a0757bc0b029b7))
* **api:** remove constant ping pong messaging ([3247c27](https://github.com/WerdoxDev/Huginn/commit/3247c27397b36c1c4da3f04950bb17892ee20228))

## [0.41.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.41.0...api@v0.41.1) (2026-07-20)


### Bug Fixes

* **api:** some analytic fixes ([22fbf66](https://github.com/WerdoxDev/Huginn/commit/22fbf6636ff1a0c6a73bb42b6a1b27a3286c365f))

## [0.41.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.40.0...api@v0.41.0) (2026-07-17)


### Features

* **api:** add pause consumer and move voice preferences to user settings ([cc1363f](https://github.com/WerdoxDev/Huginn/commit/cc1363f72000b35cbf9f26c0a34af7ddd4097879))


### Bug Fixes

* **api:** pause created consumers and manage its state later on applyVoiceState ([ad8e9f9](https://github.com/WerdoxDev/Huginn/commit/ad8e9f9ff0fa971924d8d932f0c41c4269eb67b6))

## [0.40.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.39.0...api@v0.40.0) (2026-07-11)


### Features

* **api:** 100% voice stream, device manager, state and manager test coverages ([231bd6e](https://github.com/WerdoxDev/Huginn/commit/231bd6e6278731d4b3a3c4899915baa1c9d02f9d))
* **api:** 100% voice-signaling-client coverage ([76847bb](https://github.com/WerdoxDev/Huginn/commit/76847bba8f5db9d75000093ba53db9799e91b246))
* **api:** 100% voice-transport-manager coverage tests ([bf4c149](https://github.com/WerdoxDev/Huginn/commit/bf4c14970e8c39b4de2d1eebd40e0ebef26f76e6))
* **api:** add mostly 100% coverage tests for client, gateway, voice and rest ([2e3e4e6](https://github.com/WerdoxDev/Huginn/commit/2e3e4e6fe5e66df31e99ed5676225d423a3fce7e))
* **api:** add new api for gifs ([3596b28](https://github.com/WerdoxDev/Huginn/commit/3596b28743585d0ef2a06fbd900fbef41aa79d80))
* **app:** alsmost 100% test coverage on some other files ([50013d5](https://github.com/WerdoxDev/Huginn/commit/50013d5c0a8d62c9785de662755ecf6e9d171375))

## [0.39.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.38.0...api@v0.39.0) (2026-07-02)


### Features

* **api:** add reaction apis ([12819ff](https://github.com/WerdoxDev/Huginn/commit/12819ff3bd4359371223f3e11b0dc72aee75b05f))
* **shared:** move emoji stuff to a new file ([169fe93](https://github.com/WerdoxDev/Huginn/commit/169fe93994e7ee03085642258313415a3ba9fe00))


### Bug Fixes

* **app:** revert emojis having id ([d85b6bd](https://github.com/WerdoxDev/Huginn/commit/d85b6bdf41a451e37be40ae38f10294353ea5ad0))

## [0.38.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.37.0...api@v0.38.0) (2026-06-19)

### Features

- **api:** add route to send push notification token ([570769e](https://github.com/WerdoxDev/Huginn/commit/570769ee38f08a36d1b5fa206b636a443b671b4a))

## [0.37.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.36.0...api@v0.37.0) (2026-06-10)

### Features

- **api:** add get emoji route to cdn ([1cc9126](https://github.com/WerdoxDev/Huginn/commit/1cc9126e2fc10c289c8473841abd89e00bf6e221))

### Bug Fixes

- **api:** remove spamming trace + bug with closing voice transports ([0acb73c](https://github.com/WerdoxDev/Huginn/commit/0acb73cb0965bf2dea029b63d7e8876cec7d195f))

## [0.36.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.35.0...api@v0.36.0) (2026-06-05)

### Features

- **api:** implement OTel for all voice and gateway ([4470b76](https://github.com/WerdoxDev/Huginn/commit/4470b76f724bab4a3018d881f7b3889f74e78e24))

### Bug Fixes

- **api:** remove timeout from client initialization ([a556ac8](https://github.com/WerdoxDev/Huginn/commit/a556ac8797721cb556c0d3eb2ae75ec5f4df5972))

## [0.35.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.34.0...api@v0.35.0) (2026-05-26)

### Features

- **api:** add changelog route to common api ([6dada5d](https://github.com/WerdoxDev/Huginn/commit/6dada5de627bde5ea4061139121d08b13f97add2))

## [0.34.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.33.3...api@v0.34.0) (2026-05-21)

### Features

- **api:** add around property to message fetching ([812f9d5](https://github.com/WerdoxDev/Huginn/commit/812f9d5d9322ec287b8e499d0b593968b63c4431))
- **api:** new route for cdn banner image upload ([8541fe3](https://github.com/WerdoxDev/Huginn/commit/8541fe39cf6ef4a6d9e00af678a4000ade3d601a))
- **api:** user profile endpoints ([895a709](https://github.com/WerdoxDev/Huginn/commit/895a709188cde1f3b01bc08bb70d1dd3ade588aa))
- **app:** make text have exact visible height using new css property + ui info and index ui reworks ([50115cd](https://github.com/WerdoxDev/Huginn/commit/50115cde379e2bc5e3bc8e575ddfaa4ad79f304d))
- migrate prettier to oxfmt and full format ([#237](https://github.com/WerdoxDev/Huginn/issues/237)) ([62481be](https://github.com/WerdoxDev/Huginn/commit/62481beb58232bc373358338fa9bc19c889bddc8))

### Bug Fixes

- **api:** handle login with pending email ([c6ad357](https://github.com/WerdoxDev/Huginn/commit/c6ad357879b3102097ff4f28650de54776fa17b4))

## [0.33.3](https://github.com/WerdoxDev/Huginn/compare/api@v0.33.2...api@v0.33.3) (2026-01-24)

### Bug Fixes

- **api:** gateway wrong log section ([1f9752d](https://github.com/WerdoxDev/Huginn/commit/1f9752d732885b5dd6ab2d01cbb513b13166a0b7))

## [0.33.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.33.1...api@v0.33.2) (2026-01-06)

### Bug Fixes

- **api:** disconnected voice mid restart ice is not trying again ([8da0f32](https://github.com/WerdoxDev/Huginn/commit/8da0f329974c72cead084c4125fddc1cc102103d))
- **api:** gateway should not reconnect on 4012 ([97f6ea0](https://github.com/WerdoxDev/Huginn/commit/97f6ea0d1cda739c0208afa24ccf6f6e680b9866))

## [0.33.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.33.0...api@v0.33.1) (2026-01-04)

### Bug Fixes

- **api:** move event emitter to shared ([da24df2](https://github.com/WerdoxDev/Huginn/commit/da24df2af6316671e3a7b66f932093997342e623))

## [0.33.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.32.3...api@v0.33.0) (2025-12-29)

### Features

- **api:** add update video and audio stream settings ([780798d](https://github.com/WerdoxDev/Huginn/commit/780798d1d202e62cc8d97b77c6cd4662601b1289))

## [0.32.3](https://github.com/WerdoxDev/Huginn/compare/api@v0.32.2...api@v0.32.3) (2025-12-26)

### Bug Fixes

- **api:** add missing implementation for restart ice ([9c7e34e](https://github.com/WerdoxDev/Huginn/commit/9c7e34ea3c0b3dd0d4a3ae47cc14a1efd5344c68))

## [0.32.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.32.1...api@v0.32.2) (2025-12-24)

### Bug Fixes

- **api:** much better error throwing and handling + restart ice ([858b86d](https://github.com/WerdoxDev/Huginn/commit/858b86d09868d992a67127bbf2f5962051c3653b))

## [0.32.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.32.0...api@v0.32.1) (2025-12-22)

### Bug Fixes

- **api:** voice signalling should hard reset when closed from server side ([634af24](https://github.com/WerdoxDev/Huginn/commit/634af24e8cc01b1439b3a231c83acb9d63352d22))

## [0.32.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.31.2...api@v0.32.0) (2025-12-21)

### Features

- **api:** add voice resuming logic ([d8dc213](https://github.com/WerdoxDev/Huginn/commit/d8dc21349c43576bf24671559b2f79ed30e8c641))

## [0.31.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.31.1...api@v0.31.2) (2025-12-20)

### Bug Fixes

- **api:** potential fix for multi-socket connection issue ([83e3a11](https://github.com/WerdoxDev/Huginn/commit/83e3a114c2824a95741b9ccf07d24fa524d0dc04))

## [0.31.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.31.0...api@v0.31.1) (2025-12-18)

### Bug Fixes

- **api:** add videoGoogleStartBitrate to turn of auto bitrate estimation ([bb88593](https://github.com/WerdoxDev/Huginn/commit/bb88593614768501270714a2ccab58132e5d7004))

## [0.31.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.30.0...api@v0.31.0) (2025-12-14)

### Features

- **api:** add max bitrate options for audio and video when screen sharing ([56424ad](https://github.com/WerdoxDev/Huginn/commit/56424ad10b5b5a975606afa0f325861899553c2d))

## [0.30.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.29.2...api@v0.30.0) (2025-12-13)

### Features

- **api:** add better error message for event emitter + simulcast encoder options ([cb3c809](https://github.com/WerdoxDev/Huginn/commit/cb3c8092af8aacd8401061d04b8aa33059c2bf94))

## [0.29.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.29.1...api@v0.29.2) (2025-12-09)

### Bug Fixes

- **api:** some fixes regarding race conditions and new message error handlings ([f9fec6e](https://github.com/WerdoxDev/Huginn/commit/f9fec6eafa66e851e2e2e178d5fcd297bbd351a2))
- **api:** XHR request should throw the error when failed ([c084968](https://github.com/WerdoxDev/Huginn/commit/c08496812d2dcc8e29eb37bd8912d7e495d01c42))

## [0.29.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.29.0...api@v0.29.1) (2025-12-05)

### Bug Fixes

- **api:** better auth error handling ([3bb99c6](https://github.com/WerdoxDev/Huginn/commit/3bb99c67d32fba0ba8fa2a2b85c8945d94c5b877))
- **api:** potential fix for turn servers ([33285ff](https://github.com/WerdoxDev/Huginn/commit/33285ff3f92f2f765aa23ff288c8b9aff3782433))

## [0.29.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.28.2...api@v0.29.0) (2025-11-18)

### Features

- **api:** saving remote consumers + better tests for gateway ([4c7d2bd](https://github.com/WerdoxDev/Huginn/commit/4c7d2bd039a6aa3dad691be9d423e9d939c4b3f7))

## [0.28.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.28.1...api@v0.28.2) (2025-11-09)

### Bug Fixes

- **api:** more graceful reset ([6d7bbd8](https://github.com/WerdoxDev/Huginn/commit/6d7bbd8aafaf9c667d6f4d1b26ca154c618247e3))

## [0.28.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.28.0...api@v0.28.1) (2025-11-06)

### Bug Fixes

- **api:** closing in the middle of connecting introduces a bad state bug ([077453b](https://github.com/WerdoxDev/Huginn/commit/077453b01d0d2042e821f55b58154004b9f03349))

## [0.28.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.27.0...api@v0.28.0) (2025-11-05)

### Features

- a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
- **api:** refactor gateway + complete client initialization rewrite ([5612512](https://github.com/WerdoxDev/Huginn/commit/5612512604288ab2c6ae189b0357e5f32af9d2f8))

### Bug Fixes

- **api:** add experimental reconnecting after transport disconnect ([4364273](https://github.com/WerdoxDev/Huginn/commit/4364273cd175a44d657c7655a379780933207f07))

## [0.27.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.26.0...api@v0.27.0) (2025-09-14)

### Features

- **api:** add presence activity support + application icon uploading method ([86cf932](https://github.com/WerdoxDev/Huginn/commit/86cf9325235d496ebf424a4a3b64cecf56d2d5df))
- **api:** add submit known application method ([281385a](https://github.com/WerdoxDev/Huginn/commit/281385afba6d3adccf6ff3cd3dad239c2c1ab4cd))

## [0.26.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.25.0...api@v0.26.0) (2025-09-06)

### Features

- **api:** add Applications api ([36079db](https://github.com/WerdoxDev/Huginn/commit/36079dbfb80944e0102b2f3586650dc60009d11f))

## [0.25.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.24.1...api@v0.25.0) (2025-08-29)

### Features

- **api:** add settings editing api ([3bd9749](https://github.com/WerdoxDev/Huginn/commit/3bd97491d38d50e4fb7b47823d9e68f675892dd2))

## [0.24.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.24.0...api@v0.24.1) (2025-08-23)

### Bug Fixes

- **api:** few undetected edge case connection scenarios ([2314998](https://github.com/WerdoxDev/Huginn/commit/2314998bf71b8dc8e3e0e789da324f834d2ec69d))

## [0.24.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.23.0...api@v0.24.0) (2025-08-20)

### Features

- **api:** add message delete routes ([58de9df](https://github.com/WerdoxDev/Huginn/commit/58de9df7621d232c59dbfbae7529a0ef5933aaac))

### Bug Fixes

- **api:** reconnect to voice after gateway disconnect not working ([6a35632](https://github.com/WerdoxDev/Huginn/commit/6a356328fffa36cf7d7c126fd8a92ea7e4173d81))

## [0.23.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.4...api@v0.23.0) (2025-08-16)

### Features

- **api:** add message edit function ([fd5a691](https://github.com/WerdoxDev/Huginn/commit/fd5a69117706940c34c5db3125dfa6926109042c))

## [0.22.4](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.3...api@v0.22.4) (2025-08-11)

### Bug Fixes

- **api:** gateway should disconnect voice if a null voice state from server is received ([1a77d14](https://github.com/WerdoxDev/Huginn/commit/1a77d140df6580da30255a3c02b6a88d23f78c30))

## [0.22.3](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.2...api@v0.22.3) (2025-08-09)

### Bug Fixes

- **api:** some small promise fixes ([33bd375](https://github.com/WerdoxDev/Huginn/commit/33bd375839257d499d8a457a9e5352c64364abb6))

## [0.22.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.1...api@v0.22.2) (2025-07-29)

### Bug Fixes

- **api:** add a new status type to voice for better status tracking + some promise fixes ([998fed9](https://github.com/WerdoxDev/Huginn/commit/998fed9aa52e4d12b859975f1055463ca164a9a3))

## [0.22.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.22.0...api@v0.22.1) (2025-07-28)

### Bug Fixes

- **api:** consume producer hangs when consumers are created fast enough ([a64c3c0](https://github.com/WerdoxDev/Huginn/commit/a64c3c0c448767386b21bcad131f231a73960905))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.21.1...api@v0.22.0) (2025-07-24)

### Features

- **api:** add support for audio only streaming ([4030d55](https://github.com/WerdoxDev/Huginn/commit/4030d55074d14f3377e3cef311fe75c8bb76dcc2))

## [0.21.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.21.0...api@v0.21.1) (2025-07-22)

### Bug Fixes

- **api:** gateway is not reauthenticating when session is invalid ([54bdab2](https://github.com/WerdoxDev/Huginn/commit/54bdab29c615b51fd3fe323d65690f447fdde217))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.20.0...api@v0.21.0) (2025-07-20)

### Features

- **api:** add close consumer handling ([0fc9ab3](https://github.com/WerdoxDev/Huginn/commit/0fc9ab35af11de145788ef019465a6b3ab951679))
- **api:** add log sending ([cdaf64c](https://github.com/WerdoxDev/Huginn/commit/cdaf64c671c387818d6a10ea9998da968b2f7001))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.2...api@v0.20.0) (2025-07-18)

### Features

- **api:** add separate voice and camera streaming functions ([818312b](https://github.com/WerdoxDev/Huginn/commit/818312b8185cee8485a1b811bf7eb009078f3043))

## [0.19.2](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.1...api@v0.19.2) (2025-07-16)

### Bug Fixes

- **api:** issue with voice and gateway reconnecting ([026d442](https://github.com/WerdoxDev/Huginn/commit/026d442da424eb82b3a1095cb3d9e90162b1456a))

## [0.19.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.19.0...api@v0.19.1) (2025-07-11)

### Bug Fixes

- **api:** logout should wait for gateway to close ([e5c3644](https://github.com/WerdoxDev/Huginn/commit/e5c3644d627f7f3625773691b4c3ae9989335b78))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.18.1...api@v0.19.0) (2025-07-09)

### Features

- **api:** add bunch of tests for gateway and voice + some bug fixes ([dbd10ae](https://github.com/WerdoxDev/Huginn/commit/dbd10ae1cb08a3688587adb6d3f3748761d3133d))

## [0.18.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.18.0...api@v0.18.1) (2025-07-07)

### Bug Fixes

- **api:** slightly update tests + bug in reconnecting ([ca8869a](https://github.com/WerdoxDev/Huginn/commit/ca8869a70681e482d9001234cd719fafc1e15217))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.17.0...api@v0.18.0) (2025-07-04)

### Features

- **api:** add much better state tracking and initialization strategy to voice and gateway ([92e8e6e](https://github.com/WerdoxDev/Huginn/commit/92e8e6e40d78d1cea2ebe03b7d7d0e3dd622bcc9))
- **api:** add voice websocket status change event ([c569dae](https://github.com/WerdoxDev/Huginn/commit/c569daebb3ac503121ff84cc774ca38fb5abf074))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.16.0...api@v0.17.0) (2025-06-19)

### Features

- **api:** use extensive logging for gateway and voice + remove log option from gatway and voice ([dd99d78](https://github.com/WerdoxDev/Huginn/commit/dd99d7885acc448d4f807ed441461a198aac080c))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.15.0...api@v0.16.0) (2025-06-09)

### Features

- **app:** add voice screenshare fps, resolution and audio indicators ([9baca3a](https://github.com/WerdoxDev/Huginn/commit/9baca3aeb336c50a7bce19297282bb40ab1e9e9b))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.14.0...api@v0.15.0) (2025-05-31)

### Features

- **api:** implement a much better management strategy for producers & consumers ([d56460b](https://github.com/WerdoxDev/Huginn/commit/d56460b5f3794a8c273a1732417462dd8dc7ad01))

### Bug Fixes

- **api:** temporary fix for changing stream black screen problem ([0317fcd](https://github.com/WerdoxDev/Huginn/commit/0317fcda3aea80fd1df1b0a8acfc3c0a5b290d69))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.13.0...api@v0.14.0) (2025-05-16)

### Features

- **api:** add screenshare in voice handling ([803cf93](https://github.com/WerdoxDev/Huginn/commit/803cf93778965f02fceec2dbd0fc69ae732a45b4))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.12.0...api@v0.13.0) (2025-05-12)

### Features

- **api:** add update voice state function and bunch of utility for muting/pausing media ([3fd4a13](https://github.com/WerdoxDev/Huginn/commit/3fd4a1319ed9da3dec36685439bcb401e39d2563))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.11.1...api@v0.12.0) (2025-04-30)

### Features

- **api:** handle sending and processing ping ([0674b89](https://github.com/WerdoxDev/Huginn/commit/0674b89cd65ece337b9a366166b412d681e7aaca))

## [0.11.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.11.0...api@v0.11.1) (2025-04-27)

### Bug Fixes

- **api:** resetting voice class is not correct ([200a0ed](https://github.com/WerdoxDev/Huginn/commit/200a0ed1f0c845afab8bd761f4fb05b4bb503147))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.10.0...api@v0.11.0) (2025-04-26)

### Features

- **api:** add offAll to history event emitter ([c6a156e](https://github.com/WerdoxDev/Huginn/commit/c6a156e55893bada378a45afdb5ea5bd659546ab))

### Bug Fixes

- **api:** replacing audio track is not working ([29343f2](https://github.com/WerdoxDev/Huginn/commit/29343f2a00ad4274493afc607421ff71eca6b5ab))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.9.0...api@v0.10.0) (2025-04-14)

### Features

- **api:** add call ringing request ([1bf2a3d](https://github.com/WerdoxDev/Huginn/commit/1bf2a3da4722e49d517dfe52b06b2acc2b9768ee))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.8.0...api@v0.9.0) (2025-04-04)

### Features

- **api:** add all event listeners for voice ([f15257e](https://github.com/WerdoxDev/Huginn/commit/f15257e857acbd86dd821d8e4637543893355dc9))
- **api:** add full closing and voice disconnect gateway message ([548afd0](https://github.com/WerdoxDev/Huginn/commit/548afd0b6d0a4277fafc91c2b2b2d910cca3be69))
- **api:** add initial functionality for voice ([207c807](https://github.com/WerdoxDev/Huginn/commit/207c8076cda418769d46e43113ba6491ebc9f1b6))
- **api:** add listen function returning an unlisten ([3ba1de5](https://github.com/WerdoxDev/Huginn/commit/3ba1de5ad44e6686dd8efad6ee1351fc9ff78c07))
- **api:** add transport creation ws requests ([d0d856f](https://github.com/WerdoxDev/Huginn/commit/d0d856ff8e959a8b27a6a8dd4f04ca054b6a2955))
- **api:** add voice websocket identify sending ([d006ba1](https://github.com/WerdoxDev/Huginn/commit/d006ba14671eca4f2816589f282d552f3ab5411e))
- **api:** voice event changes ([769d08e](https://github.com/WerdoxDev/Huginn/commit/769d08eb42efcce76eda96679df4f7f005dc5dd8))

### Bug Fixes

- **api:** revert type name change ([1f64c86](https://github.com/WerdoxDev/Huginn/commit/1f64c865ae4b00aab676678d35d045cd5937e5ae))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.7.1...api@v0.8.0) (2025-03-02)

### Features

- **api:** add aborting capability to xhr ([0fb2855](https://github.com/WerdoxDev/Huginn/commit/0fb2855a64e14383a70b5c1e63df66ba2179f4f0))

## [0.7.1](https://github.com/WerdoxDev/Huginn/compare/api@v0.7.0...api@v0.7.1) (2025-02-18)

### Bug Fixes

- **api:** add the browser checking function to utils ([45b6851](https://github.com/WerdoxDev/Huginn/commit/45b6851743e4ca6e2ae32a689b139f3d9af70bbe))
- **api:** make files optional on createMessage ([4ab9e83](https://github.com/WerdoxDev/Huginn/commit/4ab9e839b113a9807a9adc72327ae2e765c9a8d6))
- **api:** prevent non browser environments from using XHR ([0ac5cd0](https://github.com/WerdoxDev/Huginn/commit/0ac5cd03a0e8501fe43ef0cf57272bbaff9b0b73))
- **api:** remove error throws from gateway authenticate because they cannot be catched ([e1385ca](https://github.com/WerdoxDev/Huginn/commit/e1385ca7592ebb831b5c5fbf286523f954a238e7))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.6.0...api@v0.7.0) (2025-02-15)

### Features

- **api:** add xhr support to requests ([d634709](https://github.com/WerdoxDev/Huginn/commit/d634709fc6afbd7df0966373441c2d505c6ed627))

### Bug Fixes

- **api:** add a custom close code to prevent issues with compatibility ([b6b05d8](https://github.com/WerdoxDev/Huginn/commit/b6b05d8f60de8b3e50cd0c9042a3ac60fc9cd23c))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.5.0...api@v0.6.0) (2025-02-11)

### Features

- **app:** add status bar ([66cefb3](https://github.com/WerdoxDev/Huginn/commit/66cefb38090e10e3c4c6d556ba178a075a645d64))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/api@v0.4.0...api@v0.5.0) (2025-02-01)

### Features

- **api:** add much better gateway reconnect handling ([8121a92](https://github.com/WerdoxDev/Huginn/commit/8121a92005a5ad73dc7e2e6c3d82369603af34e4))
- **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))

### Bug Fixes

- **api:** client gateway is no longer required to make a fetch to /api first ([65ca836](https://github.com/WerdoxDev/Huginn/commit/65ca8368472e75f8a7cbd2f228615d2c6f264d22))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/api-v0.3.0...api@v0.4.0) (2025-01-07)

### Features

- prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))

### Bug Fixes

- action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
- action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
- action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
- **api:** remove unused type from utils ([5d82c29](https://github.com/WerdoxDev/Huginn/commit/5d82c294f0c30e9603b4abcc6a29ab4a6e00e43d))
