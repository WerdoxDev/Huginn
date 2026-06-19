# Changelog

## [0.40.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.39.0...server@v0.40.0) (2026-06-19)


### Features

* **server:** add push notification handling with firebase-admin ([828c8da](https://github.com/WerdoxDev/Huginn/commit/828c8da7df6a581384ba310f8cb3babef97b085c))

## [0.39.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.38.1...server@v0.39.0) (2026-06-16)


### Features

* **server:** add android update endpoint ([7b534fc](https://github.com/WerdoxDev/Huginn/commit/7b534fc56afc827f45a21ef8848663ff40352409))

## [0.38.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.38.0...server@v0.38.1) (2026-06-12)


### Bug Fixes

* **cdn:** cache storage wrong time ([46f2ebb](https://github.com/WerdoxDev/Huginn/commit/46f2ebb7638bca3fcd424dbb7909c1f2d7037822))
* **server:** cache storage wrong time ([368cff1](https://github.com/WerdoxDev/Huginn/commit/368cff17e6b0841f3b1d3fb5096881cb224d4b5a))

## [0.38.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.37.0...server@v0.38.0) (2026-06-10)


### Features

* **shared:** implement getting traceparent in otel ([30a9287](https://github.com/WerdoxDev/Huginn/commit/30a92872e84c3f02f28b3715abd7f024dd5e1335))

## [0.37.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.36.0...server@v0.37.0) (2026-06-05)


### Features

* **server:** add OTel to some gateway utilities ([9e2e909](https://github.com/WerdoxDev/Huginn/commit/9e2e90956fcc3029708031189ae4013b615a2a33))
* **server:** implement OTel at elysia level ([91409a6](https://github.com/WerdoxDev/Huginn/commit/91409a69542a99b9568c7623e49337a5ae768f92))


### Bug Fixes

* **server:** remove telemetry for some messages to avoid spam ([37ac8a9](https://github.com/WerdoxDev/Huginn/commit/37ac8a99f05fdec2cb26ff85ff248054a9e4b790))

## [0.36.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.35.2...server@v0.36.0) (2026-05-31)


### Features

* migrate package manager to pnpm ([8188033](https://github.com/WerdoxDev/Huginn/commit/8188033434162474b72cf4e446100b2f654c6514))
* migrate package manager to pnpm ([36dd56b](https://github.com/WerdoxDev/Huginn/commit/36dd56b34d864e393992b7bd50130529ff314574))


### Bug Fixes

* **server:** forgoten token lastAuthenticated ([7a68771](https://github.com/WerdoxDev/Huginn/commit/7a687714f605d7087494ae60787ccb7102e0e4ea))

## [0.35.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.35.1...server@v0.35.2) (2026-05-28)


### Bug Fixes

* **server:** send message when a message is pinned ([979b0a3](https://github.com/WerdoxDev/Huginn/commit/979b0a32af7319249b870c00a2879b8bf90605df))

## [0.35.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.35.0...server@v0.35.1) (2026-05-27)


### Bug Fixes

* **server:** allow empty string again on channel name because it's handled on db level ([0a715ba](https://github.com/WerdoxDev/Huginn/commit/0a715ba0be7cb1204738703bb39cc66d3cc870a6))
* **server:** use bun.cron + delete empty channel ([29554aa](https://github.com/WerdoxDev/Huginn/commit/29554aa42d43d8e0ab5f1647bf883b62acd2750f))

## [0.35.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.34.0...server@v0.35.0) (2026-05-26)


### Features

* initialize docs package + start website react rewrite ([aa5b1fa](https://github.com/WerdoxDev/Huginn/commit/aa5b1fad11159143c5f0514e651bc86474a7ec20))
* **server:** add changelog route with notion renderer ([117fbe9](https://github.com/WerdoxDev/Huginn/commit/117fbe9ad936c9888ec580f2fa0ac0ea53beb2b1))
* **server:** remove deletedTimestamp from messages ([ad68b3e](https://github.com/WerdoxDev/Huginn/commit/ad68b3eed882744bfbc0e6d671a644a9821a7af3))


### Bug Fixes

* **server:** server shouldn't accept empty name for channel ([03a352b](https://github.com/WerdoxDev/Huginn/commit/03a352bb9417c825ff76130510bc17b90def46bb))
* **server:** validate gateway update presence status ([ded7618](https://github.com/WerdoxDev/Huginn/commit/ded7618c87680d790a5dff26c005b148aca0485e))

## [0.34.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.33.0...server@v0.34.0) (2026-05-21)


### Features

* migrate prettier to oxfmt and full format ([#237](https://github.com/WerdoxDev/Huginn/issues/237)) ([62481be](https://github.com/WerdoxDev/Huginn/commit/62481beb58232bc373358338fa9bc19c889bddc8))
* **server:** add banner image upload ([db55706](https://github.com/WerdoxDev/Huginn/commit/db5570668b46240dd68f633db099a8180c26853d))
* **server:** add bannerColor to server settings ([8bba25b](https://github.com/WerdoxDev/Huginn/commit/8bba25b9b8d1e281137b39dc01d2940f73f65d81))
* **server:** add email verification requirement for login and register ([a834f60](https://github.com/WerdoxDev/Huginn/commit/a834f608e399d23e575d42235b63f93a5dc551c9))
* **server:** add pinnedChannels to server settigns ([717ef87](https://github.com/WerdoxDev/Huginn/commit/717ef877964bf7387475180124cd7a5431895944))
* **server:** add user profile route + constants var rename ([63bd096](https://github.com/WerdoxDev/Huginn/commit/63bd0968d557c51fe6b1be399f16e389e86fc1b7))


### Bug Fixes

* **server:** new file schema handling + avatar max size ([acc327f](https://github.com/WerdoxDev/Huginn/commit/acc327f1acd430992407b8299ef225635889713b))
* **server:** set appropriate auth type for access and refresh token ([6944653](https://github.com/WerdoxDev/Huginn/commit/69446539b9a2cb361a81dc3592c5d8a982f85c33))
* **server:** use optimized unread readstate calculation ([3293e5b](https://github.com/WerdoxDev/Huginn/commit/3293e5b698adb89eb8aa9ecb7ca4558f5a4a1fc0))

## [0.33.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.7...server@v0.33.0) (2026-01-24)

### Features

- **server:** new oauth flow + update old icon ([2f1ed80](https://github.com/WerdoxDev/Huginn/commit/2f1ed80c68bcf2d8078a509c7e78965b2a605204))

### Bug Fixes

- **server:** missing channel sub + wrong known application trademark replace regex ([d7c2d67](https://github.com/WerdoxDev/Huginn/commit/d7c2d6705094944e7a36d99f36b3cba11d7dc9b2))
- **server:** wrong code for failed login ([ec208f8](https://github.com/WerdoxDev/Huginn/commit/ec208f893bc5956a1d34f4b7551d0ec22e755e53))

## [0.32.7](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.6...server@v0.32.7) (2026-01-06)

### Bug Fixes

- **server:** activities of a session should not effect other sessions ([0bfef59](https://github.com/WerdoxDev/Huginn/commit/0bfef5984dda13a0e16a3bb1be4fb9967b504221))

## [0.32.6](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.5...server@v0.32.6) (2025-12-26)

### Bug Fixes

- **server:** fix timeout issues with prisma v7 ([4d263fb](https://github.com/WerdoxDev/Huginn/commit/4d263fbaeb923b2526ff7bfc93d1afeaa08592ec))

## [0.32.5](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.4...server@v0.32.5) (2025-12-22)

### Bug Fixes

- **server:** remove ffmpeg and use the new util function from backend-shared ([a16b1c7](https://github.com/WerdoxDev/Huginn/commit/a16b1c7ae4d210a7cc673058bc56f927b57c5dd2))
- **server:** users added to a channel should be informed of voice states and call states ([243a6b4](https://github.com/WerdoxDev/Huginn/commit/243a6b48b44c472e40a24138ac2a6adeed2498b2))

## [0.32.4](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.3...server@v0.32.4) (2025-12-14)

### Bug Fixes

- **server:** fix static routes ([e2bb70f](https://github.com/WerdoxDev/Huginn/commit/e2bb70fa2d422550a64d39d9df0064affe92aeb2))

## [0.32.3](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.2...server@v0.32.3) (2025-12-09)

### Bug Fixes

- **server:** fix incorrect password hashing ([c4a3412](https://github.com/WerdoxDev/Huginn/commit/c4a3412198cef8e12f371f9d47f7cc7f75bfa6d4))

## [0.32.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.1...server@v0.32.2) (2025-12-05)

### Bug Fixes

- **server:** oauth should redirect user to the url they accessed server from ([7430042](https://github.com/WerdoxDev/Huginn/commit/74300422821846908f5fec32438f6fee5a291a60))

## [0.32.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.32.0...server@v0.32.1) (2025-11-06)

### Bug Fixes

- **server:** server is not correctly redirecting ([391a86b](https://github.com/WerdoxDev/Huginn/commit/391a86b6345d507e21ce3588d4261822c85b704a))

## [0.32.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.31.0...server@v0.32.0) (2025-11-05)

### Features

- a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
- **server:** add activities to presence tests ([4f2833d](https://github.com/WerdoxDev/Huginn/commit/4f2833d8ff5a958143fcd30cec977872b3ca1e3b))
- **server:** add experimental delayed voice state nullifying ([dd9f305](https://github.com/WerdoxDev/Huginn/commit/dd9f305529893b60fe1d99fe6ee10e5cce86fc30))
- **server:** migrate all routes to ElysiaJS ([9d9a268](https://github.com/WerdoxDev/Huginn/commit/9d9a268f7959fb126a72d0bcc1a3f006df98ed5b))

### Bug Fixes

- **server:** much better "wait until" handling ([cea49a5](https://github.com/WerdoxDev/Huginn/commit/cea49a580c964d90e1c1c4326c7ae89382154c58))

## [0.31.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.30.0...server@v0.31.0) (2025-09-24)

### Features

- **server:** add much better log route with geodata and systeminfo ([123afd2](https://github.com/WerdoxDev/Huginn/commit/123afd250d1e1504efc4c23518a576c3d90e3e72))

### Bug Fixes

- **server:** request ip is not received correctly ([3fefefa](https://github.com/WerdoxDev/Huginn/commit/3fefefac0d6c8f2ae7bff3a8f290078eda45d6a8))

## [0.30.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.29.2...server@v0.30.0) (2025-09-18)

### Features

- **server:** add message replying + referenced message fetching ([af91768](https://github.com/WerdoxDev/Huginn/commit/af917687bc6c9dcb3c86bece9ade2ed450a87d1e))

## [0.29.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.29.1...server@v0.29.2) (2025-09-16)

### Bug Fixes

- **server:** sanitize game title to remove trademark ([eddd7cd](https://github.com/WerdoxDev/Huginn/commit/eddd7cd6cd348289a4cfb5b72110e0c715ac964a))
- **server:** session_update should be sent when adding and removing sessions too ([4f15a5c](https://github.com/WerdoxDev/Huginn/commit/4f15a5c78d3c71b57e5845be15b17e9e77fdcfeb))

## [0.29.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.29.0...server@v0.29.1) (2025-09-14)

### Bug Fixes

- **server:** better igdb search ([6bea4c2](https://github.com/WerdoxDev/Huginn/commit/6bea4c270d21a0b49d6869c71be38fccafa96d62))
- **server:** update app detection ([ad0d87e](https://github.com/WerdoxDev/Huginn/commit/ad0d87e191f2c86d6dc917044b9d562dc544e9ec))

## [0.29.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.28.0...server@v0.29.0) (2025-09-14)

### Features

- **server:** add filterChannel util to pick the correct keys from a channel depending on its type ([281e4f6](https://github.com/WerdoxDev/Huginn/commit/281e4f6a0ed60362eace957ad1f0f936e05c1b3b))
- **server:** add known application post with igdb detection and formatting ([10d6cf7](https://github.com/WerdoxDev/Huginn/commit/10d6cf7b2ab0dbfcf3b2286eaf320c17fde717c6))
- **server:** add presence activity + application icon uploading ([dc7231d](https://github.com/WerdoxDev/Huginn/commit/dc7231d01d1e307f8718ed10578b300f527a9b47))

### Bug Fixes

- **server:** updating read state should not be part of the waiting for message.post ([640666e](https://github.com/WerdoxDev/Huginn/commit/640666e66639233560ee8306f87acd877f952e78))

## [0.28.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.27.1...server@v0.28.0) (2025-09-06)

### Features

- **app:** add scarlet theme + update old icons ([fb8ea1c](https://github.com/WerdoxDev/Huginn/commit/fb8ea1cee75db53a29d9ff451f107a08ce3369a2))
- **server:** add a separate session_update for all presence updates for multi session ([2564a80](https://github.com/WerdoxDev/Huginn/commit/2564a80cb43386f03760faa25e245e17253dca46))
- **server:** add route for getting all known applications ([431fedb](https://github.com/WerdoxDev/Huginn/commit/431fedbdf21559d6f6348ec8e4ccba932f9cc76f))
- **server:** sign attachment url with a secret ([019f14d](https://github.com/WerdoxDev/Huginn/commit/019f14d53eb0b8e1e939247fba97070b8369c254))

### Bug Fixes

- **server:** use new token factory from backend shared (wip) ([f2fdc04](https://github.com/WerdoxDev/Huginn/commit/f2fdc040f29333e670d0ea4b3b1afdacd7e485b4))

## [0.27.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.27.0...server@v0.27.1) (2025-08-30)

### Bug Fixes

- **server:** update presence should not update user settings ([be6d99c](https://github.com/WerdoxDev/Huginn/commit/be6d99c34d3b8d704a0c902c686dfbd99c312f98))

## [0.27.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.26.2...server@v0.27.0) (2025-08-29)

### Features

- **server:** add experimental server settings implementation ([4d35d9a](https://github.com/WerdoxDev/Huginn/commit/4d35d9a6a2f9befdaedfcfcd09f9050116623f57))

## [0.26.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.26.1...server@v0.26.2) (2025-08-23)

### Bug Fixes

- **server:** potentially fix server log time zone problem ([ad153f7](https://github.com/WerdoxDev/Huginn/commit/ad153f79115a172561f5b8cafeca157fed26c9c5))

## [0.26.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.26.0...server@v0.26.1) (2025-08-22)

### Bug Fixes

- **server:** set user's last read message when it sends a new message ([69510b9](https://github.com/WerdoxDev/Huginn/commit/69510b948b563bbc1d4bb20c583a06540d2c4960))

## [0.26.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.25.1...server@v0.26.0) (2025-08-20)

### Features

- **server:** add message delete ([cf451e1](https://github.com/WerdoxDev/Huginn/commit/cf451e1548207a302b3d7d37b645d7783fd05504))

## [0.25.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.25.0...server@v0.25.1) (2025-08-19)

### Bug Fixes

- **server:** calls should be checked when updated ([c0b1978](https://github.com/WerdoxDev/Huginn/commit/c0b197882ba77edb1e08c5b7ddd1ec92cf15e090))
- **server:** nonce should only be string ([6c4eaf4](https://github.com/WerdoxDev/Huginn/commit/6c4eaf49dc095b391b98562f63b18e239038ed4c))

## [0.25.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.24.2...server@v0.25.0) (2025-08-16)

### Features

- **server:** add embed generation to message editing ([6daf6cf](https://github.com/WerdoxDev/Huginn/commit/6daf6cf2900788e133c6cc10df9f1b677b23eee0))
- **server:** centralized message dispatching + remove need for idFix + call end timestamp update ([47ebde8](https://github.com/WerdoxDev/Huginn/commit/47ebde8b8b863d5acfffb435d66327330de1b4d6))

## [0.24.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.24.1...server@v0.24.2) (2025-08-11)

### Bug Fixes

- **server:** directly changing voice chat is not sending null state to previous channel ([9ad0189](https://github.com/WerdoxDev/Huginn/commit/9ad01893f0f443543b46266993022c02c4a506a0))
- **server:** log time is not based on Germany ([9e802a3](https://github.com/WerdoxDev/Huginn/commit/9e802a33325f54467ab4a3e4c2a8927cac759297))
- **server:** multi session presence is not working + multi session voice state not working ([3b1f1a3](https://github.com/WerdoxDev/Huginn/commit/3b1f1a35b19dfa9856915df1049401b63a0ac5cd))

## [0.24.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.24.0...server@v0.24.1) (2025-07-22)

### Bug Fixes

- **server:** add time to log ([e1bca9f](https://github.com/WerdoxDev/Huginn/commit/e1bca9f9d1dd643eb0b93a156dc261fa817f56be))

## [0.24.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.23.3...server@v0.24.0) (2025-07-20)

### Features

- **server:** add log capturing route ([2187c39](https://github.com/WerdoxDev/Huginn/commit/2187c39e2f497353dec63f5caec3e974b8034611))

## [0.23.3](https://github.com/WerdoxDev/Huginn/compare/server@v0.23.2...server@v0.23.3) (2025-07-15)

### Bug Fixes

- **server:** update packages + remove https only from session ([11b1269](https://github.com/WerdoxDev/Huginn/commit/11b1269f3337914a1db205854dd0ffd60895f148))

## [0.23.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.23.1...server@v0.23.2) (2025-07-09)

### Bug Fixes

- **server:** google is still using old peer id ([8de20ff](https://github.com/WerdoxDev/Huginn/commit/8de20ffd44e1e9799c753d9a782f8896b8eb85dc))

## [0.23.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.23.0...server@v0.23.1) (2025-07-07)

### Bug Fixes

- **server:** resume is not sending a seq number continuing the old session + bug in voice server dispatch ([47aa045](https://github.com/WerdoxDev/Huginn/commit/47aa045a782df3ec2f1722492b5a11a746ae93b3))

## [0.23.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.22.2...server@v0.23.0) (2025-07-04)

### Features

- **server:** use new shared websocket and client-session implementation ([8b4ca03](https://github.com/WerdoxDev/Huginn/commit/8b4ca03912f8fb68ffdea35761b5e835916e0dd5))

## [0.22.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.22.1...server@v0.22.2) (2025-05-16)

### Bug Fixes

- **server:** fix ringing not getting timedout ([115f931](https://github.com/WerdoxDev/Huginn/commit/115f9316d9cb60be260b158030fb43a64e5ad6d0))

## [0.22.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.22.0...server@v0.22.1) (2025-05-12)

### Bug Fixes

- **server:** actually pass the selfMute and selfDeaf parameters to the voice state update function ([e4b4229](https://github.com/WerdoxDev/Huginn/commit/e4b4229f92ca93f9de4de833d09c6add9ca1597c))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.21.1...server@v0.22.0) (2025-05-07)

### Features

- **server:** add message editing route + extensive edit testing ([566b58d](https://github.com/WerdoxDev/Huginn/commit/566b58d9ca71c114a7c45009109942ca0ce03e91))

## [0.21.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.21.0...server@v0.21.1) (2025-05-05)

### Bug Fixes

- **server:** users can create duplicate calls by requesting ringing again ([ac9a2c4](https://github.com/WerdoxDev/Huginn/commit/ac9a2c4273c0fbb07e80a3a25761ae0b93eab90e))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.20.1...server@v0.21.0) (2025-04-14)

### Features

- **server:** add call event sending + voice tests ([855e8c6](https://github.com/WerdoxDev/Huginn/commit/855e8c66c61f2ce5e2b32fefb8a990b5b45bc63b))

## [0.20.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.20.0...server@v0.20.1) (2025-04-11)

### Bug Fixes

- revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.19.0...server@v0.20.0) (2025-04-11)

### Features

- **app:** half baked electron migration ([9c92b90](https://github.com/WerdoxDev/Huginn/commit/9c92b90bd1a600a97041e19dcc990860e8d9a968))

### Bug Fixes

- revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.18.0...server@v0.19.0) (2025-04-04)

### Features

- **server:** add voice states and fix channel remove recipient event orders ([23239d7](https://github.com/WerdoxDev/Huginn/commit/23239d783f7245a1df65844e1d9d2eeabe9d051c))
- **server:** fix some type imports + tests, and add voice state handling ([03c20c7](https://github.com/WerdoxDev/Huginn/commit/03c20c7834cf254d430e44ce2674e89eebd8d8e0))
- **server:** make the server use only peer id as session id ([3bf9053](https://github.com/WerdoxDev/Huginn/commit/3bf9053834121efc4191ea341241f686d442fcc2))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.17.0...server@v0.18.0) (2025-03-06)

### Features

- **server:** add new tests for attachments and embeds ([97d07c0](https://github.com/WerdoxDev/Huginn/commit/97d07c0e0ba54947f64031e3385da634e037224c))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.16.0...server@v0.17.0) (2025-03-03)

### Features

- **server:** add embed image and video types + fix link detection ([0e028f0](https://github.com/WerdoxDev/Huginn/commit/0e028f039d12062a9b6ef3da1a9388bdae8348da))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.15.1...server@v0.16.0) (2025-02-25)

### Features

- **server:** add ffmpge video probing ([2236c9d](https://github.com/WerdoxDev/Huginn/commit/2236c9df9312d42899e51dbb4836517d4ecf600a))

### Bug Fixes

- **server:** add larger idle timeout ([1cf8c80](https://github.com/WerdoxDev/Huginn/commit/1cf8c8019a70c87a1f5d6c504eac667d3c53c0de))
- **server:** ffmpeg temp dir is wrong ([5fdc805](https://github.com/WerdoxDev/Huginn/commit/5fdc8054e809b58e71cbc466a0e45d322059ceff))

## [0.15.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.15.0...server@v0.15.1) (2025-02-23)

### Bug Fixes

- **server:** remove unused imports ([1cf797e](https://github.com/WerdoxDev/Huginn/commit/1cf797ed682a20312dcd1a752d1738ad12f3c550))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.14.0...server@v0.15.0) (2025-02-19)

### Features

- **server:** remove image size constrains in favour of app auto constrains ([3f439bb](https://github.com/WerdoxDev/Huginn/commit/3f439bb7d0d6e8dcb7f3ab31b3d8cac0ee1fb4b3))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.13.1...server@v0.14.0) (2025-02-18)

### Features

- **server:** add startup text ([c386c63](https://github.com/WerdoxDev/Huginn/commit/c386c63423fd26f4ab2f34ad47def2633acaa8a6))
- **server:** add utility function to get an attachments url ([9a61380](https://github.com/WerdoxDev/Huginn/commit/9a6138064b0ad28e2457a634acbd947e956b1919))

### Bug Fixes

- **server:** cdn attachments url is a localhost and not midgard ([981e764](https://github.com/WerdoxDev/Huginn/commit/981e76453cbe952aaf4f64410e949568a9bd5b4f))
- **server:** use better names for cdn local and public url ([e63055e](https://github.com/WerdoxDev/Huginn/commit/e63055e62b97656b1eb21ba41718ab22ab95667e))

## [0.13.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.13.0...server@v0.13.1) (2025-02-15)

### Bug Fixes

- **server:** better image type detection for attachments ([44e23d5](https://github.com/WerdoxDev/Huginn/commit/44e23d5ab48ca13e3629df811418f2b237d4b662))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.12.0...server@v0.13.0) (2025-02-11)

### Features

- **server:** add attachment creation + cdn attachment upload ([c63f0ef](https://github.com/WerdoxDev/Huginn/commit/c63f0ef8c808b17b5fd11e6393ce0e3f90c7e8be))

### Bug Fixes

- **server:** image data from url is not handled correctly ([c2fb6f4](https://github.com/WerdoxDev/Huginn/commit/c2fb6f4c1a8605b7fe1f0859c9696c22b2c44962))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.2...server@v0.12.0) (2025-02-10)

### Features

- **server:** add form body handling to message.post ([46942ca](https://github.com/WerdoxDev/Huginn/commit/46942ca35b80bb652acc7bd9a6aee9f71831218f))

### Bug Fixes

- **server:** getting github tags should be paginated to get all available ones ([a8f3665](https://github.com/WerdoxDev/Huginn/commit/a8f36657d14da7f9c04cdffbe27e1b63aa737504))

## [0.11.2](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.1...server@v0.11.2) (2025-02-09)

### Bug Fixes

- **server:** fix google callback redirect mismatch ([ba6bae6](https://github.com/WerdoxDev/Huginn/commit/ba6bae6c66306063f5a03a8238e34ff6893e5e96))

## [0.11.1](https://github.com/WerdoxDev/Huginn/compare/server@v0.11.0...server@v0.11.1) (2025-02-08)

### Bug Fixes

- **server:** fix redirect host not being correct on prod ([7bfbdc6](https://github.com/WerdoxDev/Huginn/commit/7bfbdc68ff3bb49e3c4c581428640a63b71df35a))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.10.0...server@v0.11.0) (2025-02-07)

### Features

- **server:** add test messages to prepration script ([a680e7a](https://github.com/WerdoxDev/Huginn/commit/a680e7a2660d266492c23d04fbe50c7d0b69aa6f))

### Bug Fixes

- **server:** static routes not working after migration to hono ([f27086c](https://github.com/WerdoxDev/Huginn/commit/f27086c4e91e3cbb1d1b0435ba9233bccf115844))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.9.0...server@v0.10.0) (2025-02-01)

### Features

- **cdn, server:** abandoning nitro migration in favor of Hono ([bb5ccf7](https://github.com/WerdoxDev/Huginn/commit/bb5ccf73fac4e61c0dfb6750a71e48f81f8baa7d))
- **server:** add command driven nitro build ([d26919e](https://github.com/WerdoxDev/Huginn/commit/d26919ea0073f5e2f1f55863e7f5cef8f4c93cd8))
- **server:** complete test migration ([4e369ba](https://github.com/WerdoxDev/Huginn/commit/4e369baca343525f462b66799117b3fbd39df937))
- **server:** use backend-shared's test utils instead ([de63d39](https://github.com/WerdoxDev/Huginn/commit/de63d39913f7da0023736d566e641c21ccdb893e))

### Bug Fixes

- **server:** fix problem with user patching and password getting reset + remove unused methods ([c16552d](https://github.com/WerdoxDev/Huginn/commit/c16552d6e8938f7d086142558e4d25b5d3c0c3e1))

## [0.9.0](https://github.com/WerdoxDev/Huginn/compare/server@v0.8.0...server@v0.9.0) (2025-01-08)

### Features

- **server:** move version checking to github releases instead of aws s3 ([ffb972f](https://github.com/WerdoxDev/Huginn/commit/ffb972f9e771b52093f54eedb89cf8f073e88b5d))

### Bug Fixes

- **server:** check-update should only check if target includes a certain string ([84e1400](https://github.com/WerdoxDev/Huginn/commit/84e14007f828f0e6da872c26dc1e9b1d7c64f8b3))

## [0.8.0](https://github.com/WerdoxDev/Huginn/compare/server-v0.7.0...server@v0.8.0) (2025-01-07)

### Features

- **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/WerdoxDev/Huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
- prepare packages for release-please ([03aecca](https://github.com/WerdoxDev/Huginn/commit/03aeccaf204a18a4b0f4764689623806f3d7b1fd))
- **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/WerdoxDev/Huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))
- **server:** add unstable message embed generation ([6199ef9](https://github.com/WerdoxDev/Huginn/commit/6199ef94237d130eebac8eca0a15239af074fc54))
- **server:** add waitUntil + embed thumbnail processing ([9894172](https://github.com/WerdoxDev/Huginn/commit/9894172f16722ee64151fd068b3b129f0b259f0a))
- **server:** message generated embeds now process after the response ([94e2514](https://github.com/WerdoxDev/Huginn/commit/94e2514289d6e4a11595dd86d829b57eaa7844f6))
- **server:** move h3 handlers to the backend shared package ([59146b2](https://github.com/WerdoxDev/Huginn/commit/59146b22cac518e3aafbd51b150f41650fe9a14d))
- **server:** remove nightly from app releases endpoints ([9289f39](https://github.com/WerdoxDev/Huginn/commit/9289f39e2a99ccdcc744ba8a0c63509eb791aa2d))

### Bug Fixes

- action config change [#10](https://github.com/WerdoxDev/Huginn/issues/10) ([a01ed84](https://github.com/WerdoxDev/Huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
- action config change [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([bbe926e](https://github.com/WerdoxDev/Huginn/commit/bbe926e2b8a68a3a876f1b5422111c5ff0d3c93d))
- action config change [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([b1e4101](https://github.com/WerdoxDev/Huginn/commit/b1e4101f5d89d4f3c8997152163e53b3a59cc072))
- **app:** message ack from ws should only be used when in other channels ([4e19c67](https://github.com/WerdoxDev/Huginn/commit/4e19c674cf2331ee1a80855789a5b208d5387164))
- **server,cdn,bifrost:** move handler registration place ([36f9d8d](https://github.com/WerdoxDev/Huginn/commit/36f9d8d005f94509c5e23b52e9a84344db335fcb))
- **server:** remove unused import ([7a1d25a](https://github.com/WerdoxDev/Huginn/commit/7a1d25a3b01c92e621c6c0a423b00437fb20c7c1))
