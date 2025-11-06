# Changelog

## [0.61.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.1...app@v0.61.2) (2025-11-06)


### Bug Fixes

* **app:** builder config is not correct ([e7e7f23](https://github.com/WerdoxDev/Huginn/commit/e7e7f2386f4f81226cd23888b0d975f42f53ca53))

## [0.61.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.0...app@v0.61.1) (2025-11-06)


### Bug Fixes

* **app:** make bun use hoisted install for electron-builder ([1908146](https://github.com/WerdoxDev/Huginn/commit/1908146df06602b1204010c6808ace156445005a))

## [0.61.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.3...app@v0.61.0) (2025-11-05)


### Features

* a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
* **app:** use new huginn client initialization method ([bab910e](https://github.com/WerdoxDev/Huginn/commit/bab910e61fa09e586261fa74d5f45da6a13f6f39))


### Bug Fixes

* **app:** speaking state is not set using correct user id ([f69c2f9](https://github.com/WerdoxDev/Huginn/commit/f69c2f9a7e3f7d1ba3e966d53a4688c0965904c0))
* **app:** voice enter and exit sound is not correct ([3addfa8](https://github.com/WerdoxDev/Huginn/commit/3addfa8381aa36dfdcba81e70b092332b5ecd741))

## [0.60.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.2...app@v0.60.3) (2025-09-26)


### Bug Fixes

* **app:** enable voice transport logs ([dccdd3e](https://github.com/WerdoxDev/Huginn/commit/dccdd3e94069514a4697aa2c808091e3ffda1051))

## [0.60.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.1...app@v0.60.2) (2025-09-26)


### Bug Fixes

* **app:** loopback data should not be logged ([9b5d0f5](https://github.com/WerdoxDev/Huginn/commit/9b5d0f59cfb6aa1eea5e9ac2b5536848cfd5cf58))

## [0.60.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.0...app@v0.60.1) (2025-09-25)


### Bug Fixes

* **app:** ignore proxy for app ([99c6f93](https://github.com/WerdoxDev/Huginn/commit/99c6f93fce675d51ce9257a5b8160403ba3e0c98))
* **app:** quick fix to launch app without silent arg on relaunch ([2afb54a](https://github.com/WerdoxDev/Huginn/commit/2afb54adfcdd1d250b95c8c7ffce4e77a390d7f4))

## [0.60.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.59.1...app@v0.60.0) (2025-09-24)


### Features

* **app:** convert storage management to a way more robust solution. ([88aacb6](https://github.com/WerdoxDev/Huginn/commit/88aacb671944199f08d50685c6870ab6751a913a))


### Bug Fixes

* **app:** add shims to tsdown to fix __filename ([5a24ff7](https://github.com/WerdoxDev/Huginn/commit/5a24ff7bd6a104106136f16f2eceb364b16b96aa))
* **app:** little tweaks in logger ([d3357d2](https://github.com/WerdoxDev/Huginn/commit/d3357d28b8274948bb744617e9820816535ee2fe))

## [0.59.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.59.0...app@v0.59.1) (2025-09-19)


### Bug Fixes

* **app:** move message rendering to custom renderer instead of slate ([0da38af](https://github.com/WerdoxDev/Huginn/commit/0da38af81c676409145c77ddba9c52eac0fd9243))
* **app:** much better avatar and channel icon loading and caching ([9d076b1](https://github.com/WerdoxDev/Huginn/commit/9d076b103c6b827761c9e2b51a3758f2e2d9ee0a))

## [0.59.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.58.0...app@v0.59.0) (2025-09-18)


### Features

* **app:** add message replying + bunch of query mutation bug fixes ([104ab04](https://github.com/WerdoxDev/Huginn/commit/104ab04956f06264fe8c49c0b7f7aaf02335b50a))

## [0.58.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.2...app@v0.58.0) (2025-09-16)


### Features

* **app:** add custom activity + separate tabs for submission and custom ([981459a](https://github.com/WerdoxDev/Huginn/commit/981459a4af7cee4b9e0e5177c9af510225fffb7f))

## [0.57.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.1...app@v0.57.2) (2025-09-14)


### Bug Fixes

* **app:** support multiple known application names ([6e13d82](https://github.com/WerdoxDev/Huginn/commit/6e13d820b689810139d2516d432d787e5c392823))

## [0.57.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.0...app@v0.57.1) (2025-09-14)


### Bug Fixes

* **app:** force an update [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([a93b1ba](https://github.com/WerdoxDev/Huginn/commit/a93b1ba264e3f03dc11e7fef697356b94b14448a))

## [0.57.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.56.0...app@v0.57.0) (2025-09-14)


### Features

* **app:** add activity updating + first iteration activity preview UI ([f7051ca](https://github.com/WerdoxDev/Huginn/commit/f7051ca5b642cdcfd91afce1b37b672e936bb4b4))
* **app:** add settings activity + activity contribution tab + much better native addon icon detection ([d7e6799](https://github.com/WerdoxDev/Huginn/commit/d7e6799f5987b938d1ba9692f0affa7178d3db5b))
* **app:** Icon from xbox apps are now extracted as well ([70fa9f9](https://github.com/WerdoxDev/Huginn/commit/70fa9f94c12da9e097176f2a3aac00f9b8d3ce9e))
* **native-addon:** move addon code to separate package ([41f7641](https://github.com/WerdoxDev/Huginn/commit/41f7641bd3a4ad71ffa272676b9e12efa03d9ad9))


### Bug Fixes

* **app:** add moment to noExternal ([e34ace6](https://github.com/WerdoxDev/Huginn/commit/e34ace6dcd998c39f2117a116e8e78f62adedd2c))

## [0.56.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.2...app@v0.56.0) (2025-09-06)


### Features

* **app:** a first implementation with some icon and file utilities ([daf1570](https://github.com/WerdoxDev/Huginn/commit/daf1570a1c62ad9a5c390d855f645f313dc97f71))
* **app:** add better bundling + native module testing ([428f6a5](https://github.com/WerdoxDev/Huginn/commit/428f6a5c1ae0fdaf5a2f48efcf3cedf4ee38c294))
* **app:** add cmakejs instead of node-gyp ([1e7c0a8](https://github.com/WerdoxDev/Huginn/commit/1e7c0a89439641f2e028df6855c12eb2f8b467cf))
* **app:** add scarlet theme + update old icons ([fb8ea1c](https://github.com/WerdoxDev/Huginn/commit/fb8ea1cee75db53a29d9ff451f107a08ce3369a2))
* **app:** fetch known games with last updated field for delta updates ([713af71](https://github.com/WerdoxDev/Huginn/commit/713af71873ce513cb0f512e03b53f4322c16f2a8))
* **app:** lots of cleanup and napi function changes ([4422bc2](https://github.com/WerdoxDev/Huginn/commit/4422bc2f0b0d1ce0407c6467677065ad8656062e))
* **app:** native addon window utility ([293072e](https://github.com/WerdoxDev/Huginn/commit/293072e52bc68ac84604d60644c6aba1a9ed4e4e))


### Bug Fixes

* **app:** app should listen for session_update not settings_update ([95be693](https://github.com/WerdoxDev/Huginn/commit/95be693406996d0b2aca03aeda67aa30577a4a7b))
* **app:** image preview search wrong is wrong ([3cdef4e](https://github.com/WerdoxDev/Huginn/commit/3cdef4ec5a3b45bd8cb231977fb2df5848cec75c))

## [0.55.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.1...app@v0.55.2) (2025-08-30)


### Bug Fixes

* **app:** dnd status should be respected for not playing audio ([bfd173b](https://github.com/WerdoxDev/Huginn/commit/bfd173b60876f71005ea6bd22ef45140d9657d1b))
* **app:** updating presence should trigger a settings save manually ([0ba7e7b](https://github.com/WerdoxDev/Huginn/commit/0ba7e7b9ce11325b46982ce71c7cade6af25150c))

## [0.55.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.0...app@v0.55.1) (2025-08-29)


### Bug Fixes

* **app:** update news.md ([f8415a5](https://github.com/WerdoxDev/Huginn/commit/f8415a5ff5f22be33a2d9e8e8d561fb987b5774d))

## [0.55.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.4...app@v0.55.0) (2025-08-29)


### Features

* **app:** add status choosing + server setting editing ([b6cf773](https://github.com/WerdoxDev/Huginn/commit/b6cf773c554debd368254e1df1777037da4a5786))


### Bug Fixes

* **app:** hide voice controls after no mouse activity ([ec8546e](https://github.com/WerdoxDev/Huginn/commit/ec8546e2a6d74db0a7eb1c4e562aff41328f0710))

## [0.54.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.3...app@v0.54.4) (2025-08-26)


### Bug Fixes

* **app:** make presences only have userId + presences visual bug ([6a980b4](https://github.com/WerdoxDev/Huginn/commit/6a980b4795eae7fd1e513e0e96393d554b1afc9d))

## [0.54.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.2...app@v0.54.3) (2025-08-23)


### Bug Fixes

* **app:** add bunch computed values to users and channels + notification body for every message type ([0224dd9](https://github.com/WerdoxDev/Huginn/commit/0224dd95c7edc9581ec04a306c4cc58348edff9b))

## [0.54.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.1...app@v0.54.2) (2025-08-23)


### Bug Fixes

* **app:** temporary visual fix for voice when gateway disconnects ([8d63046](https://github.com/WerdoxDev/Huginn/commit/8d63046d013b1cdc770b003af2de33f9fc307eff))

## [0.54.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.0...app@v0.54.1) (2025-08-22)


### Bug Fixes

* **app:** bunch of scrolling and read state bug fixes ([99108de](https://github.com/WerdoxDev/Huginn/commit/99108de643ede737d0f7d50d413f78fba83b88be))
* **app:** last message of any channel is always getting flagged as unseen ([0a4384e](https://github.com/WerdoxDev/Huginn/commit/0a4384ee9648323ace061531975af3211552e0bd))
* **app:** little visual improvement + message should not rerender when not preview ([fd74f1b](https://github.com/WerdoxDev/Huginn/commit/fd74f1bb71d22e99779c711b04c4a567b20dfbcc))
* **app:** sent messages in an invisible query page should not be added to query data ([dec8724](https://github.com/WerdoxDev/Huginn/commit/dec8724d2feffe058d31d7b7fed83d9719aca8f3))

## [0.54.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.2...app@v0.54.0) (2025-08-20)


### Features

* **app:** add delete message functionality ([36dd5c9](https://github.com/WerdoxDev/Huginn/commit/36dd5c96315b154bb621517a3925652367376035))
* **app:** add voice disconnected indicator ([3fe348c](https://github.com/WerdoxDev/Huginn/commit/3fe348c799fa8c235f88b73e5ba91065dccd3307))


### Bug Fixes

* **app:** logout not working correctly ([30aa284](https://github.com/WerdoxDev/Huginn/commit/30aa2843b5309cf66a128d49aad2e66852a85281))

## [0.53.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.1...app@v0.53.2) (2025-08-20)


### Bug Fixes

* **app:** loopback should get process id by using closest title search + log types ([965a25e](https://github.com/WerdoxDev/Huginn/commit/965a25ef419ebecafde54498bb40b146335ef580))

## [0.53.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.0...app@v0.53.1) (2025-08-19)


### Bug Fixes

* **app:** bunch of bug fixes related to message editing and scrolling + voice preference saving bug ([3e3291f](https://github.com/WerdoxDev/Huginn/commit/3e3291f93c7a87caee70c0ad4be6c1f311dbbc5d))

## [0.53.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.52.0...app@v0.53.0) (2025-08-16)


### Features

* **app:** add message editing + better scroll down + message visual changes + call message participants ([55deccf](https://github.com/WerdoxDev/Huginn/commit/55deccf873d8370c579fcc8ddf9b443cfd2d8f5d))

## [0.52.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.7...app@v0.52.0) (2025-08-13)


### Features

* **app:** add keybinds ([c99a3e2](https://github.com/WerdoxDev/Huginn/commit/c99a3e29c6305c8f47093cd266e3ce320048b6c9))

## [0.51.7](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.6...app@v0.51.7) (2025-08-11)


### Bug Fixes

* **app:** joining a call when already in a call not working ([e5b22bb](https://github.com/WerdoxDev/Huginn/commit/e5b22bbbd51e02c66bea09773d1d05d9de383c31))
* **app:** multi session voice state and presence handling ([41489a2](https://github.com/WerdoxDev/Huginn/commit/41489a2aaebbf57f5fe01bfa4feb939bd16a6538))

## [0.51.6](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.5...app@v0.51.6) (2025-08-09)


### Bug Fixes

* **app:** add comment to force a build ([47563a1](https://github.com/WerdoxDev/Huginn/commit/47563a180bc9b809bed56c8c7e66257892371467))

## [0.51.5](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.4...app@v0.51.5) (2025-08-09)


### Bug Fixes

* **app:** visual bug fixes + bunch of client cleanup for dev ([9cff6e4](https://github.com/WerdoxDev/Huginn/commit/9cff6e4db0d93a7c60c79d8634f4304bc49cfd67))

## [0.51.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.3...app@v0.51.4) (2025-07-30)


### Bug Fixes

* **app:** bunch of more bug fixes related to voice ([8f561de](https://github.com/WerdoxDev/Huginn/commit/8f561de88de053b92490ae1e63978d73b269a225))

## [0.51.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.2...app@v0.51.3) (2025-07-29)


### Bug Fixes

* **app:** bunch of more fixes to voice visuals ([61c386c](https://github.com/WerdoxDev/Huginn/commit/61c386c540d16d8e6daab8f9e822608af804c6ac))
* **app:** update news ([c3baed2](https://github.com/WerdoxDev/Huginn/commit/c3baed2e6398ab337a3efec7eac3b638679504d4))

## [0.51.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.1...app@v0.51.2) (2025-07-28)


### Bug Fixes

* **app:** video stream is doubled when it also has audio ([3f13bb0](https://github.com/WerdoxDev/Huginn/commit/3f13bb09383290426f1020bfde848e632d2f6777))

## [0.51.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.0...app@v0.51.1) (2025-07-28)


### Bug Fixes

* **app:** few stream viewing + sound bug fixes ([cae4bfd](https://github.com/WerdoxDev/Huginn/commit/cae4bfd62c7c73b21890d440aff75f89eff911ed))

## [0.51.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.50.1...app@v0.51.0) (2025-07-27)


### Features

* **app:** add proper notification images + new sounds for leaving, entering and notification ([8760d36](https://github.com/WerdoxDev/Huginn/commit/8760d369483b2b8de627406ee5f9c29fdedce13a))


### Bug Fixes

* **app:** add no audio indicator + visual fixes for leaving voice channel ([dddda51](https://github.com/WerdoxDev/Huginn/commit/dddda517b4002704904fb5ca92af82c5db9489bc))

## [0.50.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.50.0...app@v0.50.1) (2025-07-24)


### Bug Fixes

* **app:** update news.md ([f3a191a](https://github.com/WerdoxDev/Huginn/commit/f3a191aafcfe7fc69726f56bb898e48fa64edb8b))

## [0.50.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.2...app@v0.50.0) (2025-07-24)


### Features

* **app:** add audio only stream with visualizer ([b16170d](https://github.com/WerdoxDev/Huginn/commit/b16170dc5c5dd541efc5078ed42cba893db08b43))


### Bug Fixes

* **app:** adding audio to a video stream won't get consumed + some ui fixes ([d4cc08a](https://github.com/WerdoxDev/Huginn/commit/d4cc08a5a29114cf0e895335d23e0c9265cfd0e4))

## [0.49.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.1...app@v0.49.2) (2025-07-23)


### Bug Fixes

* **app:** fix a few big voice bugs + bunch of voice state name changes ([87daad5](https://github.com/WerdoxDev/Huginn/commit/87daad5d6c69fc12afb494f623cb5fa806d63f5e))

## [0.49.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.0...app@v0.49.1) (2025-07-22)


### Bug Fixes

* **app:** pathe is used instead of path ([e88a07b](https://github.com/WerdoxDev/Huginn/commit/e88a07b09d94b78b81ef0043c08778c96ce764d1))

## [0.49.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.2...app@v0.49.0) (2025-07-22)


### Features

* **app:** make audio volume not linear ([f3de1dc](https://github.com/WerdoxDev/Huginn/commit/f3de1dc4573b47e417ff55bc585fa4c303c1485d))
* **app:** voice preference saves now + much better file/localstorage handling ([efdbed4](https://github.com/WerdoxDev/Huginn/commit/efdbed415a8be2fa8c14217f66de8f78a0b2ad95))

## [0.48.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.1...app@v0.48.2) (2025-07-21)


### Bug Fixes

* **app:** fix updating screen logic and event listeners for update/connect steps ([ccd5b5e](https://github.com/WerdoxDev/Huginn/commit/ccd5b5ebf3b12d9b93992ce5f94676e00c3c6201))

## [0.48.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.0...app@v0.48.1) (2025-07-21)


### Bug Fixes

* **app:** user speaking style is not applied correctly ([005b6be](https://github.com/WerdoxDev/Huginn/commit/005b6be4178dcec089b973251cab994dc812d2d4))

## [0.48.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.47.0...app@v0.48.0) (2025-07-20)


### Features

* **app:** add basic posthog event capturing (wip) ([a42d688](https://github.com/WerdoxDev/Huginn/commit/a42d688bd8873133d8131f704a0b2a82f0c763a8))
* **app:** add screenshare watch/unwatch + much better voice element handling ([ac57890](https://github.com/WerdoxDev/Huginn/commit/ac57890fb17b7e226bc78c4bc4ef6238585180f7))

## [0.47.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.2...app@v0.47.0) (2025-07-18)


### Features

* **app:** add camera settings + camera preview + shared tab component ([0f0c04c](https://github.com/WerdoxDev/Huginn/commit/0f0c04c28d9eaba8bf7ac1e5767980aef41167ee))
* **app:** add camera streaming feature ([48c2a76](https://github.com/WerdoxDev/Huginn/commit/48c2a7677736f3fbaa832bf4da2dfee35119df9d))

## [0.46.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.1...app@v0.46.2) (2025-07-16)


### Bug Fixes

* **app:** fix typo ([4f587e6](https://github.com/WerdoxDev/Huginn/commit/4f587e69f4f9e6b6de4089e8914a3580ad43c007))
* **app:** some ui issues and local voice state changes ([8619b73](https://github.com/WerdoxDev/Huginn/commit/8619b73ce926e4e6a94180551eed296176303fa1))

## [0.46.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.0...app@v0.46.1) (2025-07-15)


### Bug Fixes

* **app:** electron builder needs a publish config ([b593327](https://github.com/WerdoxDev/Huginn/commit/b5933277610c535af2cdcd6d463e78ccef705ce1))

## [0.46.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.45.0...app@v0.46.0) (2025-07-15)


### Features

* **app:** add ability to use external url to fetch hostnames for api,cdn,voice ([b6e40d6](https://github.com/WerdoxDev/Huginn/commit/b6e40d6decc68453e939a771fec0a1aabaaf0152))


### Bug Fixes

* **app:** case-sensitive file rename ([e161b0e](https://github.com/WerdoxDev/Huginn/commit/e161b0e1d051dfc3b59ddff98da92c2cd2169404))
* **app:** inset rounded corners are not working with new tailwind v4 ([37c59ae](https://github.com/WerdoxDev/Huginn/commit/37c59ae59fc3ebceb24a6596d4a4f59ad87f305e))
* **app:** logging out from a channel causes an error ([b0ecb47](https://github.com/WerdoxDev/Huginn/commit/b0ecb47a79acf6a27648463a57948d318f396cd2))
* **app:** make initial global client instance undefinable ([de361bf](https://github.com/WerdoxDev/Huginn/commit/de361bfba4ffcd0fd2eac91a25c1976456e84c3b))
* **app:** oauth should set tokens and go back to index ([6863371](https://github.com/WerdoxDev/Huginn/commit/686337119d5c6606ad1b7482c2d861db5b4141a1))
* **app:** propagation issue with user info component ([bee74c5](https://github.com/WerdoxDev/Huginn/commit/bee74c5f0a8616ed9ecf26cd5aa1c7348ece7c6e))
* **app:** scroll anchoring problem when opening recipients sidebar ([af7b7fc](https://github.com/WerdoxDev/Huginn/commit/af7b7fc0a7f855523cd9a0d83ad1e990de00b1b4))
* **app:** some issues after client was moved to index ([be53a63](https://github.com/WerdoxDev/Huginn/commit/be53a63a06ed0c15ca776d9cbe148995eeceaf9a))
* **app:** visual bugs + browser errors with new initialization ([9e29803](https://github.com/WerdoxDev/Huginn/commit/9e29803919073a467fa806fee2b3ce66112c81dd))

## [0.45.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.44.1...app@v0.45.0) (2025-07-11)


### Features

* **app:** add few playwright tests + much better loader for initialization ([eb6e3de](https://github.com/WerdoxDev/Huginn/commit/eb6e3defba3e951923126b9dcbd208b144d25ba3))


### Bug Fixes

* **app:** go back to vite 7 rollup + some visual bug fixes ([072488d](https://github.com/WerdoxDev/Huginn/commit/072488dd405c365c90daea8acda409357faf4c30))

## [0.44.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.44.0...app@v0.44.1) (2025-07-09)


### Bug Fixes

* **app:** forcing app release ([0dce31a](https://github.com/WerdoxDev/Huginn/commit/0dce31a9b1ccbfac1e84244dc6aaa36ef9a61b2a))

## [0.44.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.43.0...app@v0.44.0) (2025-07-09)


### Features

* **app:** add much better color variety + a little refreshed colors ([bc01817](https://github.com/WerdoxDev/Huginn/commit/bc018178bfe6f1a645cd2a2c8f72df8f32c0e9a6))


### Bug Fixes

* **app:** few html bugs + rename disconnected to close for voice events ([232d356](https://github.com/WerdoxDev/Huginn/commit/232d3568fc3126bdbd95560de0f974c4f4bca601))

## [0.43.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.2...app@v0.43.0) (2025-07-07)


### Features

* **app:** add animations to voice ui ([b272ec1](https://github.com/WerdoxDev/Huginn/commit/b272ec10b309b2db8f1388b5007c2b9cdf6ef8b3))

## [0.42.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.1...app@v0.42.2) (2025-07-04)


### Bug Fixes

* **app:** update application-loopback to fix build problem ([a89be59](https://github.com/WerdoxDev/Huginn/commit/a89be595126575cf642dc2ecdb4b46bde198b65b))

## [0.42.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.0...app@v0.42.1) (2025-07-04)


### Bug Fixes

* **app:** add forgotten updated news.md ([0c5fa4b](https://github.com/WerdoxDev/Huginn/commit/0c5fa4b774685d670dc70843621d269afd8a7ca8))

## [0.42.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.41.0...app@v0.42.0) (2025-07-04)


### Features

* **app:** refactor entire initialization method and fix bunch of state checking errors ([8208eea](https://github.com/WerdoxDev/Huginn/commit/8208eeafc955dc415276631bfaeb5a5b8798e1fd))


### Bug Fixes

* **app:** electron build is not correctly bundling application-loopback package ([de7fd89](https://github.com/WerdoxDev/Huginn/commit/de7fd89bc943303d4a1911a76ab79fa9c4817cf0))
* **app:** start background svg is to small on close state ([e5c4bcf](https://github.com/WerdoxDev/Huginn/commit/e5c4bcfb8af4ea410f9ef836ef1c7830757db091))

## [0.41.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.40.0...app@v0.41.0) (2025-06-19)


### Features

* **app:** add extensive logging for voice-store and voice-client ([6a3f4f2](https://github.com/WerdoxDev/Huginn/commit/6a3f4f241160a8cc07d43e45d1f97e0ad9836822))
* **app:** migrate splashscreen and loading into a single place without resizing window ([750c14b](https://github.com/WerdoxDev/Huginn/commit/750c14b2b5dab37db1baf7218509730c22daf436))


### Bug Fixes

* **app:** new splashscreen is not rendering on web ([65e66a8](https://github.com/WerdoxDev/Huginn/commit/65e66a8c2a05b4275624f3c7eef7672d19766703))

## [0.40.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.39.0...app@v0.40.0) (2025-06-14)


### Features

* **app:** refactor voice client into a class & voice noise suppression toggle ([bdacc40](https://github.com/WerdoxDev/Huginn/commit/bdacc4042ab5d88613990b33c03aea3b1996fd95))


### Bug Fixes

* **app:** ScreenshareModal is not being lazy loaded ([3dff231](https://github.com/WerdoxDev/Huginn/commit/3dff231b5a3c8e874864011ef067b36b26df164c))
* **app:** screensharemodal is using the wrong name in git ([6122a47](https://github.com/WerdoxDev/Huginn/commit/6122a475d3d1d1230bcf1aed46935e082438ea16))
* **app:** testing a potential fix on vercel [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([f34761f](https://github.com/WerdoxDev/Huginn/commit/f34761f73a0b638ae6c5638a3400358c1bc350bf))
* **app:** testing a potential fix on vercel [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([fa9be96](https://github.com/WerdoxDev/Huginn/commit/fa9be96ab621d39d61397604f59e1b28c5c8453d))

## [0.39.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.38.0...app@v0.39.0) (2025-06-09)


### Features

* **app:** add voice screenshare fps, resolution and audio indicators ([9baca3a](https://github.com/WerdoxDev/Huginn/commit/9baca3aeb336c50a7bce19297282bb40ab1e9e9b))

## [0.38.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.37.0...app@v0.38.0) (2025-06-08)


### Features

* **app:** add specific application audio loopback ([0214b2c](https://github.com/WerdoxDev/Huginn/commit/0214b2ce69e5ecd53f94a08a65777167fdf813ef))


### Bug Fixes

* **app:** context menu is not opening on fullscreen ([07f48f7](https://github.com/WerdoxDev/Huginn/commit/07f48f7328860fe5da0be7678048470500b0c67d))

## [0.37.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.36.0...app@v0.37.0) (2025-05-31)


### Features

* **app:** add volume slider for individual users & screenshares ([f9573ea](https://github.com/WerdoxDev/Huginn/commit/f9573ea85d23dcf0fd24f693c3b5b6117ab1d54b))
* **app:** better screensahre modal design + hidable voice controlls + better start/stop stream button ([85873d0](https://github.com/WerdoxDev/Huginn/commit/85873d03f79b5009d70a2077e16fcd15e72ad6d6))

## [0.36.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.35.0...app@v0.36.0) (2025-05-18)


### Features

* **app:** add screenshare stopping and some state managerment fixes ([b2f6bc8](https://github.com/WerdoxDev/Huginn/commit/b2f6bc837041b0cc9aac033a12083155ca113778))

## [0.35.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.34.1...app@v0.35.0) (2025-05-16)


### Features

* **app:** add audio input threshold + speaking indicator + voice cleanups ([92f4cfb](https://github.com/WerdoxDev/Huginn/commit/92f4cfb30c9acfcf2d01c1187ee72bbd59eb0e2c))
* **app:** add audio settings + global voice state + audio level checking ([c933af6](https://github.com/WerdoxDev/Huginn/commit/c933af67bb9d618fc10eb73c054e2d25cc4ded10))
* **app:** add first iteration of screensharing ([0871e59](https://github.com/WerdoxDev/Huginn/commit/0871e5961446ba934e24c5ae6e312f229ce43f64))
* **app:** add fullish ui for voice with buttons and indicators ([0642df1](https://github.com/WerdoxDev/Huginn/commit/0642df1613d1e582b823ca3448cd53423be08860))
* **app:** add news modal ([ff266a7](https://github.com/WerdoxDev/Huginn/commit/ff266a7d6bbb9105c1409e889b16ee01b0cc4681))
* **app:** add voice muting and deafening functionality with fully working pausing & resuming ([ba2ddc2](https://github.com/WerdoxDev/Huginn/commit/ba2ddc24453b98d0e5104d77c64a01b3b9ba447a))
* **app:** add voice status component ([3f5542c](https://github.com/WerdoxDev/Huginn/commit/3f5542c9f1ad2b127c0e88b33b39133bea3288fd))
* **app:** better call management and persistent support ([acf0ad4](https://github.com/WerdoxDev/Huginn/commit/acf0ad4feb9ff8344f9c62d422d41e14f8ccf8cb))
* **app:** electron github action [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([df2f245](https://github.com/WerdoxDev/Huginn/commit/df2f245d3ab5cef4c16cb789379d19f1c67fadff))
* **app:** electron github action [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([da24cbe](https://github.com/WerdoxDev/Huginn/commit/da24cbe670889fbc87bee5caaad5224474b1510a))
* **app:** finish migration to electron ([13650fb](https://github.com/WerdoxDev/Huginn/commit/13650fbd6b1bfaf2eaff70f62974361ffbcc34c7))
* **app:** half baked electron migration ([9c92b90](https://github.com/WerdoxDev/Huginn/commit/9c92b90bd1a600a97041e19dcc990860e8d9a968))
* **app:** merged splashscreen into the main window ([dad146b](https://github.com/WerdoxDev/Huginn/commit/dad146b66d7dc965c01adedce15eead683394594))
* **app:** refactor all api related hooks and contexts to use stores instead ([05ea484](https://github.com/WerdoxDev/Huginn/commit/05ea4847e009865e75a2a03d077127ab97d9e338))


### Bug Fixes

* **api:** voice server ip is incorrect ([1773d28](https://github.com/WerdoxDev/Huginn/commit/1773d289c3962c4935c418556a361bcb49321048))
* **app:** add better speaking state management ([6cb415b](https://github.com/WerdoxDev/Huginn/commit/6cb415be47aac8767f95bc697999ad4e1738c18c))
* **app:** disable multi range request for updater ([6a09215](https://github.com/WerdoxDev/Huginn/commit/6a092152c053158d05130cdfeb6ef2ad41598263))
* **app:** dont open dev tools ([fe089a4](https://github.com/WerdoxDev/Huginn/commit/fe089a41579039204fd25deafeb96ea17a85dd03))
* **app:** fix new splashscreen giving errors in the browser ([72da35c](https://github.com/WerdoxDev/Huginn/commit/72da35cfe47d320c565e3f005557bc90f6732b50))
* **app:** fix splashscreen not liking oauth and event listening outside ([0193390](https://github.com/WerdoxDev/Huginn/commit/0193390f8a99f8789b91efff7ca8b7ea161597e1))
* **app:** minor fullscreen fixes and better loading handling ([c9cb52f](https://github.com/WerdoxDev/Huginn/commit/c9cb52fe5ddbf184ec46b47f58c1dcc5afab7a4d))
* **app:** notification sound is not playing ([d714b48](https://github.com/WerdoxDev/Huginn/commit/d714b48a06515c5749e27bc303c6a62f80bcef9d))
* **app:** quarkyness with the scrolling down and up ([0b246be](https://github.com/WerdoxDev/Huginn/commit/0b246be597945c3584ef055917c9981036c76301))
* **app:** remove commented code + set startup app config ([af666e0](https://github.com/WerdoxDev/Huginn/commit/af666e098c43518b09829b96f43c62ef5e286bc7))
* **app:** remove test button and update news.md ([df9517e](https://github.com/WerdoxDev/Huginn/commit/df9517e192d34c53a9f146ab3ac185867549c346))
* **app:** scroll is not anchored to the bottom when user resizes the window ([5cdd72a](https://github.com/WerdoxDev/Huginn/commit/5cdd72a708e13123b6af375ca44bfaa467e0944f))
* **app:** speaking state is not updating ([08ce2d0](https://github.com/WerdoxDev/Huginn/commit/08ce2d036025a3051a497f8330fad33bab04ef79))
* **app:** use highest audio quality ([f0133b5](https://github.com/WerdoxDev/Huginn/commit/f0133b5cf9112d60fb5d029b3419e9baa8768ad5))
* **app:** video progress/volume bar not letting go ([ec540ad](https://github.com/WerdoxDev/Huginn/commit/ec540ad94948279e58f6ddbd9116b3bf70a6d0f5))
* **app:** voice server wrong url ([a027052](https://github.com/WerdoxDev/Huginn/commit/a0270520da8a3be5365a17309ae98d905e6d46ec))
* **app:** volume audio worklet url is not correct in build ([30a1a34](https://github.com/WerdoxDev/Huginn/commit/30a1a3484db446d1ff187604049c31604553f732))
* revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.34.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.34.0...app@v0.34.1) (2025-05-16)


### Bug Fixes

* **app:** remove test button and update news.md ([df9517e](https://github.com/WerdoxDev/Huginn/commit/df9517e192d34c53a9f146ab3ac185867549c346))

## [0.34.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.33.1...app@v0.34.0) (2025-05-16)


### Features

* **app:** add first iteration of screensharing ([0871e59](https://github.com/WerdoxDev/Huginn/commit/0871e5961446ba934e24c5ae6e312f229ce43f64))

## [0.33.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.33.0...app@v0.33.1) (2025-05-12)


### Bug Fixes

* **app:** voice server wrong url ([a027052](https://github.com/WerdoxDev/Huginn/commit/a0270520da8a3be5365a17309ae98d905e6d46ec))

## [0.33.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.3...app@v0.33.0) (2025-05-12)


### Features

* **app:** add news modal ([ff266a7](https://github.com/WerdoxDev/Huginn/commit/ff266a7d6bbb9105c1409e889b16ee01b0cc4681))
* **app:** add voice muting and deafening functionality with fully working pausing & resuming ([ba2ddc2](https://github.com/WerdoxDev/Huginn/commit/ba2ddc24453b98d0e5104d77c64a01b3b9ba447a))

## [0.32.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.2...app@v0.32.3) (2025-05-05)


### Bug Fixes

* **app:** quarkyness with the scrolling down and up ([0b246be](https://github.com/WerdoxDev/Huginn/commit/0b246be597945c3584ef055917c9981036c76301))
* **app:** scroll is not anchored to the bottom when user resizes the window ([5cdd72a](https://github.com/WerdoxDev/Huginn/commit/5cdd72a708e13123b6af375ca44bfaa467e0944f))

## [0.32.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.1...app@v0.32.2) (2025-05-01)


### Bug Fixes

* **app:** notification sound is not playing ([d714b48](https://github.com/WerdoxDev/Huginn/commit/d714b48a06515c5749e27bc303c6a62f80bcef9d))

## [0.32.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.0...app@v0.32.1) (2025-04-30)


### Bug Fixes

* **api:** voice server ip is incorrect ([1773d28](https://github.com/WerdoxDev/Huginn/commit/1773d289c3962c4935c418556a361bcb49321048))

## [0.32.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.3...app@v0.32.0) (2025-04-30)


### Features

* **app:** add voice status component ([3f5542c](https://github.com/WerdoxDev/Huginn/commit/3f5542c9f1ad2b127c0e88b33b39133bea3288fd))

## [0.31.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.2...app@v0.31.3) (2025-04-27)


### Bug Fixes

* **app:** speaking state is not updating ([08ce2d0](https://github.com/WerdoxDev/Huginn/commit/08ce2d036025a3051a497f8330fad33bab04ef79))

## [0.31.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.1...app@v0.31.2) (2025-04-27)


### Bug Fixes

* **app:** add better speaking state management ([6cb415b](https://github.com/WerdoxDev/Huginn/commit/6cb415be47aac8767f95bc697999ad4e1738c18c))

## [0.31.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.0...app@v0.31.1) (2025-04-26)


### Bug Fixes

* **app:** volume audio worklet url is not correct in build ([30a1a34](https://github.com/WerdoxDev/Huginn/commit/30a1a3484db446d1ff187604049c31604553f732))

## [0.31.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.30.0...app@v0.31.0) (2025-04-26)


### Features

* **app:** add audio input threshold + speaking indicator + voice cleanups ([92f4cfb](https://github.com/WerdoxDev/Huginn/commit/92f4cfb30c9acfcf2d01c1187ee72bbd59eb0e2c))
* **app:** add audio settings + global voice state + audio level checking ([c933af6](https://github.com/WerdoxDev/Huginn/commit/c933af67bb9d618fc10eb73c054e2d25cc4ded10))

## [0.30.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.3...app@v0.30.0) (2025-04-14)


### Features

* **app:** better call management and persistent support ([acf0ad4](https://github.com/WerdoxDev/Huginn/commit/acf0ad4feb9ff8344f9c62d422d41e14f8ccf8cb))

## [0.29.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.2...app@v0.29.3) (2025-04-12)


### Bug Fixes

* **app:** disable multi range request for updater ([6a09215](https://github.com/WerdoxDev/Huginn/commit/6a092152c053158d05130cdfeb6ef2ad41598263))
* **app:** video progress/volume bar not letting go ([ec540ad](https://github.com/WerdoxDev/Huginn/commit/ec540ad94948279e58f6ddbd9116b3bf70a6d0f5))

## [0.29.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.1...app@v0.29.2) (2025-04-11)


### Bug Fixes

* **app:** dont open dev tools ([fe089a4](https://github.com/WerdoxDev/Huginn/commit/fe089a41579039204fd25deafeb96ea17a85dd03))

## [0.29.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.0...app@v0.29.1) (2025-04-11)


### Bug Fixes

* **app:** remove commented code + set startup app config ([af666e0](https://github.com/WerdoxDev/Huginn/commit/af666e098c43518b09829b96f43c62ef5e286bc7))

## [0.29.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.28.1...app@v0.29.0) (2025-04-11)


### Features

* **app:** electron github action [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([df2f245](https://github.com/WerdoxDev/Huginn/commit/df2f245d3ab5cef4c16cb789379d19f1c67fadff))
* **app:** electron github action [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([da24cbe](https://github.com/WerdoxDev/Huginn/commit/da24cbe670889fbc87bee5caaad5224474b1510a))
* **app:** finish migration to electron ([13650fb](https://github.com/WerdoxDev/Huginn/commit/13650fbd6b1bfaf2eaff70f62974361ffbcc34c7))
* **app:** half baked electron migration ([9c92b90](https://github.com/WerdoxDev/Huginn/commit/9c92b90bd1a600a97041e19dcc990860e8d9a968))


### Bug Fixes

* **app:** use highest audio quality ([f0133b5](https://github.com/WerdoxDev/Huginn/commit/f0133b5cf9112d60fb5d029b3419e9baa8768ad5))
* revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.28.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.28.0...app@v0.28.1) (2025-04-06)


### Bug Fixes

* **app:** fix splashscreen not liking oauth and event listening outside ([0193390](https://github.com/WerdoxDev/Huginn/commit/0193390f8a99f8789b91efff7ca8b7ea161597e1))

## [0.28.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.27.0...app@v0.28.0) (2025-04-04)


### Features

* **app:** add a start call button to HomeTopbar ([b6baebd](https://github.com/WerdoxDev/Huginn/commit/b6baebd694a2fffe3d17aad2a0d4ef476b09dd6d))
* **app:** add custom notification sound ([06cd3f4](https://github.com/WerdoxDev/Huginn/commit/06cd3f4694850ed8d780ad2eafbd3c2e9c20cb82))
* **app:** add fullish ui for voice with buttons and indicators ([0642df1](https://github.com/WerdoxDev/Huginn/commit/0642df1613d1e582b823ca3448cd53423be08860))
* **app:** add very experimental video call ui ([1ac97d3](https://github.com/WerdoxDev/Huginn/commit/1ac97d37fa102cdc60b6c167b28bac95897a6d53))
* **app:** merged splashscreen into the main window ([dad146b](https://github.com/WerdoxDev/Huginn/commit/dad146b66d7dc965c01adedce15eead683394594))
* **app:** refactor all api related hooks and contexts to use stores instead ([05ea484](https://github.com/WerdoxDev/Huginn/commit/05ea4847e009865e75a2a03d077127ab97d9e338))
* **app:** some progress on the voice ui ([594e62b](https://github.com/WerdoxDev/Huginn/commit/594e62bb5a152d8d346f08b0f29ed06ed4331a81))


### Bug Fixes

* **app:** fix new splashscreen giving errors in the browser ([72da35c](https://github.com/WerdoxDev/Huginn/commit/72da35cfe47d320c565e3f005557bc90f6732b50))
* **app:** fix some websocket event issues ([fddc3e9](https://github.com/WerdoxDev/Huginn/commit/fddc3e965bb704906124a6e2e474ccf0e868a081))

## [0.27.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.26.0...app@v0.27.0) (2025-03-06)


### Features

* **app:** add inverted border radius to messages + show user's username on hover ([f545309](https://github.com/WerdoxDev/Huginn/commit/f545309aa6410871632f27df8d46c8cf4069b5a8))


### Bug Fixes

* **app:** add consistent rounded corners for attachments and embeds ([70bbe96](https://github.com/WerdoxDev/Huginn/commit/70bbe9659b6c956b28ef67ff6fa7ac2dabfd7f88))

## [0.26.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.25.0...app@v0.26.0) (2025-03-03)


### Features

* **app:** hide message link when it's the only content ([c228acf](https://github.com/WerdoxDev/Huginn/commit/c228acfb3c2c4a0b6dd03a833abf08173999c10a))
* **app:** make both embed and attachment use a consistent image / video component ([f231307](https://github.com/WerdoxDev/Huginn/commit/f231307c52decd911d7bb5aa50a493a999916ce7))

## [0.25.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.24.0...app@v0.25.0) (2025-03-03)


### Features

* **app:** add embed image and video only rendering ([af32433](https://github.com/WerdoxDev/Huginn/commit/af3243303718f734962cf7fc9df4635d451f63ae))

## [0.24.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.23.1...app@v0.24.0) (2025-03-02)


### Features

* **app:** add cancel button functionality to attachment sending ([a70cdcc](https://github.com/WerdoxDev/Huginn/commit/a70cdcc157250961fc59e1160d7016c0b594c637))
* **app:** add partial audio control to VideoPlayer ([367a0b2](https://github.com/WerdoxDev/Huginn/commit/367a0b23cd8cb8a06d203906fb27b57b0fefdf5c))


### Bug Fixes

* **app:** fix updating version text ([38226e5](https://github.com/WerdoxDev/Huginn/commit/38226e5c373ca7760b3902840376c97b204fe316))
* **app:** fix VidePlayer progress handle offset ([fef3576](https://github.com/WerdoxDev/Huginn/commit/fef35762605b370b6fe8067a2d3db9981127c9b3))
* **app:** video timeline looks a bit weird at the beginning ([6f5cc0a](https://github.com/WerdoxDev/Huginn/commit/6f5cc0a0176367adae3b49e8d58a960163e018d6))

## [0.23.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.23.0...app@v0.23.1) (2025-02-25)


### Bug Fixes

* **app:** fix updater not doing anything after success ([891d303](https://github.com/WerdoxDev/Huginn/commit/891d303d4c2341ebabad2812e5c1c4f4cf966023))

## [0.23.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.22.0...app@v0.23.0) (2025-02-25)


### Features

* add resource limiting to cdn + use bun alpine instead of debian ([2f9f8f7](https://github.com/WerdoxDev/Huginn/commit/2f9f8f799b2272eef0e097eefa1ea16128006835))
* **app:** add much better update handling + video rendering ([ca04b73](https://github.com/WerdoxDev/Huginn/commit/ca04b73a61348f565469774c711e9adc37cfa6ce))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.21.0...app@v0.22.0) (2025-02-23)


### Features

* **app:** add attachments animation + quality reduction after a certain size ([0b96e3a](https://github.com/WerdoxDev/Huginn/commit/0b96e3a45e588cbcd17c94a3318b2984073c1461))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.20.0...app@v0.21.0) (2025-02-19)


### Features

* **app:** add magnifying image capability ([e535c49](https://github.com/WerdoxDev/Huginn/commit/e535c4940c45d4e158eb4a456e4febc2a9661343))
* **app:** add magnifying loading indicator + orignal open button ([77f41e2](https://github.com/WerdoxDev/Huginn/commit/77f41e2589253580bd04a8065f23597d3285d5ba))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.19.1...app@v0.20.0) (2025-02-18)


### Features

* **app:** copy pasting + drag dropping images for attachments ([69e37dd](https://github.com/WerdoxDev/Huginn/commit/69e37ddcc744ed85d7d5b076b7a443cf77966f5b))
* **app:** fix markdown hardbreak and link href ([bea96c6](https://github.com/WerdoxDev/Huginn/commit/bea96c6c8d3ed4b09987eacad3747e802cec20e5))

## [0.19.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.19.0...app@v0.19.1) (2025-02-15)


### Bug Fixes

* **app:** try to force a release ([960ad4d](https://github.com/WerdoxDev/Huginn/commit/960ad4d13bef13b35104347cde6c9dbf3b332529))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.18.0...app@v0.19.0) (2025-02-15)


### Features

* **app:** add size string utility ([b3e6a15](https://github.com/WerdoxDev/Huginn/commit/b3e6a15aef5c9a09e027f354fdbf53f627cb55da))
* **app:** attachment uploading indicator ([a084675](https://github.com/WerdoxDev/Huginn/commit/a084675f204a60f83b2b36a740603a06f7054e73))
* **app:** remove auto imports + experimental ui for adding attachments ([aedff6c](https://github.com/WerdoxDev/Huginn/commit/aedff6cf1f08f8c2a193474006e1a5ea24afddd7))


### Bug Fixes

* **app:** updater is not retrying updates upon failure ([76561d6](https://github.com/WerdoxDev/Huginn/commit/76561d62e9376b40de851a7f94e8b8a39b2bf4a3))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.17.0...app@v0.18.0) (2025-02-11)


### Features

* **app:** add experimental attachment rendering ([cd85462](https://github.com/WerdoxDev/Huginn/commit/cd854622417d51def99279808e3e3f159455398f))
* **app:** add status bar ([66cefb3](https://github.com/WerdoxDev/Huginn/commit/66cefb38090e10e3c4c6d556ba178a075a645d64))


### Bug Fixes

* **app:** initial connection state is handled incorrectly ([3c0fb73](https://github.com/WerdoxDev/Huginn/commit/3c0fb73218e5e58aea8f04226a9039852999c707))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.16.0...app@v0.17.0) (2025-02-10)


### Features

* **app:** add untested Autostart capability ([c9b34aa](https://github.com/WerdoxDev/Huginn/commit/c9b34aae1488011aa225052d490cdde83bfabd37))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.15.0...app@v0.16.0) (2025-02-09)


### Features

* **app:** add notification click event & goto channel functionality ([9d967a2](https://github.com/WerdoxDev/Huginn/commit/9d967a2ccddff3d2b658fd7b9974d616ba1dc036))


### Bug Fixes

* **server:** fix google callback redirect mismatch ([ba6bae6](https://github.com/WerdoxDev/Huginn/commit/ba6bae6c66306063f5a03a8238e34ff6893e5e96))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.2...app@v0.15.0) (2025-02-08)


### Features

* **app:** add copy to code block + code language highlight ([978c19f](https://github.com/WerdoxDev/Huginn/commit/978c19fc50c3e0f689800238d1a9fcd24691cbea))

## [0.14.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.1...app@v0.14.2) (2025-02-07)


### Bug Fixes

* **app:** fix scrolling problem in ChannelMessages ([76047f8](https://github.com/WerdoxDev/Huginn/commit/76047f826027174b0968470b768c7c7224ab2c33))

## [0.14.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.0...app@v0.14.1) (2025-02-01)


### Bug Fixes

* **app:** small padding issue in MessageBox ([2d26459](https://github.com/WerdoxDev/Huginn/commit/2d264597c88c80953fcdcb7f722eb182d7821415))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.13.0...app@v0.14.0) (2025-01-19)


### Features

* **app:** add native os notification with temporary icon ([076837a](https://github.com/WerdoxDev/Huginn/commit/076837a091ea0d704882f03b0ad250e86b9d64b4))
* **app:** MessageBox should push the messages up when new lines are added ([77fa712](https://github.com/WerdoxDev/Huginn/commit/77fa712f3ef6d1007b148b369e10e5dff7cfeee9))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.12.0...app@v0.13.0) (2025-01-15)


### Features

* **app:** add code block in messages ([7e97835](https://github.com/WerdoxDev/Huginn/commit/7e97835acfe80f491a39c7d685c3a735ab064d7e))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.11.0...app@v0.12.0) (2025-01-12)


### Features

* **app:** cleanup tokenizer and make it work on entire content and tokenize per line ([2833881](https://github.com/WerdoxDev/Huginn/commit/2833881fc63615ba2cde2f5d8abe1785f8a0857b))
* **app:** migrate to markdown-it for markdown. basically ditching huginn-tokenizer ([de682f8](https://github.com/WerdoxDev/Huginn/commit/de682f8b2d3b1ff43ddd45cf3a08705e5b3dfd11))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.10.0...app@v0.11.0) (2025-01-11)


### Features

* **app:** fix all markdown problems ([701c708](https://github.com/WerdoxDev/Huginn/commit/701c70893b74ace03f6e89a8f73b0a64ef32abdc))


### Bug Fixes

* **app:** remove commeted code from tokenizer ([8f95023](https://github.com/WerdoxDev/Huginn/commit/8f9502325d846b02fa4aa90fc786595c17484c04))
* **app:** simplify link token content shifting ([24ea694](https://github.com/WerdoxDev/Huginn/commit/24ea69423b57808b60541361c98a4215ef6182c7))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.3...app@v0.10.0) (2025-01-09)


### Features

* **app:** add fully nestable tokens to tokenizer ([93e36a8](https://github.com/WerdoxDev/Huginn/commit/93e36a8b5e72d31ca665ef0f9095f6a82e608ea5))


### Bug Fixes

* **app:** editor decorate function is not considering single char marks ([b5d329e](https://github.com/WerdoxDev/Huginn/commit/b5d329e20ea56fdf093a32af01c4a90931986008))
* **app:** tokenizer is adding nested tokens as rest tokens ([7b38144](https://github.com/WerdoxDev/Huginn/commit/7b38144423a605b5397b1329eb371c00b31b9a64))

## [0.9.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.2...app@v0.9.3) (2025-01-08)


### Bug Fixes

* **app:** link rendering with interfering markdown should be prioritized ([7d35818](https://github.com/WerdoxDev/Huginn/commit/7d3581874549abd387db06a1677c8c14a9f70e1f))

## [0.9.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.1...app@v0.9.2) (2025-01-07)


### Bug Fixes

* **app:** remove unused package ([c7374ff](https://github.com/WerdoxDev/Huginn/commit/c7374ffbbd7636e36421158696690a9575730683))

## [0.9.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.0...app@v0.9.1) (2025-01-07)


### Bug Fixes

* **app:** remove private from package.json ([912b644](https://github.com/WerdoxDev/Huginn/commit/912b644c3e0cf904e492cbd191195a87b1bad0f2))

## [0.9.0](https://github.com/werdoxdev/huginn/compare/app@v0.8.0...app@v0.9.0) (2025-01-07)


### Features

* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/werdoxdev/huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app:** 0.6.1 version bump + much better markdown shortcut handling ([22528e5](https://github.com/werdoxdev/huginn/commit/22528e552698fcc17dd02ebd9121034c19ad5dcf))
* **app:** add a lowercase only option to HuginnInput ([ffed36d](https://github.com/werdoxdev/huginn/commit/ffed36db25f4416b8b626a668addc10554f242bf))
* **app:** add different chat modes ([d9cf062](https://github.com/werdoxdev/huginn/commit/d9cf062f1bf14d10a83c4296bec97a5de489cd2e))
* **app:** add link highlighting to messages ([5ce7276](https://github.com/werdoxdev/huginn/commit/5ce7276611f218168162a36b9c3857608ddc2114))
* **app:** add markdown shortcut (not entirely complete) ([d7f4548](https://github.com/werdoxdev/huginn/commit/d7f454814cbf6e9f3517ac3e6800a6deaae864db))
* **app:** add unstable embed rendering ([6eb268e](https://github.com/werdoxdev/huginn/commit/6eb268e94b339e4fed305ce676606480df8a45e9))
* **app:** animation for notifications ([b667879](https://github.com/werdoxdev/huginn/commit/b6678790d539e3ec0bb4f9dd0e7d16d87cb3a9d1))
* **app:** message_update event is now handeled ([c97073c](https://github.com/werdoxdev/huginn/commit/c97073c20907909c2286f5ff7e1d47649df320ea))
* **app:** notification button sorting ([7aae223](https://github.com/werdoxdev/huginn/commit/7aae223dab5dfe0b755af6a4fbb727281603b850))
* **app:** some renames + EmbedElement now renders with predefined size ([336aa4a](https://github.com/werdoxdev/huginn/commit/336aa4a14d7ccee62ede2f78a4002f39c02415b1))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/werdoxdev/huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))


### Bug Fixes

* action config change [#10](https://github.com/werdoxdev/huginn/issues/10) ([a01ed84](https://github.com/werdoxdev/huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* **app:** fix notification indicator reseting on read ([b8ebf3b](https://github.com/werdoxdev/huginn/commit/b8ebf3bccef44e9a11dbd84307b7152e0d6e0860))
* **app:** fix some logout issues + 0.5.0 release ([9325624](https://github.com/werdoxdev/huginn/commit/9325624ab591f9327147745f21fb384305e94e9e))
* **app:** message ack from ws should only be used when in other channels ([4e19c67](https://github.com/werdoxdev/huginn/commit/4e19c674cf2331ee1a80855789a5b208d5387164))
* **app:** message box clickable area was too small + line height was too low ([70eec3c](https://github.com/werdoxdev/huginn/commit/70eec3cf81839d132332a3eade11e831a43ad01b))
