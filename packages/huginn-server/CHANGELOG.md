# Changelog

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/server-v0.7.0...server@v0.8.0) (2025-01-07)


### Features

* **all:** migrated to bun's text .lock file instead of binary .lockb file ([d1731a8](https://github.com/WerdoxDev/Huginn/commit/d1731a8189a8de54da14975ac47ece57564938bd))
* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app,server:** read state tests + better message notification design + 0.3.6-nightly.10 release ([512a41c](https://github.com/WerdoxDev/Huginn/commit/512a41cb82c1a907c0000aa0ed1b0c8577a9063a))
* **app:** add app visual notification and new message indicator (unfinished visual) ([b37865b](https://github.com/WerdoxDev/Huginn/commit/b37865bbb2fc96a0747d8d115318ac5c50269c7e))
* prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
* **server:** add separate api endpoints for all/latest releases ([a2451d6](https://github.com/WerdoxDev/Huginn/commit/a2451d6995bd0fa29b35f1d3ba04d8add45acd45))
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
* **server:** remove nightly versioning ([ad1af14](https://github.com/WerdoxDev/Huginn/commit/ad1af146be6e778f146c2fbfb5a439d838f20779))
* **server:** remove unused import ([7a1d25a](https://github.com/WerdoxDev/Huginn/commit/7a1d25a3b01c92e621c6c0a423b00437fb20c7c1))
