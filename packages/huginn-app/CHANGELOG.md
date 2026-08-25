# Changelog

## [0.89.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.89.0...app@v0.89.1) (2026-08-25)


### Bug Fixes

* **app:** read env correctly on both electron and vite ([ba25efc](https://github.com/WerdoxDev/Huginn/commit/ba25efc92da5382e5c5f7418ea1aaf97642bdb85))

## [0.89.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.88.2...app@v0.89.0) (2026-08-24)


### Features

* **app:** add actual cdn url for android notification + channel in call indicator + use cdn external url for embeds and gifs ([4637001](https://github.com/WerdoxDev/Huginn/commit/4637001523bc02b7012a3f8af2e8bdd9239a7a05))
* **app:** add separate portrait background image for channels ([3c785c7](https://github.com/WerdoxDev/Huginn/commit/3c785c7bc20028de8e3b2afbe61759273b7523d5))
* **app:** add swipe to reply in mobile ([322d91d](https://github.com/WerdoxDev/Huginn/commit/322d91d0ce281be78d49f7c5cfdc4d980fb93965))

## [0.88.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.88.1...app@v0.88.2) (2026-08-20)


### Bug Fixes

* **app:** fixed 3 small bugs from notion ([e68986e](https://github.com/WerdoxDev/Huginn/commit/e68986e5458f71a07c6270c99aab1af86ec219e5))

## [0.88.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.88.0...app@v0.88.1) (2026-08-19)


### Bug Fixes

* **assets:** fix icon generation ([#326](https://github.com/WerdoxDev/Huginn/issues/326)) ([e5462e7](https://github.com/WerdoxDev/Huginn/commit/e5462e7feaac80ffdd8368c750ace7024429026b))

## [0.88.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.87.0...app@v0.88.0) (2026-08-19)


### Features

* **app:** add custom android notifications with much better grouping and removing functionality ([6e2e013](https://github.com/WerdoxDev/Huginn/commit/6e2e0138243a3573dbdc6174bc36ea6aca5bc66e))
* **app:** add global channel background in theme tab ([0ed09c2](https://github.com/WerdoxDev/Huginn/commit/0ed09c2078db2700fdf7ba249de7c49a95cb086c))
* **app:** android default notification color should be based on theme + android notification toggle ([87b905b](https://github.com/WerdoxDev/Huginn/commit/87b905b02d4300e2947ab4cab7bd6bb329146e0a))
* **app:** android specific settings voice tab (wip) ([66c96f2](https://github.com/WerdoxDev/Huginn/commit/66c96f23992243d114939a9db086882aedfd5d1e))
* **app:** better voice input implementation with single stream instance ([707248d](https://github.com/WerdoxDev/Huginn/commit/707248d5a1d58236bdc26fec9210d18098d57a1a))
* **app:** complete voice implementation in android with audio routing and camera flipping ([c2ffbcc](https://github.com/WerdoxDev/Huginn/commit/c2ffbcc3d34bf6904a0150e189343863799a7d20))
* **app:** foreground service for voice with button handlers. ([ef94276](https://github.com/WerdoxDev/Huginn/commit/ef942767ec78d199f949d699ad04a8f12a224e4b))
* **app:** handle new native cut version ([162d315](https://github.com/WerdoxDev/Huginn/commit/162d315f28b250907514b42950fc2b723c975b38))


### Bug Fixes

* **app:** add automtatic versionCode and name incrementation ([8c0d7a9](https://github.com/WerdoxDev/Huginn/commit/8c0d7a9f1a01a818bc4c0cbc79f8d02eb52c2e31))
* **app:** fix mobile first time launch having window.opener ([9371236](https://github.com/WerdoxDev/Huginn/commit/9371236c4954f34e90eb4fc61ed64734f13299ad))

## [0.87.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.86.0...app@v0.87.0) (2026-08-08)


### Features

* **app:** one shot implementation of chat backgrounds ([499b0dd](https://github.com/WerdoxDev/Huginn/commit/499b0dd2fff00f5baf278e4157aa1d510287b18f))

## [0.86.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.85.0...app@v0.86.0) (2026-08-04)


### Features

* **app:** show audio file cover art + copy link for normal attachment files ([1a2c164](https://github.com/WerdoxDev/Huginn/commit/1a2c16490efdaa521be99d90798aa1f6f9f64d0a))


### Bug Fixes

* **app:** use events from VoiceState instead of from gateway for voicestate ([cf26abd](https://github.com/WerdoxDev/Huginn/commit/cf26abd40b9b4698bcddf81b3782d3b89258e49d))

## [0.85.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.84.0...app@v0.85.0) (2026-08-02)


### Features

* **app:** add voice & media popout feature ([1fdb7a8](https://github.com/WerdoxDev/Huginn/commit/1fdb7a819e77e31549bb4e9cde7729946afd2a2e))
* **app:** multi wndow query and mutation fetching ([b79f4dc](https://github.com/WerdoxDev/Huginn/commit/b79f4dc0f847e4519c20207f6ce27c723de3984f))
* rename @huginn/shared to @huginnjs/shared + fix @huginnjs/api dependencies for npm ([7c0cb4c](https://github.com/WerdoxDev/Huginn/commit/7c0cb4c04be00fd8dc3fc23907dfaf368461cd1c))


### Bug Fixes

* **app:** close stream when update fails ([6600866](https://github.com/WerdoxDev/Huginn/commit/6600866c80c6dc1eb5bcce6a89f982af863af4aa))
* **app:** small tooltip fix ([d5f9c5a](https://github.com/WerdoxDev/Huginn/commit/d5f9c5aea2e620e1236db1f9d705acfa556e87da))
* remove @std/encoding from api and shared ([87903a3](https://github.com/WerdoxDev/Huginn/commit/87903a33f86904f37192221b729db7d78bc1b0dd))

## [0.84.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.83.0...app@v0.84.0) (2026-07-28)


### Features

* **app:** add banner and avatar previews when cropping + much better accent and banner color selection ([fddb815](https://github.com/WerdoxDev/Huginn/commit/fddb815054ea21dcdcbd0bd78a6d8d1c52b0d434))
* **app:** add bunch of new context menu options for gifs, videos and images ([5caa816](https://github.com/WerdoxDev/Huginn/commit/5caa81693912e21a47cba44dce3a3e3681c4b6ee))
* **app:** Audio player + mobile file picker ([9e399a7](https://github.com/WerdoxDev/Huginn/commit/9e399a7acc8690d45080474075aaa10d8c6e141a))


### Bug Fixes

* **app:** potential fix for empty notification body ([7c71e25](https://github.com/WerdoxDev/Huginn/commit/7c71e257a3878f2fff70618c5c4096f3056a1df0))

## [0.83.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.82.0...app@v0.83.0) (2026-07-22)


### Features

* **app:** much better looking voice debug + ping derived from webrtc RTT ([cb72099](https://github.com/WerdoxDev/Huginn/commit/cb72099b42d0f2dcd62ccd737ffb29731c750309))
* **app:** use new loopback-capture package ([fcd3251](https://github.com/WerdoxDev/Huginn/commit/fcd325168083352c1fe753610416b0ff7a84d753))

## [0.82.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.81.0...app@v0.82.0) (2026-07-20)


### Features

* **app:** handle new presence model ([e96aa1b](https://github.com/WerdoxDev/Huginn/commit/e96aa1b30d74023bf74df2ac01cb7f62e77af3a9))

## [0.81.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.80.0...app@v0.81.0) (2026-07-17)


### Features

* **app:** new voice element design ([76941ce](https://github.com/WerdoxDev/Huginn/commit/76941ce7ecd854ec09c648159d1cbe518ded3053))
* **app:** remove constant desktopCapturer.getSources calls + complete rework of audio stream modal ([22087d5](https://github.com/WerdoxDev/Huginn/commit/22087d58f7c2447017316efe4722f5839992bf2e))
* **app:** remove refresh button from audio and video streams in favor of live updates ([0016d11](https://github.com/WerdoxDev/Huginn/commit/0016d11e7d47940db4aec9e62e3eca47dfb4de83))


### Bug Fixes

* **app:** revert package json version change ([7f275b4](https://github.com/WerdoxDev/Huginn/commit/7f275b404ebdcee590bb659016b747ff623057c9))

## [0.80.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.79.0...app@v0.80.0) (2026-07-11)


### Features

* **app:** 100% test coverage for audio level checker, source player and voice input device ([54d2c96](https://github.com/WerdoxDev/Huginn/commit/54d2c96027d2e2feee47a878ce1d476b639943e3))
* **app:** 100% voice-bridge test coverage ([e5fa7c5](https://github.com/WerdoxDev/Huginn/commit/e5fa7c5f3984d4061a7c4400aea4e5f0bb7b8bec))
* **app:** action messages RTL tests ([79f1f47](https://github.com/WerdoxDev/Huginn/commit/79f1f476d4375de3a93f85032f8f5e24a09b473a))
* **app:** add expression panel for gifs, emojis and... ([df3b9ed](https://github.com/WerdoxDev/Huginn/commit/df3b9ed6ddcf044bd34ba7bd528ba6de34b97358))
* **app:** alsmost 100% test coverage on some other files ([50013d5](https://github.com/WerdoxDev/Huginn/commit/50013d5c0a8d62c9785de662755ecf6e9d171375))
* **app:** full gif sending implementation with favoutite gifs ([d86ee8a](https://github.com/WerdoxDev/Huginn/commit/d86ee8ad6a03c502c78359fd9c03927c8220371d))
* **app:** use new native addon methods ([136248d](https://github.com/WerdoxDev/Huginn/commit/136248ddded3e854835f7ea3ae5fec65a7133e03))

## [0.79.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.78.0...app@v0.79.0) (2026-07-05)


### Features

* **app:** finish mention ui implementation + new token replacement methods ([4bd8b69](https://github.com/WerdoxDev/Huginn/commit/4bd8b6907b181d4d83108261a7fafbe55e8f29d8))
* **app:** implement mentions on ui + updated all color themes to use oklch ([72d3141](https://github.com/WerdoxDev/Huginn/commit/72d31412cf03717926ab120549f284fb00143036))


### Bug Fixes

* wrong package overrides ([c00d7dd](https://github.com/WerdoxDev/Huginn/commit/c00d7dd6f10c8eec6561996da849eb96334d98b9))

## [0.78.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.77.1...app@v0.78.0) (2026-07-02)


### Features

* **app:** add experimental reaction adding, removing and rendering ([dcdfebb](https://github.com/WerdoxDev/Huginn/commit/dcdfebb953fdfba4677b22ccff890372048085eb))
* **app:** add proxy settings + remove old unused logs ([b6a5f0c](https://github.com/WerdoxDev/Huginn/commit/b6a5f0c59280c30e1f808f869b6ad6755452e33c))
* **app:** add recent emojis on context menu + some reaction bug fixes ([2cb32e0](https://github.com/WerdoxDev/Huginn/commit/2cb32e00e36baf14ebd793ca15b9ae873345b126))
* **app:** make popover a controlled component ([f202a9a](https://github.com/WerdoxDev/Huginn/commit/f202a9a2f780fae1f414ff0d26e4f1c5b822ab3f))
* **assets:** add assets project ([4667a6c](https://github.com/WerdoxDev/Huginn/commit/4667a6ce6faf05a4aca9ae07d2939b735fe7c507))
* **backend-shared:** a failed but good attempt at using drizzle with better-drizzle ([43b0564](https://github.com/WerdoxDev/Huginn/commit/43b0564e79c80e4e489521cd7d11066a73d32d75))
* **backend-shared:** a failed but good attempt at using drizzle with better-drizzle ([e98ef3b](https://github.com/WerdoxDev/Huginn/commit/e98ef3bc0ba906f0a592601760885bb8c5f04125))
* **shared:** move emoji stuff to a new file ([169fe93](https://github.com/WerdoxDev/Huginn/commit/169fe93994e7ee03085642258313415a3ba9fe00))


### Bug Fixes

* **app:** bunch of drawer fixes ([09f5ea0](https://github.com/WerdoxDev/Huginn/commit/09f5ea06ad5559c733fcea558640930b8b87d6e5))
* **app:** bunch of emoji rendering bug fixes + add missing emojis ([4f9a2f2](https://github.com/WerdoxDev/Huginn/commit/4f9a2f232a8370e3465c0a6df1df45d0d88d6ca5))
* **app:** revert emojis having id ([d85b6bd](https://github.com/WerdoxDev/Huginn/commit/d85b6bdf41a451e37be40ae38f10294353ea5ad0))
* **assets:** get emoji codepoint from shared pacakge ([0ab4a64](https://github.com/WerdoxDev/Huginn/commit/0ab4a644da9960bcace23cd71034e767184efa7e))

## [0.77.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.77.0...app@v0.77.1) (2026-06-27)

### Bug Fixes

- **app:** many message box vertical alignment fixes ([82dad7a](https://github.com/WerdoxDev/Huginn/commit/82dad7a69879928a9f6c68a9d3c67ec2cfe763af))

## [0.77.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.76.0...app@v0.77.0) (2026-06-25)

### Features

- **app:** active panel indicator + taller message box + new user info design ([cc6d1c8](https://github.com/WerdoxDev/Huginn/commit/cc6d1c8083dadcc537aba48f801ed94d0e39689c))
- **app:** add drawer for select component ([03611a0](https://github.com/WerdoxDev/Huginn/commit/03611a039751f3bd406ac79815e8553b421f3121))
- **app:** add drawer style popups for ocntext menus and menus ([c59df63](https://github.com/WerdoxDev/Huginn/commit/c59df6317b5e34b53e7772c413a657f96030a1a3))
- **app:** check platform in changelogs ([55258c7](https://github.com/WerdoxDev/Huginn/commit/55258c794cfc93967571a9c44d63ef812f837c5b))
- **app:** stacked back handler + better performance for attachments on mobile + popover drawer ([daf5f09](https://github.com/WerdoxDev/Huginn/commit/daf5f092748b196c7c00c9469ccacc86bc742999))

### Bug Fixes

- **app:** back handler missing for submenus ([4320370](https://github.com/WerdoxDev/Huginn/commit/4320370412dd7fbd3006812da017f734410a2c74))
- **app:** emoji panel color selection wrong ui in mobile ([7c34019](https://github.com/WerdoxDev/Huginn/commit/7c34019e32a0d6cda5d52e8a992b043aa225901d))
- **app:** keyboard inset overlay not working on some andorids + some menue fixes ([3464298](https://github.com/WerdoxDev/Huginn/commit/3464298e4434c0e6c38bedbc9b0fae97c80d8bb1))
- **app:** multi message add or update scroll fix ([c5fa5b2](https://github.com/WerdoxDev/Huginn/commit/c5fa5b26b0575f4270c28c5d1993954f637bd889))
- **app:** rtl and ltr mixed text ordering is wrong ([a76f60b](https://github.com/WerdoxDev/Huginn/commit/a76f60b38f30668fe20637fded1fc06ee747127a))
- **app:** use debug for android bundle upload ([e3a9c6a](https://github.com/WerdoxDev/Huginn/commit/e3a9c6a9e2fc58100126e664b4309d956c600ffa))
- **app:** wrong apk file path for android ([ca1b1b9](https://github.com/WerdoxDev/Huginn/commit/ca1b1b9ec758eafecfb5697dac4e4ed4581d5fca))

## [0.76.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.75.0...app@v0.76.0) (2026-06-19)

### Features

- **app:** add actual icons + push notification implementation ([50745f4](https://github.com/WerdoxDev/Huginn/commit/50745f4a7e49feb7571c649a5c0443049efad3a5))

### Bug Fixes

- **app:** few visual bugs + voice-debug route bug ([6518e49](https://github.com/WerdoxDev/Huginn/commit/6518e496bedd461a5d0101aecea51f6cced5d399))
- potential android workflow fix [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([0bae2d1](https://github.com/WerdoxDev/Huginn/commit/0bae2d1220debb21947724cc24e0b28b3f9473b3))
- potential android workflow fix [#5](https://github.com/WerdoxDev/Huginn/issues/5) ([c70d8a1](https://github.com/WerdoxDev/Huginn/commit/c70d8a1d1cf9ce8a5ec614b26e91e80375b69e8a))
- potential android workflow fix [#8](https://github.com/WerdoxDev/Huginn/issues/8) ([a5cff1b](https://github.com/WerdoxDev/Huginn/commit/a5cff1bca12548d24552585b779b0349fe370101))

## [0.75.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.74.1...app@v0.75.0) (2026-06-16)

### Features

- **app:** add android keyboard handling for in-place emoji picker behind keyboard ([f8d6dcb](https://github.com/WerdoxDev/Huginn/commit/f8d6dcb698d8974111d9c8c3493115a1770653d3))
- **app:** add android OTA update support ([abeb695](https://github.com/WerdoxDev/Huginn/commit/abeb69579cf2032feb6965f42f5065c6454a761e))
- **app:** add native image & video viewer for attachment sending ([d0687e8](https://github.com/WerdoxDev/Huginn/commit/d0687e889a68978432944b11067e1e6b85182116))

### Bug Fixes

- **app:** channel sidebar problem on mobile ([96c5b7c](https://github.com/WerdoxDev/Huginn/commit/96c5b7c244b1df1ffd33f0ad61490a4ab071f3c3))

## [0.74.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.74.0...app@v0.74.1) (2026-06-12)

### Bug Fixes

- **app:** add vercel rewrites ([2142362](https://github.com/WerdoxDev/Huginn/commit/2142362082bddba7380a23bf357eb1799f1c0f9e))
- **app:** much better emoji picker design ([b138505](https://github.com/WerdoxDev/Huginn/commit/b1385051a9c9d236bf0b74f8835676cc93508861))

## [0.74.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.73.1...app@v0.74.0) (2026-06-12)

### Features

- **app:** way better emoji picker with better performance + better emoji list + local emoji assets ([5bb00fe](https://github.com/WerdoxDev/Huginn/commit/5bb00fe143d8ddfc7fb33624976c20a4f9241cb6))

### Bug Fixes

- **app:** lots emoji picker fixes and improvements ([19738c5](https://github.com/WerdoxDev/Huginn/commit/19738c5641369d4e2606e914210779bafa37b0b3))

## [0.73.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.73.0...app@v0.73.1) (2026-06-10)

### Bug Fixes

- **app:** add unicode-emoji-json to build deps ([c9bdc5f](https://github.com/WerdoxDev/Huginn/commit/c9bdc5f5f3335a04ff1666210f37026e5b5c6cb0))
- **app:** add unicode-emoji-json to config ([f60d2db](https://github.com/WerdoxDev/Huginn/commit/f60d2db0f3ff61c6b81775a05fd6c7283183f747))

## [0.73.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.72.1...app@v0.73.0) (2026-06-10)

### Features

- **app:** add experimental emoji picker with all unicode emojis from v17 ([c3b7e24](https://github.com/WerdoxDev/Huginn/commit/c3b7e24b65d3c352f85dbbfffb29762042aade64))
- **app:** add proper message error indicator with retry function ([cac3333](https://github.com/WerdoxDev/Huginn/commit/cac33333620013e13f8aa233a888f0b45043c558))
- **app:** bunch of work for emoji rendering and correct void element navigation ([24a600f](https://github.com/WerdoxDev/Huginn/commit/24a600f498df0569e9610eec3da9c63131368396))
- **app:** emoji picker search bar ([df82619](https://github.com/WerdoxDev/Huginn/commit/df82619bdbe9014d64a53a633cc2088c42eb233b))
- **app:** more emoji fixes + emoji rendering + migrate to MarkedJS ([d9afde3](https://github.com/WerdoxDev/Huginn/commit/d9afde3d6a1dd911acbfac340efe1128ec9b8d3d))

### Bug Fixes

- **app:** better naming for image crop modal ([5ea57b2](https://github.com/WerdoxDev/Huginn/commit/5ea57b255393f6c48b78ef57f64bbaf608f9ceeb))
- **app:** lots more emoji fixes + ran posthog wizard for fun ([b683a91](https://github.com/WerdoxDev/Huginn/commit/b683a912f3dec78e3058bcfbfc1026da34ac2d02))
- **app:** remove support for heic images ([66734a4](https://github.com/WerdoxDev/Huginn/commit/66734a495664967525d091f44c3bb58950b157a0))
- **app:** set path to / for vercel previews ([dd4786b](https://github.com/WerdoxDev/Huginn/commit/dd4786b0055d4e76608eda03ebe544892b83e70c))
- **app:** use data url for notifications + remove cache controller from electron ([5438ffd](https://github.com/WerdoxDev/Huginn/commit/5438ffd1977ca1a2e693214e47429600b089aee3))
- new vercel structure ([1fed326](https://github.com/WerdoxDev/Huginn/commit/1fed326d43e2a8aef71b72204313c6a87b9bbac2))
- new vercel structure ([618187e](https://github.com/WerdoxDev/Huginn/commit/618187e28add4e173cb8152ee339e4ebc08ca5b4))

## [0.72.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.72.0...app@v0.72.1) (2026-06-05)

### Bug Fixes

- **app:** electron build fix ([7856de5](https://github.com/WerdoxDev/Huginn/commit/7856de50b52f3d2cb43d6efb7592ecb2abee0d6e))
- **app:** electron build fix ([e3cb96e](https://github.com/WerdoxDev/Huginn/commit/e3cb96e65922558d42c8cbb84e671cf06dec017e))

## [0.72.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.71.1...app@v0.72.0) (2026-06-05)

### Features

- **app:** add one time runnable actions after update + new settings for OTLP and Posthog ([39eaad7](https://github.com/WerdoxDev/Huginn/commit/39eaad7268883cb7be943e7e0d8c8a492c8e541d))
- **app:** bunch of cleanups around initializing stores + unified storage solution ([06bdf44](https://github.com/WerdoxDev/Huginn/commit/06bdf44eaea439bd09a08580a7e33317932dc1dc))
- **app:** bunch of cleanups around initializing stores + unified storage solution ([8a61b40](https://github.com/WerdoxDev/Huginn/commit/8a61b4088bd1e68197da2eb6d000d4db6cd06fae))
- **app:** implement basic OTel (just file system and notification for now) ([cfd6a6a](https://github.com/WerdoxDev/Huginn/commit/cfd6a6af2bb1e075d0ee2bcfc5555b4f8cb184c8))

### Bug Fixes

- **app:** betetr loading ui for media stuff ([7722008](https://github.com/WerdoxDev/Huginn/commit/772200853be92ec5c525c30dcdc02effd7396c42))
- **app:** use semver-ts instead of semver ([86e8eca](https://github.com/WerdoxDev/Huginn/commit/86e8ecadbfcdcb19dc8de4ea76907bb8a8d066c3))
- **app:** use shortened function for span error recording ([916f1a6](https://github.com/WerdoxDev/Huginn/commit/916f1a622bec7352d5f0c87c1b5451c66327f90e))

## [0.71.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.71.0...app@v0.71.1) (2026-05-31)

### Bug Fixes

- **app:** force an update ([d20918f](https://github.com/WerdoxDev/Huginn/commit/d20918fb2833e1d7174779f617772e746935000d))

## [0.71.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.70.0...app@v0.71.0) (2026-05-31)

### Features

- migrate package manager to pnpm ([8188033](https://github.com/WerdoxDev/Huginn/commit/8188033434162474b72cf4e446100b2f654c6514))
- migrate package manager to pnpm ([36dd56b](https://github.com/WerdoxDev/Huginn/commit/36dd56b34d864e393992b7bd50130529ff314574))

### Bug Fixes

- **app:** appropiate size for user avatars and channel icons ([fba9d2e](https://github.com/WerdoxDev/Huginn/commit/fba9d2ee549eca7bf1c4f41272625fc32304a2de))
- **app:** banner loading shouldn't overflow ([e02aef2](https://github.com/WerdoxDev/Huginn/commit/e02aef216675f3078020ca4c9b6468e4e57a2521))
- **app:** cert files are only needed when in https mode ([19ad9cc](https://github.com/WerdoxDev/Huginn/commit/19ad9ccab96fdc0c1e6f368da83864362f475641))
- **app:** gifs shouldn't play when not focused to client ([7b5fecd](https://github.com/WerdoxDev/Huginn/commit/7b5fecdc345f17468e50711045c58f2c37e199f9))
- **app:** incorrect size on channel icons + tooltip wrong arrow positioning ([e5c694c](https://github.com/WerdoxDev/Huginn/commit/e5c694c3d5b81c38d6fc39b59098ee677dde0b22))
- **app:** pinned messages oveflow on mobile ([4ef8c31](https://github.com/WerdoxDev/Huginn/commit/4ef8c313d32bda9cfd15417c8a40bdd3ee723ed4))
- **app:** profile gifs should only play when hovering over the repective context ([cbc90e1](https://github.com/WerdoxDev/Huginn/commit/cbc90e1be4c5ee00bbf43ab0c056f8887ff922f7))
- **app:** reply renderer username wrapping ([3ea0632](https://github.com/WerdoxDev/Huginn/commit/3ea06320376356a2c8e56a564d37b5b92b041b52))
- **app:** update progress bar fixed at 50% ([4cec510](https://github.com/WerdoxDev/Huginn/commit/4cec5103d396eeb0a270bdf6a93e89feb10e44c5))
- **app:** wrong z-index on channe call border ([cc7e2ae](https://github.com/WerdoxDev/Huginn/commit/cc7e2aea389efa3901eb7283051a75e9a4479549))
- dep updates and fixes ([a9db204](https://github.com/WerdoxDev/Huginn/commit/a9db204afcb781675209a7724ca1acd8f797121e))

## [0.70.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.69.3...app@v0.70.0) (2026-05-28)

### Features

- **app:** add delete pin message ([f85b858](https://github.com/WerdoxDev/Huginn/commit/f85b8583066c2cc306db4a6c734f6b9dd3f42e0c))
- **app:** add much better message updating functionality + pins layout and updating ([1000726](https://github.com/WerdoxDev/Huginn/commit/1000726c9fdbb372983fc8233d9571c8ba946efb))

### Bug Fixes

- **app:** clicking pinned message should jump to message ([6b7499a](https://github.com/WerdoxDev/Huginn/commit/6b7499ad350d949017c1c0f7d76e56f000c00f66))
- **app:** remove double friends + component renames ([e520fb3](https://github.com/WerdoxDev/Huginn/commit/e520fb3bdbf1815911f8ff685ab3d5d7341c7a39))

## [0.69.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.69.2...app@v0.69.3) (2026-05-27)

### Bug Fixes

- **app:** better mobile friends tab layout + non nullable active preset + 3 letter username ([c8a4ac0](https://github.com/WerdoxDev/Huginn/commit/c8a4ac08b09be916d171f289ff18af807d0fb6fa))
- **app:** fix desync issue when gateway is reset + clickable action message users ([92ad6ff](https://github.com/WerdoxDev/Huginn/commit/92ad6ffafd9df49965ec64462bec968b32a112ed))
- **app:** message actions resetting when someone sends + multiple image uploads not working ([0f87a08](https://github.com/WerdoxDev/Huginn/commit/0f87a086604a942d9fdf6c8bb6081d074cd823ac))
- **app:** multiline bio is not shown ([26c4f72](https://github.com/WerdoxDev/Huginn/commit/26c4f72c108b3148bd2f08f002330d3cd1d715e4))
- **app:** safe navigation before deleting channel ([350ec15](https://github.com/WerdoxDev/Huginn/commit/350ec15b0699aa03bb765f81d7eddfd405e66046))

## [0.69.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.69.1...app@v0.69.2) (2026-05-26)

### Bug Fixes

- attempt to fix release please ([d399a05](https://github.com/WerdoxDev/Huginn/commit/d399a051483c3d898d96a904dc8d0ad625798408))
- attempt to fix release please ([dd2ba53](https://github.com/WerdoxDev/Huginn/commit/dd2ba53317d207b26eabeef1c6503e2e13ef7780))
- attempt to fix release please [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([748aff0](https://github.com/WerdoxDev/Huginn/commit/748aff00c1c28af454c7ada9516da06a984ce49e))

## [0.69.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.69.0...app@v0.69.1) (2026-05-26)

### Bug Fixes

- **app:** changelog modal shouldn't be opened all the time ([96c0d7b](https://github.com/WerdoxDev/Huginn/commit/96c0d7bb2ecfe5a7ab566094818eb08ea0100b8c))
- **app:** few fugs related new users appearing from message author or mentions + vercel skip build ([1c3226d](https://github.com/WerdoxDev/Huginn/commit/1c3226d16ac250bfd4b98d313ae442f211905e8b))
- **app:** incorrect release branch name ([5e312c4](https://github.com/WerdoxDev/Huginn/commit/5e312c48a36e69f9e999c60db471e25431721e77))
- **app:** incorrect release branch name ([f44be4d](https://github.com/WerdoxDev/Huginn/commit/f44be4d80a073f45895d51023e103b133ed2678e))

## [0.69.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.68.1...app@v0.69.0) (2026-05-26)

### Features

- **app:** implement changelog fetching and UI ([14b88e5](https://github.com/WerdoxDev/Huginn/commit/14b88e5c51a6c2ee1887c41ca2476f88c30130c2))

### Bug Fixes

- **app:** add experimental label on pins ([ba18b15](https://github.com/WerdoxDev/Huginn/commit/ba18b15775e624b03da6fc741245b7267601906f))
- **app:** background svg cropped on mobile ([7d303ff](https://github.com/WerdoxDev/Huginn/commit/7d303ffde11e75474b176c521c3df7ec903a0c12))
- **app:** channel recipient and name bug fixes + vite 8 update ([bb8b04e](https://github.com/WerdoxDev/Huginn/commit/bb8b04e85d6571183e4b28dd7ce751a997fbefea))
- **app:** few read-state & scrolling & lastMessageId desync bugs ([9d3e2fa](https://github.com/WerdoxDev/Huginn/commit/9d3e2fa2a5ef2fcc4a2b332544950109aad2e25f))
- **app:** fix delayed notifications + default user notification icon ([c77b3d9](https://github.com/WerdoxDev/Huginn/commit/c77b3d95d9c277478b91fc5e9688e735ccb174ee))
- **app:** misstyped condition on getNextParams ([38c5d62](https://github.com/WerdoxDev/Huginn/commit/38c5d62cf310cdbc0792cd0509c19bc41a26a015))
- **app:** much better message box editor focusing + overflowing placeholder text ([4384837](https://github.com/WerdoxDev/Huginn/commit/43848376a1f2bb5082b7a531768ed49ed8cacf8a))

## [0.68.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.68.0...app@v0.68.1) (2026-05-21)

### Bug Fixes

- **app:** electron should load with hash ([2628c23](https://github.com/WerdoxDev/Huginn/commit/2628c23542a3df17bf277526eed90937336bf079))
- **app:** electron should load with hash ([79b6a61](https://github.com/WerdoxDev/Huginn/commit/79b6a616b1d043ba028166de91096bf4a9ff30e1))

## [0.68.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.67.0...app@v0.68.0) (2026-05-21)

### Features

- **app:** a small indicator next to channels to indicate current selected channel ([309b858](https://github.com/WerdoxDev/Huginn/commit/309b858595436575520012f99c3587f39a9de4bd))
- **app:** add ghost messages instead of loading text ([84b7107](https://github.com/WerdoxDev/Huginn/commit/84b7107786f41102d537bcdce1bb78461b5d5bb8))
- **app:** add jumping to replied message + highlighting ([00c16a9](https://github.com/WerdoxDev/Huginn/commit/00c16a99ceb6d183d1141ef5631d85079560ea99))
- **app:** add pinned channels with context menu ([5b058ca](https://github.com/WerdoxDev/Huginn/commit/5b058cae4c3d40f94f284fde08c9a540ca97901d))
- **app:** add profile preview in context menu ([b9a975f](https://github.com/WerdoxDev/Huginn/commit/b9a975f520c0a6dfc39005b30e21ac916d2a7fe4))
- **app:** backdrop blur for modals ([4cb01ba](https://github.com/WerdoxDev/Huginn/commit/4cb01ba0164df79d9ccb33a8b7a0b31b9da9cd87))
- **app:** better magnified image modal ([f97d1d3](https://github.com/WerdoxDev/Huginn/commit/f97d1d3686d2ba9ffef139c0f92d59f08dd08f9a))
- **app:** better settings profile redesign with banner color ([daf7abd](https://github.com/WerdoxDev/Huginn/commit/daf7abd38c3cc566552e658d5e893e29aba738e8))
- **app:** changed font + settings advanced tab complete rework with presets ([4d4604a](https://github.com/WerdoxDev/Huginn/commit/4d4604a69de763f4298696d22f79933d8259578c))
- **app:** cleaned up ChannelMessage & MessageBox + much better replying and editing UI design ([33f9ca3](https://github.com/WerdoxDev/Huginn/commit/33f9ca3fb54a43f429a6a5cbe071b73af3a1e627))
- **app:** complete profile settings ([137769e](https://github.com/WerdoxDev/Huginn/commit/137769e9e8f465e44073140494032ece9fbbea92))
- **app:** first wip implementation of user profile ui ([8ef3cb8](https://github.com/WerdoxDev/Huginn/commit/8ef3cb8d53f56fe05fe570abdd33feaae0c0e774))
- **app:** handle login and register with email verification + changes on profile coloring ([ba5ce73](https://github.com/WerdoxDev/Huginn/commit/ba5ce737ec5c4e986d6f288a916c214bc85d1283))
- **app:** improved modal design + wip profile settings ([958ca50](https://github.com/WerdoxDev/Huginn/commit/958ca50ba319a2e20614025ad82a0da6d23dd9cf))
- **app:** make text have exact visible height using new css property + ui info and index ui reworks ([50115cd](https://github.com/WerdoxDev/Huginn/commit/50115cde379e2bc5e3bc8e575ddfaa4ad79f304d))
- **app:** modify activity registration and submission layout ([c781f7b](https://github.com/WerdoxDev/Huginn/commit/c781f7b10f611cd996f4d35f899b3dc74124a804))
- **app:** much better channel sidebar menu for both mobile and desktop ([140eabe](https://github.com/WerdoxDev/Huginn/commit/140eabe67d58a0af44139419f555033c1f275cf9))
- **app:** progress on profile implementation ([8712e26](https://github.com/WerdoxDev/Huginn/commit/8712e261d42a6356b36c7d6eb354b3d89abc654c))
- **app:** try new font + revert exact text box sizing ([1e9b778](https://github.com/WerdoxDev/Huginn/commit/1e9b7782fdd3e4162ecb8fe64aa3a329477cd7f1))
- migrate prettier to oxfmt and full format ([#237](https://github.com/WerdoxDev/Huginn/issues/237)) ([62481be](https://github.com/WerdoxDev/Huginn/commit/62481beb58232bc373358338fa9bc19c889bddc8))

### Bug Fixes

- **app:** better edit and delete buttons for profile settings ([107b7e3](https://github.com/WerdoxDev/Huginn/commit/107b7e3181dbbc1677723a8bd31c0d5defaad304))
- **app:** build issues related to tanstack router ([7d653e9](https://github.com/WerdoxDev/Huginn/commit/7d653e955d7ce4de41b1a914ad6943a8416c47e0))
- **app:** change to empty channel causes bad scroll ([8528018](https://github.com/WerdoxDev/Huginn/commit/8528018ce9333d44fb01cde4cb83d268a837915f))
- **app:** fix build errors ([25061ca](https://github.com/WerdoxDev/Huginn/commit/25061ca87e2c854e7198dcf4dda23521389c12f8))
- **app:** fixes related to read state being unreliable ([6b587de](https://github.com/WerdoxDev/Huginn/commit/6b587de2f768cdf6fa0c4f28f2a8659d56d62a7c))
- **app:** handle when replied message is deleted ([8065d1d](https://github.com/WerdoxDev/Huginn/commit/8065d1dd929f2645bf75259abd90c8f1c3758eb8))
- **app:** image-size-issue ([#240](https://github.com/WerdoxDev/Huginn/issues/240)) ([5cabf19](https://github.com/WerdoxDev/Huginn/commit/5cabf1907eef07e7f380614af8d5437b743c089e))
- **app:** leftover renames ([b3fcb0b](https://github.com/WerdoxDev/Huginn/commit/b3fcb0bf90cac47dba12a2d4669c2d21719b20ad))
- **app:** margin issue on message new date indicator ([d343c72](https://github.com/WerdoxDev/Huginn/commit/d343c721d39d9aadae5229367f3d403f7939e20c))
- **app:** more fixes on build ([47d6ca6](https://github.com/WerdoxDev/Huginn/commit/47d6ca68f904636201e71afd698e441ed3453c7d))
- **app:** oauth redirect picker fix ([#245](https://github.com/WerdoxDev/Huginn/issues/245)) ([ac6e15b](https://github.com/WerdoxDev/Huginn/commit/ac6e15be6adb7a693857b1662a8b1da0cdd742f1))
- **app:** performance problem with canvas + backdrop filter ([997f883](https://github.com/WerdoxDev/Huginn/commit/997f883e896528cbdf44eb4b2c62d5c868ab9656))
- **app:** remove duplicated label usage + better HuginnButton + create channel and add member buttons ([0719f55](https://github.com/WerdoxDev/Huginn/commit/0719f55ba7428cd833b3633fb6d64464768836e1))
- **app:** spacing issue on profile settings ([b82d6e1](https://github.com/WerdoxDev/Huginn/commit/b82d6e1616b86d58445f1013184cbb31dc7804af))

## [0.67.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.66.2...app@v0.67.0) (2026-01-24)

### Features

- **app:** add mobile support settings modal tabs ([1c5571b](https://github.com/WerdoxDev/Huginn/commit/1c5571bf168fea18abe851e3c8874e179f7403bb))
- **app:** complete overhaul of input system (wip) ([0f467f5](https://github.com/WerdoxDev/Huginn/commit/0f467f582c245de86d20880a78ab686ed6842c2c))
- **app:** use updated oauth flow ([671cd7c](https://github.com/WerdoxDev/Huginn/commit/671cd7cff60f9510df193306e1d0b121344eced3))
- **app:** very wip mobile layout support ([deda383](https://github.com/WerdoxDev/Huginn/commit/deda3830c0e7a29b89ce6e7ea824e78fdaa2a90f))

### Bug Fixes

- **app:** base should only be set for web build ([8e45599](https://github.com/WerdoxDev/Huginn/commit/8e45599c0b262f9abfb98d47b5ad0069f22ada01))
- **app:** better pwa icons ([f4652a6](https://github.com/WerdoxDev/Huginn/commit/f4652a6ae39a87695c4aeefdee822eeca78fe43b))
- **app:** context menus should keep the element selected ([a26ec64](https://github.com/WerdoxDev/Huginn/commit/a26ec645bb09aa2d656bf2aabe00436d3bbe1947))
- **app:** incorrect rewrites [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([84b90c5](https://github.com/WerdoxDev/Huginn/commit/84b90c5db6a386696a47291d38e70923378a34d6))
- **app:** incorrect rewrites [#3](https://github.com/WerdoxDev/Huginn/issues/3) ([a0cd2fd](https://github.com/WerdoxDev/Huginn/commit/a0cd2fd82dde6698d560f500b74e35e06b35b979))
- **app:** incorrect vercel rewrites ([943ed8e](https://github.com/WerdoxDev/Huginn/commit/943ed8e863f2e63858791895e4649d012a136a5a))
- **app:** missing channel recipient active state ([2e92386](https://github.com/WerdoxDev/Huginn/commit/2e9238634deeca09d7eba448f798f620aa5fab53))
- **app:** some mobile and secure context fixes + better settings modal mobile state ([2372377](https://github.com/WerdoxDev/Huginn/commit/2372377c8ab74825d3942c7aaea72ca7867611fa))
- **app:** storage check files should happen after client id creation ([3ef0557](https://github.com/WerdoxDev/Huginn/commit/3ef0557b7263c0f6b8a274aeabc80aa19f7b63ac))
- **app:** vercel multiroot fix [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([fecb7df](https://github.com/WerdoxDev/Huginn/commit/fecb7df57a0cf36d2f64456c85edd69685298602))
- **app:** vercel multiroot fix [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([ccd5b50](https://github.com/WerdoxDev/Huginn/commit/ccd5b50a9f5a024c4f6054658b2d05a5890111c2))
- **app:** vercel multiroot fix [#3](https://github.com/WerdoxDev/Huginn/issues/3) ([59f6015](https://github.com/WerdoxDev/Huginn/commit/59f6015bef962d7aa6289400f9e5f67ba9740190))
- **app:** vercel multiroot fix [#4](https://github.com/WerdoxDev/Huginn/issues/4) ([3a00d1e](https://github.com/WerdoxDev/Huginn/commit/3a00d1e9cecd43d7702d3f20a212aaee0a083ec7))
- **website:** app's base dir should be app ([b13d366](https://github.com/WerdoxDev/Huginn/commit/b13d3667a8f362ae227d1391c34f62352999ab80))

## [0.66.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.66.1...app@v0.66.2) (2026-01-06)

### Bug Fixes

- **app:** multi session activities fight each other ([6917a1a](https://github.com/WerdoxDev/Huginn/commit/6917a1a25dae275e7319c2d06a13a869f7b87ab8))

## [0.66.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.66.0...app@v0.66.1) (2026-01-04)

### Bug Fixes

- **app:** add key to stream button change options ([b09583b](https://github.com/WerdoxDev/Huginn/commit/b09583bc79606ac20f0735232744d5e0bcd01796))
- **app:** errors should be also sent to posthog as exceptions ([ba136ea](https://github.com/WerdoxDev/Huginn/commit/ba136ea5525ce18820790570966c6e903fa8ec9f))

## [0.66.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.6...app@v0.66.0) (2025-12-29)

### Features

- **app:** add update stream feature ([1785e19](https://github.com/WerdoxDev/Huginn/commit/1785e1991737c33411733832927ee2604bc05741))

## [0.65.6](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.5...app@v0.65.6) (2025-12-26)

### Bug Fixes

- **app:** add missing error handling in some places ([a857adf](https://github.com/WerdoxDev/Huginn/commit/a857adf348e9f20182b63f401b800a5dbe4f5466))

## [0.65.5](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.4...app@v0.65.5) (2025-12-24)

### Bug Fixes

- **app:** adapt to the new voice error throwing ([63c5676](https://github.com/WerdoxDev/Huginn/commit/63c5676a7e408653beca5651aff272bd85706d7f))
- **app:** trigger app release [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([bff2e87](https://github.com/WerdoxDev/Huginn/commit/bff2e87d66b1ef1550c8169e42ecb8c9ec76b676))

## [0.65.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.3...app@v0.65.4) (2025-12-22)

### Bug Fixes

- **app:** failed consume stream message is sometimes not showing ([fc6cb72](https://github.com/WerdoxDev/Huginn/commit/fc6cb72e0aae5798525471086c28337eb64eb8a1))
- **app:** implement slightly better VAD and another potential fix for ALC ([55b082f](https://github.com/WerdoxDev/Huginn/commit/55b082f51bd9f9c380c5f6bbeacd67d73a2788ac))
- **app:** much better video progress and volume slider ([bb29433](https://github.com/WerdoxDev/Huginn/commit/bb2943373b8ab7d4790749e4fe0913f227d08509))
- **app:** remote unnecessary check in voice store + update news.md ([2343c29](https://github.com/WerdoxDev/Huginn/commit/2343c296bd7220cc450a183cfb3b34cb658cce87))
- **app:** trigger app release [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([bff2e87](https://github.com/WerdoxDev/Huginn/commit/bff2e87d66b1ef1550c8169e42ecb8c9ec76b676))

## [0.65.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.2...app@v0.65.3) (2025-12-21)

### Bug Fixes

- **app:** force an app release ([77cbd1a](https://github.com/WerdoxDev/Huginn/commit/77cbd1a40b787cdb7161e52e5c688efb5b7d68e4))

## [0.65.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.1...app@v0.65.2) (2025-12-20)

### Bug Fixes

- **app:** add a log for better debugging ([9c7b0c2](https://github.com/WerdoxDev/Huginn/commit/9c7b0c2c2f7a1f749b232e34e2735679274cf61c))

## [0.65.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.65.0...app@v0.65.1) (2025-12-18)

### Bug Fixes

- **app:** potential fixes for acl duplication fix + few more stats for debug ([719a5db](https://github.com/WerdoxDev/Huginn/commit/719a5db2ac8bf6ef9788d55046a92c4a69d93d65))

## [0.65.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.64.0...app@v0.65.0) (2025-12-14)

### Features

- **app:** modularize range input + device streaming in screen share ([0aa987d](https://github.com/WerdoxDev/Huginn/commit/0aa987dcf795910abe1f4d4c6c681a15a15bcd0f))

## [0.64.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.63.2...app@v0.64.0) (2025-12-13)

### Features

- **app:** bunch of visual fixes + better toggle + reworked screen share design ([8822dd7](https://github.com/WerdoxDev/Huginn/commit/8822dd7e857ae98e7d1149970d65a998df58d0d6))

## [0.63.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.63.1...app@v0.63.2) (2025-12-09)

### Bug Fixes

- **app:** some name changes and force release for api changes ([b83e609](https://github.com/WerdoxDev/Huginn/commit/b83e60957617c7052843dd6c8464ceac2800a73e))

## [0.63.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.63.0...app@v0.63.1) (2025-12-05)

### Bug Fixes

- **app:** better message query management through helper functions ([feb8693](https://github.com/WerdoxDev/Huginn/commit/feb8693d8005f750002eb377648a810a0fbddb73))
- **app:** few voice visual and audio fixes ([77452ab](https://github.com/WerdoxDev/Huginn/commit/77452abcf13226be5801a697dd0e4e82c7703d02))
- **app:** multi instance should not be allowed even locally ([53f86e8](https://github.com/WerdoxDev/Huginn/commit/53f86e82dc37c24f1780bde218dca40599a3d1b7))

## [0.63.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.62.2...app@v0.63.0) (2025-11-22)

### Features

- **app:** add stream participants indicator ([f18dabe](https://github.com/WerdoxDev/Huginn/commit/f18dabe2927ae5f0f3154a57fa3f644076e938bc))

## [0.62.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.62.1...app@v0.62.2) (2025-11-19)

### Bug Fixes

- **app:** window file url with hash is opened incorrectly ([99c969d](https://github.com/WerdoxDev/Huginn/commit/99c969d1a9b619b30efecf64abc322cea1186dab))

## [0.62.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.62.0...app@v0.62.1) (2025-11-19)

### Bug Fixes

- **app:** fix voice debug window not opening in electron ([c075226](https://github.com/WerdoxDev/Huginn/commit/c075226828ffcd6ca403549d6cf8c27012df6ee4))

## [0.62.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.7...app@v0.62.0) (2025-11-18)

### Features

- **app:** add debug window for voice ([a19a72b](https://github.com/WerdoxDev/Huginn/commit/a19a72b62c7a6db8a3833ce86bca000192d58eba))

## [0.61.7](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.6...app@v0.61.7) (2025-11-09)

### Bug Fixes

- **app:** more visual bugs fix + audio level checker deduplication ([d117b3c](https://github.com/WerdoxDev/Huginn/commit/d117b3cfacc6ca5c42d02a220ef4c5eb13a1a1be))

## [0.61.6](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.5...app@v0.61.6) (2025-11-08)

### Bug Fixes

- **app:** source player is suspended when device is changed ([78c435f](https://github.com/WerdoxDev/Huginn/commit/78c435f4ee16168a12c607ebd6f331de7e67f50a))

## [0.61.5](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.4...app@v0.61.5) (2025-11-08)

### Bug Fixes

- **app:** add audio & video device recovery upon disconnect/reconnect ([f73f4e3](https://github.com/WerdoxDev/Huginn/commit/f73f4e3e1368f9c6eb1d5accaeefaec67b8c17d6))
- **app:** add stream loading indicator+ watch stream button not working when not connected ([b485da1](https://github.com/WerdoxDev/Huginn/commit/b485da15b3a83483c0829cb176b0bd023f36d622))
- **app:** the wrong audio source is being changed ([42e31ed](https://github.com/WerdoxDev/Huginn/commit/42e31ed911e4648b29f591ce96277598a012b904))

## [0.61.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.3...app@v0.61.4) (2025-11-06)

### Bug Fixes

- **app:** audio player is getting removed twice without stopping one of them ([2cc3adc](https://github.com/WerdoxDev/Huginn/commit/2cc3adcef78d06aefb451bea017396569e212dc0))

## [0.61.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.2...app@v0.61.3) (2025-11-06)

### Bug Fixes

- **app:** bunch of visual bugs ([5dfdd68](https://github.com/WerdoxDev/Huginn/commit/5dfdd6884b5caa14ecf251c477452cb1cdb5353d))

## [0.61.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.1...app@v0.61.2) (2025-11-06)

### Bug Fixes

- **app:** builder config is not correct ([e7e7f23](https://github.com/WerdoxDev/Huginn/commit/e7e7f2386f4f81226cd23888b0d975f42f53ca53))

## [0.61.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.61.0...app@v0.61.1) (2025-11-06)

### Bug Fixes

- **app:** make bun use hoisted install for electron-builder ([1908146](https://github.com/WerdoxDev/Huginn/commit/1908146df06602b1204010c6808ace156445005a))

## [0.61.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.3...app@v0.61.0) (2025-11-05)

### Features

- a complete voice refactor that I don't want to split in smaller commits ([69c76bc](https://github.com/WerdoxDev/Huginn/commit/69c76bc831bfea4fd3a9429ab2c62287d21e82a8))
- **app:** use new huginn client initialization method ([bab910e](https://github.com/WerdoxDev/Huginn/commit/bab910e61fa09e586261fa74d5f45da6a13f6f39))

### Bug Fixes

- **app:** speaking state is not set using correct user id ([f69c2f9](https://github.com/WerdoxDev/Huginn/commit/f69c2f9a7e3f7d1ba3e966d53a4688c0965904c0))
- **app:** voice enter and exit sound is not correct ([3addfa8](https://github.com/WerdoxDev/Huginn/commit/3addfa8381aa36dfdcba81e70b092332b5ecd741))

## [0.60.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.2...app@v0.60.3) (2025-09-26)

### Bug Fixes

- **app:** enable voice transport logs ([dccdd3e](https://github.com/WerdoxDev/Huginn/commit/dccdd3e94069514a4697aa2c808091e3ffda1051))

## [0.60.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.1...app@v0.60.2) (2025-09-26)

### Bug Fixes

- **app:** loopback data should not be logged ([9b5d0f5](https://github.com/WerdoxDev/Huginn/commit/9b5d0f59cfb6aa1eea5e9ac2b5536848cfd5cf58))

## [0.60.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.60.0...app@v0.60.1) (2025-09-25)

### Bug Fixes

- **app:** ignore proxy for app ([99c6f93](https://github.com/WerdoxDev/Huginn/commit/99c6f93fce675d51ce9257a5b8160403ba3e0c98))
- **app:** quick fix to launch app without silent arg on relaunch ([2afb54a](https://github.com/WerdoxDev/Huginn/commit/2afb54adfcdd1d250b95c8c7ffce4e77a390d7f4))

## [0.60.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.59.1...app@v0.60.0) (2025-09-24)

### Features

- **app:** convert storage management to a way more robust solution. ([88aacb6](https://github.com/WerdoxDev/Huginn/commit/88aacb671944199f08d50685c6870ab6751a913a))

### Bug Fixes

- **app:** add shims to tsdown to fix \_\_filename ([5a24ff7](https://github.com/WerdoxDev/Huginn/commit/5a24ff7bd6a104106136f16f2eceb364b16b96aa))
- **app:** little tweaks in logger ([d3357d2](https://github.com/WerdoxDev/Huginn/commit/d3357d28b8274948bb744617e9820816535ee2fe))

## [0.59.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.59.0...app@v0.59.1) (2025-09-19)

### Bug Fixes

- **app:** move message rendering to custom renderer instead of slate ([0da38af](https://github.com/WerdoxDev/Huginn/commit/0da38af81c676409145c77ddba9c52eac0fd9243))
- **app:** much better avatar and channel icon loading and caching ([9d076b1](https://github.com/WerdoxDev/Huginn/commit/9d076b103c6b827761c9e2b51a3758f2e2d9ee0a))

## [0.59.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.58.0...app@v0.59.0) (2025-09-18)

### Features

- **app:** add message replying + bunch of query mutation bug fixes ([104ab04](https://github.com/WerdoxDev/Huginn/commit/104ab04956f06264fe8c49c0b7f7aaf02335b50a))

## [0.58.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.2...app@v0.58.0) (2025-09-16)

### Features

- **app:** add custom activity + separate tabs for submission and custom ([981459a](https://github.com/WerdoxDev/Huginn/commit/981459a4af7cee4b9e0e5177c9af510225fffb7f))

## [0.57.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.1...app@v0.57.2) (2025-09-14)

### Bug Fixes

- **app:** support multiple known application names ([6e13d82](https://github.com/WerdoxDev/Huginn/commit/6e13d820b689810139d2516d432d787e5c392823))

## [0.57.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.57.0...app@v0.57.1) (2025-09-14)

### Bug Fixes

- **app:** force an update [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([a93b1ba](https://github.com/WerdoxDev/Huginn/commit/a93b1ba264e3f03dc11e7fef697356b94b14448a))

## [0.57.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.56.0...app@v0.57.0) (2025-09-14)

### Features

- **app:** add activity updating + first iteration activity preview UI ([f7051ca](https://github.com/WerdoxDev/Huginn/commit/f7051ca5b642cdcfd91afce1b37b672e936bb4b4))
- **app:** add settings activity + activity contribution tab + much better native addon icon detection ([d7e6799](https://github.com/WerdoxDev/Huginn/commit/d7e6799f5987b938d1ba9692f0affa7178d3db5b))
- **app:** Icon from xbox apps are now extracted as well ([70fa9f9](https://github.com/WerdoxDev/Huginn/commit/70fa9f94c12da9e097176f2a3aac00f9b8d3ce9e))
- **native-addon:** move addon code to separate package ([41f7641](https://github.com/WerdoxDev/Huginn/commit/41f7641bd3a4ad71ffa272676b9e12efa03d9ad9))

### Bug Fixes

- **app:** add moment to noExternal ([e34ace6](https://github.com/WerdoxDev/Huginn/commit/e34ace6dcd998c39f2117a116e8e78f62adedd2c))

## [0.56.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.2...app@v0.56.0) (2025-09-06)

### Features

- **app:** a first implementation with some icon and file utilities ([daf1570](https://github.com/WerdoxDev/Huginn/commit/daf1570a1c62ad9a5c390d855f645f313dc97f71))
- **app:** add better bundling + native module testing ([428f6a5](https://github.com/WerdoxDev/Huginn/commit/428f6a5c1ae0fdaf5a2f48efcf3cedf4ee38c294))
- **app:** add cmakejs instead of node-gyp ([1e7c0a8](https://github.com/WerdoxDev/Huginn/commit/1e7c0a89439641f2e028df6855c12eb2f8b467cf))
- **app:** add scarlet theme + update old icons ([fb8ea1c](https://github.com/WerdoxDev/Huginn/commit/fb8ea1cee75db53a29d9ff451f107a08ce3369a2))
- **app:** fetch known games with last updated field for delta updates ([713af71](https://github.com/WerdoxDev/Huginn/commit/713af71873ce513cb0f512e03b53f4322c16f2a8))
- **app:** lots of cleanup and napi function changes ([4422bc2](https://github.com/WerdoxDev/Huginn/commit/4422bc2f0b0d1ce0407c6467677065ad8656062e))
- **app:** native addon window utility ([293072e](https://github.com/WerdoxDev/Huginn/commit/293072e52bc68ac84604d60644c6aba1a9ed4e4e))

### Bug Fixes

- **app:** app should listen for session_update not settings_update ([95be693](https://github.com/WerdoxDev/Huginn/commit/95be693406996d0b2aca03aeda67aa30577a4a7b))
- **app:** image preview search wrong is wrong ([3cdef4e](https://github.com/WerdoxDev/Huginn/commit/3cdef4ec5a3b45bd8cb231977fb2df5848cec75c))

## [0.55.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.1...app@v0.55.2) (2025-08-30)

### Bug Fixes

- **app:** dnd status should be respected for not playing audio ([bfd173b](https://github.com/WerdoxDev/Huginn/commit/bfd173b60876f71005ea6bd22ef45140d9657d1b))
- **app:** updating presence should trigger a settings save manually ([0ba7e7b](https://github.com/WerdoxDev/Huginn/commit/0ba7e7b9ce11325b46982ce71c7cade6af25150c))

## [0.55.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.55.0...app@v0.55.1) (2025-08-29)

### Bug Fixes

- **app:** update news.md ([f8415a5](https://github.com/WerdoxDev/Huginn/commit/f8415a5ff5f22be33a2d9e8e8d561fb987b5774d))

## [0.55.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.4...app@v0.55.0) (2025-08-29)

### Features

- **app:** add status choosing + server setting editing ([b6cf773](https://github.com/WerdoxDev/Huginn/commit/b6cf773c554debd368254e1df1777037da4a5786))

### Bug Fixes

- **app:** hide voice controls after no mouse activity ([ec8546e](https://github.com/WerdoxDev/Huginn/commit/ec8546e2a6d74db0a7eb1c4e562aff41328f0710))

## [0.54.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.3...app@v0.54.4) (2025-08-26)

### Bug Fixes

- **app:** make presences only have userId + presences visual bug ([6a980b4](https://github.com/WerdoxDev/Huginn/commit/6a980b4795eae7fd1e513e0e96393d554b1afc9d))

## [0.54.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.2...app@v0.54.3) (2025-08-23)

### Bug Fixes

- **app:** add bunch computed values to users and channels + notification body for every message type ([0224dd9](https://github.com/WerdoxDev/Huginn/commit/0224dd95c7edc9581ec04a306c4cc58348edff9b))

## [0.54.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.1...app@v0.54.2) (2025-08-23)

### Bug Fixes

- **app:** temporary visual fix for voice when gateway disconnects ([8d63046](https://github.com/WerdoxDev/Huginn/commit/8d63046d013b1cdc770b003af2de33f9fc307eff))

## [0.54.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.54.0...app@v0.54.1) (2025-08-22)

### Bug Fixes

- **app:** bunch of scrolling and read state bug fixes ([99108de](https://github.com/WerdoxDev/Huginn/commit/99108de643ede737d0f7d50d413f78fba83b88be))
- **app:** last message of any channel is always getting flagged as unseen ([0a4384e](https://github.com/WerdoxDev/Huginn/commit/0a4384ee9648323ace061531975af3211552e0bd))
- **app:** little visual improvement + message should not rerender when not preview ([fd74f1b](https://github.com/WerdoxDev/Huginn/commit/fd74f1bb71d22e99779c711b04c4a567b20dfbcc))
- **app:** sent messages in an invisible query page should not be added to query data ([dec8724](https://github.com/WerdoxDev/Huginn/commit/dec8724d2feffe058d31d7b7fed83d9719aca8f3))

## [0.54.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.2...app@v0.54.0) (2025-08-20)

### Features

- **app:** add delete message functionality ([36dd5c9](https://github.com/WerdoxDev/Huginn/commit/36dd5c96315b154bb621517a3925652367376035))
- **app:** add voice disconnected indicator ([3fe348c](https://github.com/WerdoxDev/Huginn/commit/3fe348c799fa8c235f88b73e5ba91065dccd3307))

### Bug Fixes

- **app:** logout not working correctly ([30aa284](https://github.com/WerdoxDev/Huginn/commit/30aa2843b5309cf66a128d49aad2e66852a85281))

## [0.53.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.1...app@v0.53.2) (2025-08-20)

### Bug Fixes

- **app:** loopback should get process id by using closest title search + log types ([965a25e](https://github.com/WerdoxDev/Huginn/commit/965a25ef419ebecafde54498bb40b146335ef580))

## [0.53.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.53.0...app@v0.53.1) (2025-08-19)

### Bug Fixes

- **app:** bunch of bug fixes related to message editing and scrolling + voice preference saving bug ([3e3291f](https://github.com/WerdoxDev/Huginn/commit/3e3291f93c7a87caee70c0ad4be6c1f311dbbc5d))

## [0.53.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.52.0...app@v0.53.0) (2025-08-16)

### Features

- **app:** add message editing + better scroll down + message visual changes + call message participants ([55deccf](https://github.com/WerdoxDev/Huginn/commit/55deccf873d8370c579fcc8ddf9b443cfd2d8f5d))

## [0.52.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.7...app@v0.52.0) (2025-08-13)

### Features

- **app:** add keybinds ([c99a3e2](https://github.com/WerdoxDev/Huginn/commit/c99a3e29c6305c8f47093cd266e3ce320048b6c9))

## [0.51.7](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.6...app@v0.51.7) (2025-08-11)

### Bug Fixes

- **app:** joining a call when already in a call not working ([e5b22bb](https://github.com/WerdoxDev/Huginn/commit/e5b22bbbd51e02c66bea09773d1d05d9de383c31))
- **app:** multi session voice state and presence handling ([41489a2](https://github.com/WerdoxDev/Huginn/commit/41489a2aaebbf57f5fe01bfa4feb939bd16a6538))

## [0.51.6](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.5...app@v0.51.6) (2025-08-09)

### Bug Fixes

- **app:** add comment to force a build ([47563a1](https://github.com/WerdoxDev/Huginn/commit/47563a180bc9b809bed56c8c7e66257892371467))

## [0.51.5](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.4...app@v0.51.5) (2025-08-09)

### Bug Fixes

- **app:** visual bug fixes + bunch of client cleanup for dev ([9cff6e4](https://github.com/WerdoxDev/Huginn/commit/9cff6e4db0d93a7c60c79d8634f4304bc49cfd67))

## [0.51.4](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.3...app@v0.51.4) (2025-07-30)

### Bug Fixes

- **app:** bunch of more bug fixes related to voice ([8f561de](https://github.com/WerdoxDev/Huginn/commit/8f561de88de053b92490ae1e63978d73b269a225))

## [0.51.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.2...app@v0.51.3) (2025-07-29)

### Bug Fixes

- **app:** bunch of more fixes to voice visuals ([61c386c](https://github.com/WerdoxDev/Huginn/commit/61c386c540d16d8e6daab8f9e822608af804c6ac))
- **app:** update news ([c3baed2](https://github.com/WerdoxDev/Huginn/commit/c3baed2e6398ab337a3efec7eac3b638679504d4))

## [0.51.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.1...app@v0.51.2) (2025-07-28)

### Bug Fixes

- **app:** video stream is doubled when it also has audio ([3f13bb0](https://github.com/WerdoxDev/Huginn/commit/3f13bb09383290426f1020bfde848e632d2f6777))

## [0.51.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.51.0...app@v0.51.1) (2025-07-28)

### Bug Fixes

- **app:** few stream viewing + sound bug fixes ([cae4bfd](https://github.com/WerdoxDev/Huginn/commit/cae4bfd62c7c73b21890d440aff75f89eff911ed))

## [0.51.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.50.1...app@v0.51.0) (2025-07-27)

### Features

- **app:** add proper notification images + new sounds for leaving, entering and notification ([8760d36](https://github.com/WerdoxDev/Huginn/commit/8760d369483b2b8de627406ee5f9c29fdedce13a))

### Bug Fixes

- **app:** add no audio indicator + visual fixes for leaving voice channel ([dddda51](https://github.com/WerdoxDev/Huginn/commit/dddda517b4002704904fb5ca92af82c5db9489bc))

## [0.50.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.50.0...app@v0.50.1) (2025-07-24)

### Bug Fixes

- **app:** update news.md ([f3a191a](https://github.com/WerdoxDev/Huginn/commit/f3a191aafcfe7fc69726f56bb898e48fa64edb8b))

## [0.50.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.2...app@v0.50.0) (2025-07-24)

### Features

- **app:** add audio only stream with visualizer ([b16170d](https://github.com/WerdoxDev/Huginn/commit/b16170dc5c5dd541efc5078ed42cba893db08b43))

### Bug Fixes

- **app:** adding audio to a video stream won't get consumed + some ui fixes ([d4cc08a](https://github.com/WerdoxDev/Huginn/commit/d4cc08a5a29114cf0e895335d23e0c9265cfd0e4))

## [0.49.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.1...app@v0.49.2) (2025-07-23)

### Bug Fixes

- **app:** fix a few big voice bugs + bunch of voice state name changes ([87daad5](https://github.com/WerdoxDev/Huginn/commit/87daad5d6c69fc12afb494f623cb5fa806d63f5e))

## [0.49.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.49.0...app@v0.49.1) (2025-07-22)

### Bug Fixes

- **app:** pathe is used instead of path ([e88a07b](https://github.com/WerdoxDev/Huginn/commit/e88a07b09d94b78b81ef0043c08778c96ce764d1))

## [0.49.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.2...app@v0.49.0) (2025-07-22)

### Features

- **app:** make audio volume not linear ([f3de1dc](https://github.com/WerdoxDev/Huginn/commit/f3de1dc4573b47e417ff55bc585fa4c303c1485d))
- **app:** voice preference saves now + much better file/localstorage handling ([efdbed4](https://github.com/WerdoxDev/Huginn/commit/efdbed415a8be2fa8c14217f66de8f78a0b2ad95))

## [0.48.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.1...app@v0.48.2) (2025-07-21)

### Bug Fixes

- **app:** fix updating screen logic and event listeners for update/connect steps ([ccd5b5e](https://github.com/WerdoxDev/Huginn/commit/ccd5b5ebf3b12d9b93992ce5f94676e00c3c6201))

## [0.48.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.48.0...app@v0.48.1) (2025-07-21)

### Bug Fixes

- **app:** user speaking style is not applied correctly ([005b6be](https://github.com/WerdoxDev/Huginn/commit/005b6be4178dcec089b973251cab994dc812d2d4))

## [0.48.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.47.0...app@v0.48.0) (2025-07-20)

### Features

- **app:** add basic posthog event capturing (wip) ([a42d688](https://github.com/WerdoxDev/Huginn/commit/a42d688bd8873133d8131f704a0b2a82f0c763a8))
- **app:** add screenshare watch/unwatch + much better voice element handling ([ac57890](https://github.com/WerdoxDev/Huginn/commit/ac57890fb17b7e226bc78c4bc4ef6238585180f7))

## [0.47.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.2...app@v0.47.0) (2025-07-18)

### Features

- **app:** add camera settings + camera preview + shared tab component ([0f0c04c](https://github.com/WerdoxDev/Huginn/commit/0f0c04c28d9eaba8bf7ac1e5767980aef41167ee))
- **app:** add camera streaming feature ([48c2a76](https://github.com/WerdoxDev/Huginn/commit/48c2a7677736f3fbaa832bf4da2dfee35119df9d))

## [0.46.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.1...app@v0.46.2) (2025-07-16)

### Bug Fixes

- **app:** fix typo ([4f587e6](https://github.com/WerdoxDev/Huginn/commit/4f587e69f4f9e6b6de4089e8914a3580ad43c007))
- **app:** some ui issues and local voice state changes ([8619b73](https://github.com/WerdoxDev/Huginn/commit/8619b73ce926e4e6a94180551eed296176303fa1))

## [0.46.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.46.0...app@v0.46.1) (2025-07-15)

### Bug Fixes

- **app:** electron builder needs a publish config ([b593327](https://github.com/WerdoxDev/Huginn/commit/b5933277610c535af2cdcd6d463e78ccef705ce1))

## [0.46.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.45.0...app@v0.46.0) (2025-07-15)

### Features

- **app:** add ability to use external url to fetch hostnames for api,cdn,voice ([b6e40d6](https://github.com/WerdoxDev/Huginn/commit/b6e40d6decc68453e939a771fec0a1aabaaf0152))

### Bug Fixes

- **app:** case-sensitive file rename ([e161b0e](https://github.com/WerdoxDev/Huginn/commit/e161b0e1d051dfc3b59ddff98da92c2cd2169404))
- **app:** inset rounded corners are not working with new tailwind v4 ([37c59ae](https://github.com/WerdoxDev/Huginn/commit/37c59ae59fc3ebceb24a6596d4a4f59ad87f305e))
- **app:** logging out from a channel causes an error ([b0ecb47](https://github.com/WerdoxDev/Huginn/commit/b0ecb47a79acf6a27648463a57948d318f396cd2))
- **app:** make initial global client instance undefinable ([de361bf](https://github.com/WerdoxDev/Huginn/commit/de361bfba4ffcd0fd2eac91a25c1976456e84c3b))
- **app:** oauth should set tokens and go back to index ([6863371](https://github.com/WerdoxDev/Huginn/commit/686337119d5c6606ad1b7482c2d861db5b4141a1))
- **app:** propagation issue with user info component ([bee74c5](https://github.com/WerdoxDev/Huginn/commit/bee74c5f0a8616ed9ecf26cd5aa1c7348ece7c6e))
- **app:** scroll anchoring problem when opening recipients sidebar ([af7b7fc](https://github.com/WerdoxDev/Huginn/commit/af7b7fc0a7f855523cd9a0d83ad1e990de00b1b4))
- **app:** some issues after client was moved to index ([be53a63](https://github.com/WerdoxDev/Huginn/commit/be53a63a06ed0c15ca776d9cbe148995eeceaf9a))
- **app:** visual bugs + browser errors with new initialization ([9e29803](https://github.com/WerdoxDev/Huginn/commit/9e29803919073a467fa806fee2b3ce66112c81dd))

## [0.45.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.44.1...app@v0.45.0) (2025-07-11)

### Features

- **app:** add few playwright tests + much better loader for initialization ([eb6e3de](https://github.com/WerdoxDev/Huginn/commit/eb6e3defba3e951923126b9dcbd208b144d25ba3))

### Bug Fixes

- **app:** go back to vite 7 rollup + some visual bug fixes ([072488d](https://github.com/WerdoxDev/Huginn/commit/072488dd405c365c90daea8acda409357faf4c30))

## [0.44.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.44.0...app@v0.44.1) (2025-07-09)

### Bug Fixes

- **app:** forcing app release ([0dce31a](https://github.com/WerdoxDev/Huginn/commit/0dce31a9b1ccbfac1e84244dc6aaa36ef9a61b2a))

## [0.44.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.43.0...app@v0.44.0) (2025-07-09)

### Features

- **app:** add much better color variety + a little refreshed colors ([bc01817](https://github.com/WerdoxDev/Huginn/commit/bc018178bfe6f1a645cd2a2c8f72df8f32c0e9a6))

### Bug Fixes

- **app:** few html bugs + rename disconnected to close for voice events ([232d356](https://github.com/WerdoxDev/Huginn/commit/232d3568fc3126bdbd95560de0f974c4f4bca601))

## [0.43.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.2...app@v0.43.0) (2025-07-07)

### Features

- **app:** add animations to voice ui ([b272ec1](https://github.com/WerdoxDev/Huginn/commit/b272ec10b309b2db8f1388b5007c2b9cdf6ef8b3))

## [0.42.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.1...app@v0.42.2) (2025-07-04)

### Bug Fixes

- **app:** update application-loopback to fix build problem ([a89be59](https://github.com/WerdoxDev/Huginn/commit/a89be595126575cf642dc2ecdb4b46bde198b65b))

## [0.42.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.42.0...app@v0.42.1) (2025-07-04)

### Bug Fixes

- **app:** add forgotten updated news.md ([0c5fa4b](https://github.com/WerdoxDev/Huginn/commit/0c5fa4b774685d670dc70843621d269afd8a7ca8))

## [0.42.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.41.0...app@v0.42.0) (2025-07-04)

### Features

- **app:** refactor entire initialization method and fix bunch of state checking errors ([8208eea](https://github.com/WerdoxDev/Huginn/commit/8208eeafc955dc415276631bfaeb5a5b8798e1fd))

### Bug Fixes

- **app:** electron build is not correctly bundling application-loopback package ([de7fd89](https://github.com/WerdoxDev/Huginn/commit/de7fd89bc943303d4a1911a76ab79fa9c4817cf0))
- **app:** start background svg is to small on close state ([e5c4bcf](https://github.com/WerdoxDev/Huginn/commit/e5c4bcfb8af4ea410f9ef836ef1c7830757db091))

## [0.41.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.40.0...app@v0.41.0) (2025-06-19)

### Features

- **app:** add extensive logging for voice-store and voice-client ([6a3f4f2](https://github.com/WerdoxDev/Huginn/commit/6a3f4f241160a8cc07d43e45d1f97e0ad9836822))
- **app:** migrate splashscreen and loading into a single place without resizing window ([750c14b](https://github.com/WerdoxDev/Huginn/commit/750c14b2b5dab37db1baf7218509730c22daf436))

### Bug Fixes

- **app:** new splashscreen is not rendering on web ([65e66a8](https://github.com/WerdoxDev/Huginn/commit/65e66a8c2a05b4275624f3c7eef7672d19766703))

## [0.40.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.39.0...app@v0.40.0) (2025-06-14)

### Features

- **app:** refactor voice client into a class & voice noise suppression toggle ([bdacc40](https://github.com/WerdoxDev/Huginn/commit/bdacc4042ab5d88613990b33c03aea3b1996fd95))

### Bug Fixes

- **app:** ScreenshareModal is not being lazy loaded ([3dff231](https://github.com/WerdoxDev/Huginn/commit/3dff231b5a3c8e874864011ef067b36b26df164c))
- **app:** screensharemodal is using the wrong name in git ([6122a47](https://github.com/WerdoxDev/Huginn/commit/6122a475d3d1d1230bcf1aed46935e082438ea16))
- **app:** testing a potential fix on vercel [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([f34761f](https://github.com/WerdoxDev/Huginn/commit/f34761f73a0b638ae6c5638a3400358c1bc350bf))
- **app:** testing a potential fix on vercel [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([fa9be96](https://github.com/WerdoxDev/Huginn/commit/fa9be96ab621d39d61397604f59e1b28c5c8453d))

## [0.39.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.38.0...app@v0.39.0) (2025-06-09)

### Features

- **app:** add voice screenshare fps, resolution and audio indicators ([9baca3a](https://github.com/WerdoxDev/Huginn/commit/9baca3aeb336c50a7bce19297282bb40ab1e9e9b))

## [0.38.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.37.0...app@v0.38.0) (2025-06-08)

### Features

- **app:** add specific application audio loopback ([0214b2c](https://github.com/WerdoxDev/Huginn/commit/0214b2ce69e5ecd53f94a08a65777167fdf813ef))

### Bug Fixes

- **app:** context menu is not opening on fullscreen ([07f48f7](https://github.com/WerdoxDev/Huginn/commit/07f48f7328860fe5da0be7678048470500b0c67d))

## [0.37.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.36.0...app@v0.37.0) (2025-05-31)

### Features

- **app:** add volume slider for individual users & screenshares ([f9573ea](https://github.com/WerdoxDev/Huginn/commit/f9573ea85d23dcf0fd24f693c3b5b6117ab1d54b))
- **app:** better screensahre modal design + hidable voice controlls + better start/stop stream button ([85873d0](https://github.com/WerdoxDev/Huginn/commit/85873d03f79b5009d70a2077e16fcd15e72ad6d6))

## [0.36.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.35.0...app@v0.36.0) (2025-05-18)

### Features

- **app:** add screenshare stopping and some state managerment fixes ([b2f6bc8](https://github.com/WerdoxDev/Huginn/commit/b2f6bc837041b0cc9aac033a12083155ca113778))

## [0.35.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.34.1...app@v0.35.0) (2025-05-16)

### Features

- **app:** add audio input threshold + speaking indicator + voice cleanups ([92f4cfb](https://github.com/WerdoxDev/Huginn/commit/92f4cfb30c9acfcf2d01c1187ee72bbd59eb0e2c))
- **app:** add audio settings + global voice state + audio level checking ([c933af6](https://github.com/WerdoxDev/Huginn/commit/c933af67bb9d618fc10eb73c054e2d25cc4ded10))
- **app:** add first iteration of screensharing ([0871e59](https://github.com/WerdoxDev/Huginn/commit/0871e5961446ba934e24c5ae6e312f229ce43f64))
- **app:** add fullish ui for voice with buttons and indicators ([0642df1](https://github.com/WerdoxDev/Huginn/commit/0642df1613d1e582b823ca3448cd53423be08860))
- **app:** add news modal ([ff266a7](https://github.com/WerdoxDev/Huginn/commit/ff266a7d6bbb9105c1409e889b16ee01b0cc4681))
- **app:** add voice muting and deafening functionality with fully working pausing & resuming ([ba2ddc2](https://github.com/WerdoxDev/Huginn/commit/ba2ddc24453b98d0e5104d77c64a01b3b9ba447a))
- **app:** add voice status component ([3f5542c](https://github.com/WerdoxDev/Huginn/commit/3f5542c9f1ad2b127c0e88b33b39133bea3288fd))
- **app:** better call management and persistent support ([acf0ad4](https://github.com/WerdoxDev/Huginn/commit/acf0ad4feb9ff8344f9c62d422d41e14f8ccf8cb))
- **app:** electron github action [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([df2f245](https://github.com/WerdoxDev/Huginn/commit/df2f245d3ab5cef4c16cb789379d19f1c67fadff))
- **app:** electron github action [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([da24cbe](https://github.com/WerdoxDev/Huginn/commit/da24cbe670889fbc87bee5caaad5224474b1510a))
- **app:** finish migration to electron ([13650fb](https://github.com/WerdoxDev/Huginn/commit/13650fbd6b1bfaf2eaff70f62974361ffbcc34c7))
- **app:** half baked electron migration ([9c92b90](https://github.com/WerdoxDev/Huginn/commit/9c92b90bd1a600a97041e19dcc990860e8d9a968))
- **app:** merged splashscreen into the main window ([dad146b](https://github.com/WerdoxDev/Huginn/commit/dad146b66d7dc965c01adedce15eead683394594))
- **app:** refactor all api related hooks and contexts to use stores instead ([05ea484](https://github.com/WerdoxDev/Huginn/commit/05ea4847e009865e75a2a03d077127ab97d9e338))

### Bug Fixes

- **api:** voice server ip is incorrect ([1773d28](https://github.com/WerdoxDev/Huginn/commit/1773d289c3962c4935c418556a361bcb49321048))
- **app:** add better speaking state management ([6cb415b](https://github.com/WerdoxDev/Huginn/commit/6cb415be47aac8767f95bc697999ad4e1738c18c))
- **app:** disable multi range request for updater ([6a09215](https://github.com/WerdoxDev/Huginn/commit/6a092152c053158d05130cdfeb6ef2ad41598263))
- **app:** dont open dev tools ([fe089a4](https://github.com/WerdoxDev/Huginn/commit/fe089a41579039204fd25deafeb96ea17a85dd03))
- **app:** fix new splashscreen giving errors in the browser ([72da35c](https://github.com/WerdoxDev/Huginn/commit/72da35cfe47d320c565e3f005557bc90f6732b50))
- **app:** fix splashscreen not liking oauth and event listening outside ([0193390](https://github.com/WerdoxDev/Huginn/commit/0193390f8a99f8789b91efff7ca8b7ea161597e1))
- **app:** minor fullscreen fixes and better loading handling ([c9cb52f](https://github.com/WerdoxDev/Huginn/commit/c9cb52fe5ddbf184ec46b47f58c1dcc5afab7a4d))
- **app:** notification sound is not playing ([d714b48](https://github.com/WerdoxDev/Huginn/commit/d714b48a06515c5749e27bc303c6a62f80bcef9d))
- **app:** quarkyness with the scrolling down and up ([0b246be](https://github.com/WerdoxDev/Huginn/commit/0b246be597945c3584ef055917c9981036c76301))
- **app:** remove commented code + set startup app config ([af666e0](https://github.com/WerdoxDev/Huginn/commit/af666e098c43518b09829b96f43c62ef5e286bc7))
- **app:** remove test button and update news.md ([df9517e](https://github.com/WerdoxDev/Huginn/commit/df9517e192d34c53a9f146ab3ac185867549c346))
- **app:** scroll is not anchored to the bottom when user resizes the window ([5cdd72a](https://github.com/WerdoxDev/Huginn/commit/5cdd72a708e13123b6af375ca44bfaa467e0944f))
- **app:** speaking state is not updating ([08ce2d0](https://github.com/WerdoxDev/Huginn/commit/08ce2d036025a3051a497f8330fad33bab04ef79))
- **app:** use highest audio quality ([f0133b5](https://github.com/WerdoxDev/Huginn/commit/f0133b5cf9112d60fb5d029b3419e9baa8768ad5))
- **app:** video progress/volume bar not letting go ([ec540ad](https://github.com/WerdoxDev/Huginn/commit/ec540ad94948279e58f6ddbd9116b3bf70a6d0f5))
- **app:** voice server wrong url ([a027052](https://github.com/WerdoxDev/Huginn/commit/a0270520da8a3be5365a17309ae98d905e6d46ec))
- **app:** volume audio worklet url is not correct in build ([30a1a34](https://github.com/WerdoxDev/Huginn/commit/30a1a3484db446d1ff187604049c31604553f732))
- revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.34.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.34.0...app@v0.34.1) (2025-05-16)

### Bug Fixes

- **app:** remove test button and update news.md ([df9517e](https://github.com/WerdoxDev/Huginn/commit/df9517e192d34c53a9f146ab3ac185867549c346))

## [0.34.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.33.1...app@v0.34.0) (2025-05-16)

### Features

- **app:** add first iteration of screensharing ([0871e59](https://github.com/WerdoxDev/Huginn/commit/0871e5961446ba934e24c5ae6e312f229ce43f64))

## [0.33.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.33.0...app@v0.33.1) (2025-05-12)

### Bug Fixes

- **app:** voice server wrong url ([a027052](https://github.com/WerdoxDev/Huginn/commit/a0270520da8a3be5365a17309ae98d905e6d46ec))

## [0.33.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.3...app@v0.33.0) (2025-05-12)

### Features

- **app:** add news modal ([ff266a7](https://github.com/WerdoxDev/Huginn/commit/ff266a7d6bbb9105c1409e889b16ee01b0cc4681))
- **app:** add voice muting and deafening functionality with fully working pausing & resuming ([ba2ddc2](https://github.com/WerdoxDev/Huginn/commit/ba2ddc24453b98d0e5104d77c64a01b3b9ba447a))

## [0.32.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.2...app@v0.32.3) (2025-05-05)

### Bug Fixes

- **app:** quarkyness with the scrolling down and up ([0b246be](https://github.com/WerdoxDev/Huginn/commit/0b246be597945c3584ef055917c9981036c76301))
- **app:** scroll is not anchored to the bottom when user resizes the window ([5cdd72a](https://github.com/WerdoxDev/Huginn/commit/5cdd72a708e13123b6af375ca44bfaa467e0944f))

## [0.32.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.1...app@v0.32.2) (2025-05-01)

### Bug Fixes

- **app:** notification sound is not playing ([d714b48](https://github.com/WerdoxDev/Huginn/commit/d714b48a06515c5749e27bc303c6a62f80bcef9d))

## [0.32.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.32.0...app@v0.32.1) (2025-04-30)

### Bug Fixes

- **api:** voice server ip is incorrect ([1773d28](https://github.com/WerdoxDev/Huginn/commit/1773d289c3962c4935c418556a361bcb49321048))

## [0.32.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.3...app@v0.32.0) (2025-04-30)

### Features

- **app:** add voice status component ([3f5542c](https://github.com/WerdoxDev/Huginn/commit/3f5542c9f1ad2b127c0e88b33b39133bea3288fd))

## [0.31.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.2...app@v0.31.3) (2025-04-27)

### Bug Fixes

- **app:** speaking state is not updating ([08ce2d0](https://github.com/WerdoxDev/Huginn/commit/08ce2d036025a3051a497f8330fad33bab04ef79))

## [0.31.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.1...app@v0.31.2) (2025-04-27)

### Bug Fixes

- **app:** add better speaking state management ([6cb415b](https://github.com/WerdoxDev/Huginn/commit/6cb415be47aac8767f95bc697999ad4e1738c18c))

## [0.31.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.31.0...app@v0.31.1) (2025-04-26)

### Bug Fixes

- **app:** volume audio worklet url is not correct in build ([30a1a34](https://github.com/WerdoxDev/Huginn/commit/30a1a3484db446d1ff187604049c31604553f732))

## [0.31.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.30.0...app@v0.31.0) (2025-04-26)

### Features

- **app:** add audio input threshold + speaking indicator + voice cleanups ([92f4cfb](https://github.com/WerdoxDev/Huginn/commit/92f4cfb30c9acfcf2d01c1187ee72bbd59eb0e2c))
- **app:** add audio settings + global voice state + audio level checking ([c933af6](https://github.com/WerdoxDev/Huginn/commit/c933af67bb9d618fc10eb73c054e2d25cc4ded10))

## [0.30.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.3...app@v0.30.0) (2025-04-14)

### Features

- **app:** better call management and persistent support ([acf0ad4](https://github.com/WerdoxDev/Huginn/commit/acf0ad4feb9ff8344f9c62d422d41e14f8ccf8cb))

## [0.29.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.2...app@v0.29.3) (2025-04-12)

### Bug Fixes

- **app:** disable multi range request for updater ([6a09215](https://github.com/WerdoxDev/Huginn/commit/6a092152c053158d05130cdfeb6ef2ad41598263))
- **app:** video progress/volume bar not letting go ([ec540ad](https://github.com/WerdoxDev/Huginn/commit/ec540ad94948279e58f6ddbd9116b3bf70a6d0f5))

## [0.29.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.1...app@v0.29.2) (2025-04-11)

### Bug Fixes

- **app:** dont open dev tools ([fe089a4](https://github.com/WerdoxDev/Huginn/commit/fe089a41579039204fd25deafeb96ea17a85dd03))

## [0.29.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.29.0...app@v0.29.1) (2025-04-11)

### Bug Fixes

- **app:** remove commented code + set startup app config ([af666e0](https://github.com/WerdoxDev/Huginn/commit/af666e098c43518b09829b96f43c62ef5e286bc7))

## [0.29.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.28.1...app@v0.29.0) (2025-04-11)

### Features

- **app:** electron github action [#1](https://github.com/WerdoxDev/Huginn/issues/1) ([df2f245](https://github.com/WerdoxDev/Huginn/commit/df2f245d3ab5cef4c16cb789379d19f1c67fadff))
- **app:** electron github action [#2](https://github.com/WerdoxDev/Huginn/issues/2) ([da24cbe](https://github.com/WerdoxDev/Huginn/commit/da24cbe670889fbc87bee5caaad5224474b1510a))
- **app:** finish migration to electron ([13650fb](https://github.com/WerdoxDev/Huginn/commit/13650fbd6b1bfaf2eaff70f62974361ffbcc34c7))
- **app:** half baked electron migration ([9c92b90](https://github.com/WerdoxDev/Huginn/commit/9c92b90bd1a600a97041e19dcc990860e8d9a968))

### Bug Fixes

- **app:** use highest audio quality ([f0133b5](https://github.com/WerdoxDev/Huginn/commit/f0133b5cf9112d60fb5d029b3419e9baa8768ad5))
- revert test versions back from electron migration ([d5c1fbc](https://github.com/WerdoxDev/Huginn/commit/d5c1fbcc184493bbcbe9dfcea3cefc3dc75ed904))

## [0.28.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.28.0...app@v0.28.1) (2025-04-06)

### Bug Fixes

- **app:** fix splashscreen not liking oauth and event listening outside ([0193390](https://github.com/WerdoxDev/Huginn/commit/0193390f8a99f8789b91efff7ca8b7ea161597e1))

## [0.28.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.27.0...app@v0.28.0) (2025-04-04)

### Features

- **app:** add a start call button to HomeTopbar ([b6baebd](https://github.com/WerdoxDev/Huginn/commit/b6baebd694a2fffe3d17aad2a0d4ef476b09dd6d))
- **app:** add custom notification sound ([06cd3f4](https://github.com/WerdoxDev/Huginn/commit/06cd3f4694850ed8d780ad2eafbd3c2e9c20cb82))
- **app:** add fullish ui for voice with buttons and indicators ([0642df1](https://github.com/WerdoxDev/Huginn/commit/0642df1613d1e582b823ca3448cd53423be08860))
- **app:** add very experimental video call ui ([1ac97d3](https://github.com/WerdoxDev/Huginn/commit/1ac97d37fa102cdc60b6c167b28bac95897a6d53))
- **app:** merged splashscreen into the main window ([dad146b](https://github.com/WerdoxDev/Huginn/commit/dad146b66d7dc965c01adedce15eead683394594))
- **app:** refactor all api related hooks and contexts to use stores instead ([05ea484](https://github.com/WerdoxDev/Huginn/commit/05ea4847e009865e75a2a03d077127ab97d9e338))
- **app:** some progress on the voice ui ([594e62b](https://github.com/WerdoxDev/Huginn/commit/594e62bb5a152d8d346f08b0f29ed06ed4331a81))

### Bug Fixes

- **app:** fix new splashscreen giving errors in the browser ([72da35c](https://github.com/WerdoxDev/Huginn/commit/72da35cfe47d320c565e3f005557bc90f6732b50))
- **app:** fix some websocket event issues ([fddc3e9](https://github.com/WerdoxDev/Huginn/commit/fddc3e965bb704906124a6e2e474ccf0e868a081))

## [0.27.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.26.0...app@v0.27.0) (2025-03-06)

### Features

- **app:** add inverted border radius to messages + show user's username on hover ([f545309](https://github.com/WerdoxDev/Huginn/commit/f545309aa6410871632f27df8d46c8cf4069b5a8))

### Bug Fixes

- **app:** add consistent rounded corners for attachments and embeds ([70bbe96](https://github.com/WerdoxDev/Huginn/commit/70bbe9659b6c956b28ef67ff6fa7ac2dabfd7f88))

## [0.26.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.25.0...app@v0.26.0) (2025-03-03)

### Features

- **app:** hide message link when it's the only content ([c228acf](https://github.com/WerdoxDev/Huginn/commit/c228acfb3c2c4a0b6dd03a833abf08173999c10a))
- **app:** make both embed and attachment use a consistent image / video component ([f231307](https://github.com/WerdoxDev/Huginn/commit/f231307c52decd911d7bb5aa50a493a999916ce7))

## [0.25.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.24.0...app@v0.25.0) (2025-03-03)

### Features

- **app:** add embed image and video only rendering ([af32433](https://github.com/WerdoxDev/Huginn/commit/af3243303718f734962cf7fc9df4635d451f63ae))

## [0.24.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.23.1...app@v0.24.0) (2025-03-02)

### Features

- **app:** add cancel button functionality to attachment sending ([a70cdcc](https://github.com/WerdoxDev/Huginn/commit/a70cdcc157250961fc59e1160d7016c0b594c637))
- **app:** add partial audio control to VideoPlayer ([367a0b2](https://github.com/WerdoxDev/Huginn/commit/367a0b23cd8cb8a06d203906fb27b57b0fefdf5c))

### Bug Fixes

- **app:** fix updating version text ([38226e5](https://github.com/WerdoxDev/Huginn/commit/38226e5c373ca7760b3902840376c97b204fe316))
- **app:** fix VidePlayer progress handle offset ([fef3576](https://github.com/WerdoxDev/Huginn/commit/fef35762605b370b6fe8067a2d3db9981127c9b3))
- **app:** video timeline looks a bit weird at the beginning ([6f5cc0a](https://github.com/WerdoxDev/Huginn/commit/6f5cc0a0176367adae3b49e8d58a960163e018d6))

## [0.23.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.23.0...app@v0.23.1) (2025-02-25)

### Bug Fixes

- **app:** fix updater not doing anything after success ([891d303](https://github.com/WerdoxDev/Huginn/commit/891d303d4c2341ebabad2812e5c1c4f4cf966023))

## [0.23.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.22.0...app@v0.23.0) (2025-02-25)

### Features

- add resource limiting to cdn + use bun alpine instead of debian ([2f9f8f7](https://github.com/WerdoxDev/Huginn/commit/2f9f8f799b2272eef0e097eefa1ea16128006835))
- **app:** add much better update handling + video rendering ([ca04b73](https://github.com/WerdoxDev/Huginn/commit/ca04b73a61348f565469774c711e9adc37cfa6ce))

## [0.22.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.21.0...app@v0.22.0) (2025-02-23)

### Features

- **app:** add attachments animation + quality reduction after a certain size ([0b96e3a](https://github.com/WerdoxDev/Huginn/commit/0b96e3a45e588cbcd17c94a3318b2984073c1461))

## [0.21.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.20.0...app@v0.21.0) (2025-02-19)

### Features

- **app:** add magnifying image capability ([e535c49](https://github.com/WerdoxDev/Huginn/commit/e535c4940c45d4e158eb4a456e4febc2a9661343))
- **app:** add magnifying loading indicator + orignal open button ([77f41e2](https://github.com/WerdoxDev/Huginn/commit/77f41e2589253580bd04a8065f23597d3285d5ba))

## [0.20.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.19.1...app@v0.20.0) (2025-02-18)

### Features

- **app:** copy pasting + drag dropping images for attachments ([69e37dd](https://github.com/WerdoxDev/Huginn/commit/69e37ddcc744ed85d7d5b076b7a443cf77966f5b))
- **app:** fix markdown hardbreak and link href ([bea96c6](https://github.com/WerdoxDev/Huginn/commit/bea96c6c8d3ed4b09987eacad3747e802cec20e5))

## [0.19.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.19.0...app@v0.19.1) (2025-02-15)

### Bug Fixes

- **app:** try to force a release ([960ad4d](https://github.com/WerdoxDev/Huginn/commit/960ad4d13bef13b35104347cde6c9dbf3b332529))

## [0.19.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.18.0...app@v0.19.0) (2025-02-15)

### Features

- **app:** add size string utility ([b3e6a15](https://github.com/WerdoxDev/Huginn/commit/b3e6a15aef5c9a09e027f354fdbf53f627cb55da))
- **app:** attachment uploading indicator ([a084675](https://github.com/WerdoxDev/Huginn/commit/a084675f204a60f83b2b36a740603a06f7054e73))
- **app:** remove auto imports + experimental ui for adding attachments ([aedff6c](https://github.com/WerdoxDev/Huginn/commit/aedff6cf1f08f8c2a193474006e1a5ea24afddd7))

### Bug Fixes

- **app:** updater is not retrying updates upon failure ([76561d6](https://github.com/WerdoxDev/Huginn/commit/76561d62e9376b40de851a7f94e8b8a39b2bf4a3))

## [0.18.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.17.0...app@v0.18.0) (2025-02-11)

### Features

- **app:** add experimental attachment rendering ([cd85462](https://github.com/WerdoxDev/Huginn/commit/cd854622417d51def99279808e3e3f159455398f))
- **app:** add status bar ([66cefb3](https://github.com/WerdoxDev/Huginn/commit/66cefb38090e10e3c4c6d556ba178a075a645d64))

### Bug Fixes

- **app:** initial connection state is handled incorrectly ([3c0fb73](https://github.com/WerdoxDev/Huginn/commit/3c0fb73218e5e58aea8f04226a9039852999c707))

## [0.17.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.16.0...app@v0.17.0) (2025-02-10)

### Features

- **app:** add untested Autostart capability ([c9b34aa](https://github.com/WerdoxDev/Huginn/commit/c9b34aae1488011aa225052d490cdde83bfabd37))

## [0.16.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.15.0...app@v0.16.0) (2025-02-09)

### Features

- **app:** add notification click event & goto channel functionality ([9d967a2](https://github.com/WerdoxDev/Huginn/commit/9d967a2ccddff3d2b658fd7b9974d616ba1dc036))

### Bug Fixes

- **server:** fix google callback redirect mismatch ([ba6bae6](https://github.com/WerdoxDev/Huginn/commit/ba6bae6c66306063f5a03a8238e34ff6893e5e96))

## [0.15.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.2...app@v0.15.0) (2025-02-08)

### Features

- **app:** add copy to code block + code language highlight ([978c19f](https://github.com/WerdoxDev/Huginn/commit/978c19fc50c3e0f689800238d1a9fcd24691cbea))

## [0.14.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.1...app@v0.14.2) (2025-02-07)

### Bug Fixes

- **app:** fix scrolling problem in ChannelMessages ([76047f8](https://github.com/WerdoxDev/Huginn/commit/76047f826027174b0968470b768c7c7224ab2c33))

## [0.14.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.14.0...app@v0.14.1) (2025-02-01)

### Bug Fixes

- **app:** small padding issue in MessageBox ([2d26459](https://github.com/WerdoxDev/Huginn/commit/2d264597c88c80953fcdcb7f722eb182d7821415))

## [0.14.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.13.0...app@v0.14.0) (2025-01-19)

### Features

- **app:** add native os notification with temporary icon ([076837a](https://github.com/WerdoxDev/Huginn/commit/076837a091ea0d704882f03b0ad250e86b9d64b4))
- **app:** MessageBox should push the messages up when new lines are added ([77fa712](https://github.com/WerdoxDev/Huginn/commit/77fa712f3ef6d1007b148b369e10e5dff7cfeee9))

## [0.13.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.12.0...app@v0.13.0) (2025-01-15)

### Features

- **app:** add code block in messages ([7e97835](https://github.com/WerdoxDev/Huginn/commit/7e97835acfe80f491a39c7d685c3a735ab064d7e))

## [0.12.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.11.0...app@v0.12.0) (2025-01-12)

### Features

- **app:** cleanup tokenizer and make it work on entire content and tokenize per line ([2833881](https://github.com/WerdoxDev/Huginn/commit/2833881fc63615ba2cde2f5d8abe1785f8a0857b))
- **app:** migrate to markdown-it for markdown. basically ditching huginn-tokenizer ([de682f8](https://github.com/WerdoxDev/Huginn/commit/de682f8b2d3b1ff43ddd45cf3a08705e5b3dfd11))

## [0.11.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.10.0...app@v0.11.0) (2025-01-11)

### Features

- **app:** fix all markdown problems ([701c708](https://github.com/WerdoxDev/Huginn/commit/701c70893b74ace03f6e89a8f73b0a64ef32abdc))

### Bug Fixes

- **app:** remove commeted code from tokenizer ([8f95023](https://github.com/WerdoxDev/Huginn/commit/8f9502325d846b02fa4aa90fc786595c17484c04))
- **app:** simplify link token content shifting ([24ea694](https://github.com/WerdoxDev/Huginn/commit/24ea69423b57808b60541361c98a4215ef6182c7))

## [0.10.0](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.3...app@v0.10.0) (2025-01-09)

### Features

- **app:** add fully nestable tokens to tokenizer ([93e36a8](https://github.com/WerdoxDev/Huginn/commit/93e36a8b5e72d31ca665ef0f9095f6a82e608ea5))

### Bug Fixes

- **app:** editor decorate function is not considering single char marks ([b5d329e](https://github.com/WerdoxDev/Huginn/commit/b5d329e20ea56fdf093a32af01c4a90931986008))
- **app:** tokenizer is adding nested tokens as rest tokens ([7b38144](https://github.com/WerdoxDev/Huginn/commit/7b38144423a605b5397b1329eb371c00b31b9a64))

## [0.9.3](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.2...app@v0.9.3) (2025-01-08)

### Bug Fixes

- **app:** link rendering with interfering markdown should be prioritized ([7d35818](https://github.com/WerdoxDev/Huginn/commit/7d3581874549abd387db06a1677c8c14a9f70e1f))

## [0.9.2](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.1...app@v0.9.2) (2025-01-07)

### Bug Fixes

- **app:** remove unused package ([c7374ff](https://github.com/WerdoxDev/Huginn/commit/c7374ffbbd7636e36421158696690a9575730683))

## [0.9.1](https://github.com/WerdoxDev/Huginn/compare/app@v0.9.0...app@v0.9.1) (2025-01-07)

### Bug Fixes

- **app:** remove private from package.json ([912b644](https://github.com/WerdoxDev/Huginn/commit/912b644c3e0cf904e492cbd191195a87b1bad0f2))

## [0.9.0](https://github.com/werdoxdev/huginn/compare/app@v0.8.0...app@v0.9.0) (2025-01-07)

### Features

- **app,server,shared:** remove timestamp from read state + message ack ws ([2e53347](https://github.com/werdoxdev/huginn/commit/2e53347aadde0f28a623b9c2fac94c6ede034efe))
- **app:** 0.6.1 version bump + much better markdown shortcut handling ([22528e5](https://github.com/werdoxdev/huginn/commit/22528e552698fcc17dd02ebd9121034c19ad5dcf))
- **app:** add a lowercase only option to HuginnInput ([ffed36d](https://github.com/werdoxdev/huginn/commit/ffed36db25f4416b8b626a668addc10554f242bf))
- **app:** add different chat modes ([d9cf062](https://github.com/werdoxdev/huginn/commit/d9cf062f1bf14d10a83c4296bec97a5de489cd2e))
- **app:** add link highlighting to messages ([5ce7276](https://github.com/werdoxdev/huginn/commit/5ce7276611f218168162a36b9c3857608ddc2114))
- **app:** add markdown shortcut (not entirely complete) ([d7f4548](https://github.com/werdoxdev/huginn/commit/d7f454814cbf6e9f3517ac3e6800a6deaae864db))
- **app:** add unstable embed rendering ([6eb268e](https://github.com/werdoxdev/huginn/commit/6eb268e94b339e4fed305ce676606480df8a45e9))
- **app:** animation for notifications ([b667879](https://github.com/werdoxdev/huginn/commit/b6678790d539e3ec0bb4f9dd0e7d16d87cb3a9d1))
- **app:** message_update event is now handeled ([c97073c](https://github.com/werdoxdev/huginn/commit/c97073c20907909c2286f5ff7e1d47649df320ea))
- **app:** notification button sorting ([7aae223](https://github.com/werdoxdev/huginn/commit/7aae223dab5dfe0b755af6a4fbb727281603b850))
- **app:** some renames + EmbedElement now renders with predefined size ([336aa4a](https://github.com/werdoxdev/huginn/commit/336aa4a14d7ccee62ede2f78a4002f39c02415b1))
- **server:** add lots of db optimization and better prisma arg handling ([c97c7e3](https://github.com/werdoxdev/huginn/commit/c97c7e3970fc8db980bf760852850d9c75928484))

### Bug Fixes

- action config change [#10](https://github.com/werdoxdev/huginn/issues/10) ([a01ed84](https://github.com/werdoxdev/huginn/commit/a01ed84645f931bd09fd2351df72c089547ddd9d))
- **app:** fix notification indicator reseting on read ([b8ebf3b](https://github.com/werdoxdev/huginn/commit/b8ebf3bccef44e9a11dbd84307b7152e0d6e0860))
- **app:** fix some logout issues + 0.5.0 release ([9325624](https://github.com/werdoxdev/huginn/commit/9325624ab591f9327147745f21fb384305e94e9e))
- **app:** message ack from ws should only be used when in other channels ([4e19c67](https://github.com/werdoxdev/huginn/commit/4e19c674cf2331ee1a80855789a5b208d5387164))
- **app:** message box clickable area was too small + line height was too low ([70eec3c](https://github.com/werdoxdev/huginn/commit/70eec3cf81839d132332a3eade11e831a43ad01b))
