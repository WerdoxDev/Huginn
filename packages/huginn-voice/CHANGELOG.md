# Changelog

## [0.13.1](https://github.com/WerdoxDev/Huginn/compare/voice@v0.13.0...voice@v0.13.1) (2025-12-13)


### Bug Fixes

* **voice:** only allow vp8 + rare bug fix ([ab3c52a](https://github.com/WerdoxDev/Huginn/commit/ab3c52aaeb014adb1643ec31c079c7f681fc5b03))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.12.1...voice@v0.13.0) (2025-12-09)


### Features

* **voice:** add error handling for every message ([4540b47](https://github.com/WerdoxDev/Huginn/commit/4540b479cde59fbd0d16cbe286d2474db9a90a07))

## [0.12.1](https://github.com/WerdoxDev/Huginn/compare/voice@v0.12.0...voice@v0.12.1) (2025-11-22)


### Bug Fixes

* **voice:** call consumers should be sent on "identify" just like producers ([9f66e48](https://github.com/WerdoxDev/Huginn/commit/9f66e48b19b1f425a1ee7eed313d483cd87cb2d8))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.11.0...voice@v0.12.0) (2025-11-18)


### Features

* **voice:** remove redundant messages that should be handles on client ([514a8b7](https://github.com/WerdoxDev/Huginn/commit/514a8b755dbb6f0d26690cf6bfb49d3fc7d59336))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.10.3...voice@v0.11.0) (2025-11-05)


### Features

* a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
* **voice:** remove unnecessary http server for a websocket only server ([4146808](https://github.com/WerdoxDev/Huginn/commit/414680877d7ce4e60ce95926da040d76171c3f7e))

## [0.10.3](https://github.com/WerdoxDev/Huginn/compare/voice@v0.10.2...voice@v0.10.3) (2025-09-06)


### Bug Fixes

* **voice:** use new verifyToken ([ffde1f7](https://github.com/WerdoxDev/Huginn/commit/ffde1f742566d5ba7ea753c1f6acd060729f306e))

## [0.10.2](https://github.com/WerdoxDev/Huginn/compare/voice@v0.10.1...voice@v0.10.2) (2025-07-29)


### Bug Fixes

* **voice:** send producer kind when it's created ([c17b3c9](https://github.com/WerdoxDev/Huginn/commit/c17b3c98fcf7f538a508c625f30d101178c5d077))

## [0.10.1](https://github.com/WerdoxDev/Huginn/compare/voice@v0.10.0...voice@v0.10.1) (2025-07-23)


### Bug Fixes

* **voice:** producers of a closed connection should be sent to be closed for others ([a8526ff](https://github.com/WerdoxDev/Huginn/commit/a8526ff5dd385ad592f8ad94272ce6f87fa11a6b))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.9.0...voice@v0.10.0) (2025-07-20)


### Features

* **voice:** add close consumer handling ([12ddb13](https://github.com/WerdoxDev/Huginn/commit/12ddb137baa58ae43464bb52f66ea16c87467964))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.8.0...voice@v0.9.0) (2025-07-15)


### Features

* **voice:** add multiple hostname support ([f053bbd](https://github.com/WerdoxDev/Huginn/commit/f053bbd5b351762a87da3b6966d5b142b86044db))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.7.0...voice@v0.8.0) (2025-07-04)


### Features

* **voice:** use new shared websocket implementation + bunch of renames ([fc89f9e](https://github.com/WerdoxDev/Huginn/commit/fc89f9e955984276d18a7243b726cd827b13b629))

## [0.7.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.6.0...voice@v0.7.0) (2025-06-09)


### Features

* **app:** add voice screenshare fps, resolution and audio indicators ([9baca3a](https://github.com/WerdoxDev/Huginn/commit/9baca3aeb336c50a7bce19297282bb40ab1e9e9b))

## [0.6.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.5.0...voice@v0.6.0) (2025-06-08)


### Features

* **app:** add specific application audio loopback ([0214b2c](https://github.com/WerdoxDev/Huginn/commit/0214b2ce69e5ecd53f94a08a65777167fdf813ef))

## [0.5.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.4.0...voice@v0.5.0) (2025-05-31)


### Features

* **voice:** add distinct producer & consumer types ([f32963d](https://github.com/WerdoxDev/Huginn/commit/f32963d843ea18908f197c4bc2afc9c4405d11a6))

## [0.4.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.3.0...voice@v0.4.0) (2025-05-18)


### Features

* **voice:** add producer closing ([7808791](https://github.com/WerdoxDev/Huginn/commit/780879159dea11a180b3187fc5db919a66053193))

## [0.3.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.2.0...voice@v0.3.0) (2025-05-12)


### Features

* **voice:** send the userid of the user who left ([0ad7650](https://github.com/WerdoxDev/Huginn/commit/0ad76504b7c1f1898480b0b83df575f2ed22b560))

## [0.2.0](https://github.com/WerdoxDev/Huginn/compare/voice@v0.1.0...voice@v0.2.0) (2025-04-30)


### Features

* **voice:** add ping and pong message handling ([ffbf007](https://github.com/WerdoxDev/Huginn/commit/ffbf0073e27b15fe4465566df4735df934f1a0d7))

## 0.1.0 (2025-04-04)


### Features

* **voice:** add all required events for a connection ([cec11c4](https://github.com/WerdoxDev/Huginn/commit/cec11c436725daca5ea13857171c0efe25279876))
* **voice:** add environment variables for all ip/port related stuff ([aaa183e](https://github.com/WerdoxDev/Huginn/commit/aaa183e4a60956a88a9dc5e288f53ebe659f6cc1))
* **voice:** add initial identifying procedure for websocket ([2f81076](https://github.com/WerdoxDev/Huginn/commit/2f81076055da43bcb3b5545a8b00b1170726a05d))
* **voice:** add send and recv transport creation ([0d42318](https://github.com/WerdoxDev/Huginn/commit/0d423188babb6eaa5d7151b994f2dcfea8e5b099))
* **voice:** make voice server use only one port ([65f7642](https://github.com/WerdoxDev/Huginn/commit/65f76420c62e38bf180a6c46dece6d013f643f03))


### Bug Fixes

* add voice server to release-please config ([75a750f](https://github.com/WerdoxDev/Huginn/commit/75a750fb9cfd952d1c2649245b00cb1b22d6f6a3))
