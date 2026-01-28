# Changelog

## [0.22.2](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.22.1...backend-shared@v0.22.2) (2026-01-24)


### Bug Fixes

* **backend-shared:** trim username ([50a145f](https://github.com/WerdoxDev/Huginn/commit/50a145f144f72e25fa31427e42d8344fc4aa6798))

## [0.22.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.22.0...backend-shared@v0.22.1) (2026-01-06)


### Bug Fixes

* **backend-shared:** a rare bug that caused resumed session to be deleted ([781b5c4](https://github.com/WerdoxDev/Huginn/commit/781b5c480229a55280dbf0be6e1fe0e654348c08))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.21.0...backend-shared@v0.22.0) (2025-12-26)


### Features

* **backend-shared:** migrate to prisma v7 ([792a28a](https://github.com/WerdoxDev/Huginn/commit/792a28ab86a85cb4b35cac90d2b67f4630b25975))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.20.3...backend-shared@v0.21.0) (2025-12-22)


### Features

* **backend-shared:** use mediabunny instead of ffmpeg for probing video ([87c0f28](https://github.com/WerdoxDev/Huginn/commit/87c0f28fd1b21436cedb40eac8ed93a3fa6a48bb))

## [0.20.3](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.20.2...backend-shared@v0.20.3) (2025-12-21)


### Bug Fixes

* **backend-shared:** better session cleanup logic ([4cae7ac](https://github.com/WerdoxDev/Huginn/commit/4cae7ac96a9df08fdda1ec4081978c65efcffffd))

## [0.20.2](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.20.1...backend-shared@v0.20.2) (2025-12-20)


### Bug Fixes

* **backend-shared:** better sequence and sent message management ([5d1bd00](https://github.com/WerdoxDev/Huginn/commit/5d1bd00a48dc6b42c2d717e68c895a983c86491f))

## [0.20.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.20.0...backend-shared@v0.20.1) (2025-12-18)


### Bug Fixes

* **backend-shared:** add cancellation for session delete timeout ([cde0921](https://github.com/WerdoxDev/Huginn/commit/cde09217aa61c4dfb38a7ff4380393d90755cf87))
* **backend-shared:** resumed session should reset its timeout ([cb631de](https://github.com/WerdoxDev/Huginn/commit/cb631dede70801705e0fb0fb795e6211d5752a14))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.19.0...backend-shared@v0.20.0) (2025-12-09)


### Features

* **backend-shared:** add better direct session message sending ([2a86107](https://github.com/WerdoxDev/Huginn/commit/2a8610724071c9c9836e3bbfca7b5dcffb00ae9c))


### Bug Fixes

* **backend-shared:** fix incorrect password hashing ([073dfc9](https://github.com/WerdoxDev/Huginn/commit/073dfc9c10af41599fb4726fb76f2a99f8c9f68d))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.18.1...backend-shared@v0.19.0) (2025-12-05)


### Features

* **backend-shared:** passwords now save as hash ([5e432b7](https://github.com/WerdoxDev/Huginn/commit/5e432b7fbf1f2769150d1ebecfd34f13435d6a8a))

## [0.18.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.18.0...backend-shared@v0.18.1) (2025-11-18)


### Bug Fixes

* **backend-shared:** fix unnecessary long function for getting session with id ([1a41b6d](https://github.com/WerdoxDev/Huginn/commit/1a41b6d6f32468cc628ccc393644b3bc1c19e5d5))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.17.0...backend-shared@v0.18.0) (2025-11-05)


### Features

* a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))


### Bug Fixes

* **cdn:** little change in application icon handling ([3e4ae23](https://github.com/WerdoxDev/Huginn/commit/3e4ae23308b91b3f6c012f00e96159c61afcb424))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.16.1...backend-shared@v0.17.0) (2025-09-18)


### Features

* **backend-shared:** add message reference to schema + create message references ([7826110](https://github.com/WerdoxDev/Huginn/commit/7826110a08678f5e7ac82511ba3b6ae20ceff532))

## [0.16.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.16.0...backend-shared@v0.16.1) (2025-09-14)


### Bug Fixes

* **backend-shared:** change known application to use new name string ([f6dfdec](https://github.com/WerdoxDev/Huginn/commit/f6dfdec830c6ae220018e92d547083b833ee79dc))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.15.0...backend-shared@v0.16.0) (2025-09-14)


### Features

* **backend-shared:** add new fields for known application ([62574a7](https://github.com/WerdoxDev/Huginn/commit/62574a73598b5029b82b88e815561534e0fb4853))
* **backend-shared:** some db optimization and better dx ([5206eac](https://github.com/WerdoxDev/Huginn/commit/5206eacdb3786e80c55562e07ea4d9663a535075))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.14.1...backend-shared@v0.15.0) (2025-09-06)


### Features

* **backend-shared:** add db application models and functions ([ea9cdec](https://github.com/WerdoxDev/Huginn/commit/ea9cdecacf8b8541e2e241d828aa2ed68c8cef9d))
* **backend-shared:** move token-factory to backend shared ([24e2d16](https://github.com/WerdoxDev/Huginn/commit/24e2d161ebfc88bf2dcdc4e3746e923a8ece9e53))

## [0.14.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.14.0...backend-shared@v0.14.1) (2025-08-30)


### Bug Fixes

* **backend-shared:** settings should be cascaded when user is deleted ([b3dc711](https://github.com/WerdoxDev/Huginn/commit/b3dc711c5f5c6c19579a4168bd8372118cb26c54))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.13.0...backend-shared@v0.14.0) (2025-08-29)


### Features

* **backend-shared:** add settings table and prisma helpers ([4ad8a24](https://github.com/WerdoxDev/Huginn/commit/4ad8a2429b29e738b70a0fc56f311784acbe1cb2))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.12.2...backend-shared@v0.13.0) (2025-08-26)


### Features

* **backend-shared:** add message queueing for share websocket ([563d4f7](https://github.com/WerdoxDev/Huginn/commit/563d4f72667f5f06713f073978806a164f0df119))

## [0.12.2](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.12.1...backend-shared@v0.12.2) (2025-08-23)


### Bug Fixes

* **backend-shared:** add tolerance to heartbeat ([d985e82](https://github.com/WerdoxDev/Huginn/commit/d985e823ff08b9ac42d34783daef022e4e5b2880))

## [0.12.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.12.0...backend-shared@v0.12.1) (2025-08-22)


### Bug Fixes

* **backend-shared:** read state is not correctly updating when message is deleted ([b9c00f6](https://github.com/WerdoxDev/Huginn/commit/b9c00f6da0e2ac6801953ca8da9bd1a9d71035e1))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.11.0...backend-shared@v0.12.0) (2025-08-20)


### Features

* **backend-shared:** add delete message by id to db ([c8b9009](https://github.com/WerdoxDev/Huginn/commit/c8b9009ab65b545677e8ffa8118c71d82c6afb6c))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.10.2...backend-shared@v0.11.0) (2025-08-16)


### Features

* **backend-shared:** include idFix on database layer ([f931d80](https://github.com/WerdoxDev/Huginn/commit/f931d8031bcd3cb21574584ab7e6a896e1277a59))

## [0.10.2](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.10.1...backend-shared@v0.10.2) (2025-07-16)


### Bug Fixes

* **backend-shared:** use constants for voice token expire time ([96a3f06](https://github.com/WerdoxDev/Huginn/commit/96a3f065c8112dd9f9c832dd9d0019e5c91b5487))

## [0.10.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.10.0...backend-shared@v0.10.1) (2025-07-09)


### Bug Fixes

* **backend-shared:** rename function in shared websocket ([57a7126](https://github.com/WerdoxDev/Huginn/commit/57a71260c7f5f5a11f0e50234c5e64a79b0f1108))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.9.0...backend-shared@v0.10.0) (2025-07-04)


### Features

* **backend-shared:** add shared websocket and client-session implementation ([1c7413e](https://github.com/WerdoxDev/Huginn/commit/1c7413ea0d80f539ec2525600bdbe65e75721553))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.8.0...backend-shared@v0.9.0) (2025-04-14)


### Features

* **backend-shared:** type changes + call message selection ([a01e8a3](https://github.com/WerdoxDev/Huginn/commit/a01e8a3f3c85775e7d2851ce55e4699c458882c9))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.7.2...backend-shared@v0.8.0) (2025-04-04)


### Features

* **backend-shared:** add voice token generation ([a76ef72](https://github.com/WerdoxDev/Huginn/commit/a76ef72b4045d395c1bc53847461efe436293ef6))
* **backend-shared:** move all database handling to backend-shared ([d474a0b](https://github.com/WerdoxDev/Huginn/commit/d474a0b8741b0c4ffcadbf58e550e9acb74d855b))


### Bug Fixes

* **backend-shared:** revert name type changes ([ec72024](https://github.com/WerdoxDev/Huginn/commit/ec72024fa01d90f630be780dbae01d545c615447))

## [0.7.2](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.7.1...backend-shared@v0.7.2) (2025-03-06)


### Bug Fixes

* **backend-shared:** move test flag to test server preperation ([2626275](https://github.com/WerdoxDev/Huginn/commit/26262759add92946823b877b97953e5923fb3736))

## [0.7.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.7.0...backend-shared@v0.7.1) (2025-03-02)


### Bug Fixes

* **backend-shared:** ffmpeg temp file is not deleted ([927f292](https://github.com/WerdoxDev/Huginn/commit/927f292989a27f79f1895ac87935962d60d6faf9))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.6.0...backend-shared@v0.7.0) (2025-02-25)


### Features

* **backend-shared:** add ffmpeg probing ([32119a0](https://github.com/WerdoxDev/Huginn/commit/32119a04b7dfe8a75256ce8037b1363b818eb323))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.5.0...backend-shared@v0.6.0) (2025-02-23)


### Features

* **backend-shared:** add getImageData utility from server ([1e60746](https://github.com/WerdoxDev/Huginn/commit/1e60746548f0aa96380106140aa46a25955ccb8d))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.4.0...backend-shared@v0.5.0) (2025-02-19)


### Features

* **backend-shared:** add subdirectory in logs ([6a7b2b3](https://github.com/WerdoxDev/Huginn/commit/6a7b2b38e5bfc802428be7660bb70013161a6244))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.3.0...backend-shared@v0.4.0) (2025-02-11)


### Features

* **backend-shared:** add peer address to gateway open log ([66ded2e](https://github.com/WerdoxDev/Huginn/commit/66ded2e13c44c11dd7a40dfbde5c6e2355e6cf0a))


### Bug Fixes

* **backend-shared:** error logging is not logging the whole error ([777693f](https://github.com/WerdoxDev/Huginn/commit/777693fee0eba9b39a32f58f771d9d4c5d648cf8))

## [0.3.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.2.1...backend-shared@v0.3.0) (2025-02-01)


### Features

* **backend-shared:** change waitUntil promises name to solve conflict with nitro ([40a6dc3](https://github.com/WerdoxDev/Huginn/commit/40a6dc3c1d64c257e41972af869bd0037bf0de4a))
* **backend-shared:** move server's test utils to backend-shared ([7bf1265](https://github.com/WerdoxDev/Huginn/commit/7bf12657f1268c9c09f927a8b76f6f4e91d3d8d5))

## [0.2.1](https://github.com/WerdoxDev/Huginn/compare/backend-shared@v0.2.0...backend-shared@v0.2.1) (2025-01-07)


### Bug Fixes

* **backend-shared:** remove unused import ([91e61c6](https://github.com/WerdoxDev/Huginn/commit/91e61c63b35a1e693f8a72c72c5ae11c5ee0919a))

## [0.2.0](https://github.com/WerdoxDev/Huginn/compare/backend-shared-v0.1.0...backend-shared@v0.2.0) (2025-01-07)


### Features

* **backend-shared:** add utility common funtionality for cdn,server and bifrost ([ab27da5](https://github.com/WerdoxDev/Huginn/commit/ab27da5edb688f97115f028396de3f0a658097cf))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add waitUntil + embed thumbnail processing ([9894172](https://github.com/WerdoxDev/Huginn/commit/9894172f16722ee64151fd068b3b129f0b259f0a))


### Bug Fixes

* action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
* action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
