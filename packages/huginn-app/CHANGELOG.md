# Changelog

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
