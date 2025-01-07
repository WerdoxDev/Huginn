# Changelog

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/app-v0.8.0...app@v0.9.0) (2025-01-07)


### Features

* **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
* **app,server:** read state tests + better message notification design + 0.3.6-nightly.10 release ([512a41c](https://github.com/WerdoxDev/Huginn/commit/512a41cb82c1a907c0000aa0ed1b0c8577a9063a))
* **app:** 0.3.6-nightly.11 release ([968cc6d](https://github.com/WerdoxDev/Huginn/commit/968cc6d5d68f32cb836e4c4fe5ef0121e7010510))
* **app:** 0.6.1 version bump + much better markdown shortcut handling ([22528e5](https://github.com/WerdoxDev/Huginn/commit/22528e552698fcc17dd02ebd9121034c19ad5dcf))
* **app:** add a lowercase only option to HuginnInput ([ffed36d](https://github.com/WerdoxDev/Huginn/commit/ffed36db25f4416b8b626a668addc10554f242bf))
* **app:** add different chat modes ([d9cf062](https://github.com/WerdoxDev/Huginn/commit/d9cf062f1bf14d10a83c4296bec97a5de489cd2e))
* **app:** add link highlighting to messages ([5ce7276](https://github.com/WerdoxDev/Huginn/commit/5ce7276611f218168162a36b9c3857608ddc2114))
* **app:** add markdown shortcut (not entirely complete) ([d7f4548](https://github.com/WerdoxDev/Huginn/commit/d7f454814cbf6e9f3517ac3e6800a6deaae864db))
* **app:** add unstable embed rendering ([6eb268e](https://github.com/WerdoxDev/Huginn/commit/6eb268e94b339e4fed305ce676606480df8a45e9))
* **app:** add way better scroll preservation logic ([5676f87](https://github.com/WerdoxDev/Huginn/commit/5676f876f5625e47d8abd8aeed841ea6a2e66e13))
* **app:** add Zustand as state management for contexts & general stores [0] ([be83459](https://github.com/WerdoxDev/Huginn/commit/be834590cbf67e4b6167a0173684cfd0afbf7081))
* **app:** animation for notifications ([b667879](https://github.com/WerdoxDev/Huginn/commit/b6678790d539e3ec0bb4f9dd0e7d16d87cb3a9d1))
* **app:** message_update event is now handeled ([c97073c](https://github.com/WerdoxDev/Huginn/commit/c97073c20907909c2286f5ff7e1d47649df320ea))
* **app:** much more reliable new message indicator + app focus handling ([9bd08aa](https://github.com/WerdoxDev/Huginn/commit/9bd08aa0fc56937fb185a0e385d766704ef31d4c))
* **app:** notification button sorting ([7aae223](https://github.com/WerdoxDev/Huginn/commit/7aae223dab5dfe0b755af6a4fbb727281603b850))
* **app:** some renames + EmbedElement now renders with predefined size ([336aa4a](https://github.com/WerdoxDev/Huginn/commit/336aa4a14d7ccee62ede2f78a4002f39c02415b1))
* **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))


### Bug Fixes

* action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
* **app:** fix HuginnIcon component not changing icon live ([a2ddda0](https://github.com/WerdoxDev/Huginn/commit/a2ddda0d49001e96da1487c0674b5a09d3d1a285))
* **app:** fix notification indicator reseting on read ([b8ebf3b](https://github.com/WerdoxDev/Huginn/commit/b8ebf3bccef44e9a11dbd84307b7152e0d6e0860))
* **app:** fix some logout issues + 0.5.0 release ([9325624](https://github.com/WerdoxDev/Huginn/commit/9325624ab591f9327147745f21fb384305e94e9e))
* **app:** message ack from ws should only be used when in other channels ([4e19c67](https://github.com/WerdoxDev/Huginn/commit/4e19c674cf2331ee1a80855789a5b208d5387164))
* **app:** message box clickable area was too small + line height was too low ([70eec3c](https://github.com/WerdoxDev/Huginn/commit/70eec3cf81839d132332a3eade11e831a43ad01b))