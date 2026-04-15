# Changelog

## [0.1.6](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.5...fff-pi-v0.1.6) (2026-04-15)


### Features

* make update checks non-blocking ([de5f813](https://github.com/MonsieurBarti/fff-pi/commit/de5f81392fc9aaf32773718b13906f7638388889))
* make update checks non-blocking ([966fb4b](https://github.com/MonsieurBarti/fff-pi/commit/966fb4bbfc91d4a32057eacee8fb5ebfd42b354c))

## [0.1.5](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.4...fff-pi-v0.1.5) (2026-04-12)


### Bug Fixes

* use explicit .js suffixes on relative imports (esm compliance) ([79b4d0a](https://github.com/MonsieurBarti/fff-pi/commit/79b4d0ac902262962d84e1905c8a65856f90eb53))
* use explicit .js suffixes on relative imports (esm compliance) ([9464cb6](https://github.com/MonsieurBarti/fff-pi/commit/9464cb661fa33eeff52e729b96557a7b2582e7b1))

## [0.1.4](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.3...fff-pi-v0.1.4) (2026-04-12)


### Features

* add abortsignal support to fff-service initialize ([f882338](https://github.com/MonsieurBarti/fff-pi/commit/f882338c94da61c700e19e61784cf72956d469e5))
* add library-style named exports for fff-service and factories ([dc0e56b](https://github.com/MonsieurBarti/fff-pi/commit/dc0e56b9f5d58c8f353d07cad020440dbba0eccb))
* expose library-style API for use by other PI extensions ([724a599](https://github.com/MonsieurBarti/fff-pi/commit/724a599cacad1c73e60295c4088014d644ffff0d))
* re-export hook-definition type for parity ([35caf5e](https://github.com/MonsieurBarti/fff-pi/commit/35caf5e79c766bed123b23cd174e8d6cf6779e4d))

## [0.1.3](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.2...fff-pi-v0.1.3) (2026-04-11)


### Features

* add update notification for fff-pi extension ([6de693c](https://github.com/MonsieurBarti/fff-pi/commit/6de693ca90de9c273023bb73ef3b989d4a90425d))
* add update notification for fff-pi extension ([5614602](https://github.com/MonsieurBarti/fff-pi/commit/5614602d343fc1a6c46873bd4fd4ae17b97d8047))

## [0.1.2](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.1...fff-pi-v0.1.2) (2026-04-11)


### Features

* add read-only classification to tool definitions ([9980d0b](https://github.com/MonsieurBarti/fff-pi/commit/9980d0b2e978c088682b1501a4d1729afb5ffeee))
* add read-only classification to tool definitions ([999a480](https://github.com/MonsieurBarti/fff-pi/commit/999a4806e81b299a3ae02b0d559c119e11327248))

## [0.1.1](https://github.com/MonsieurBarti/fff-pi/compare/fff-pi-v0.1.0...fff-pi-v0.1.1) (2026-04-10)


### Features

* add @ff-labs/fff-node dependency and test fixture ([995ede9](https://github.com/MonsieurBarti/fff-pi/commit/995ede9304cb02f50ce6c850e956dad14e373b87))
* add /fff-reindex command and wire command factory ([3d9804f](https://github.com/MonsieurBarti/fff-pi/commit/3d9804f9748a06eb2f09c3847180973ca45d23fe))
* add /fff-status command ([f56d0f0](https://github.com/MonsieurBarti/fff-pi/commit/f56d0f0e3e6d5bffbff2f2455ade09527be89db6))
* add domain types and config loading ([173c217](https://github.com/MonsieurBarti/fff-pi/commit/173c2179db0cda2437fe7bed4ac5e80619f4c382))
* add fff-service find method for fuzzy file search ([62a587b](https://github.com/MonsieurBarti/fff-pi/commit/62a587b8ecbc330c7016a3e68af49d3457b5f03d))
* add fff-service with lifecycle management ([8a067c2](https://github.com/MonsieurBarti/fff-pi/commit/8a067c2b37a85dd4389c0a8ccbd254f5d89104ad))
* add fffservice.grep for content search ([5f4ec79](https://github.com/MonsieurBarti/fff-pi/commit/5f4ec797ca510c3da777c486fcdc375999a76ba2))
* add git refresh hook and wire hook factory ([7c62007](https://github.com/MonsieurBarti/fff-pi/commit/7c62007721ba407326439ef0f509a1cd1f7301f9))
* add hook types and factory scaffold ([6df909d](https://github.com/MonsieurBarti/fff-pi/commit/6df909d5a5a2b13910eacfa2d26115d3ac5567cb))
* add search method with auto-mode detection to fff-service ([d1bd591](https://github.com/MonsieurBarti/fff-pi/commit/d1bd5910fb29b8ebd291790128f7700c78a80ecd))
* add tff-fff_find tool ([9e59f86](https://github.com/MonsieurBarti/fff-pi/commit/9e59f862a3712ad903bbff26393a25ad7c5cf82f))
* add tff-fff_grep tool ([e433fb5](https://github.com/MonsieurBarti/fff-pi/commit/e433fb5ccc8e5701f90f5222a0c1f1bdca08ac18))
* add tff-fff_search tool and wire tool factory ([a43dc8f](https://github.com/MonsieurBarti/fff-pi/commit/a43dc8f0fcc173987c70a5475731c8fd98679762))
* add tool_call interception hook for glob/grep ([52fb623](https://github.com/MonsieurBarti/fff-pi/commit/52fb6231fba41aa3a53c8de97ed2bb6508351a8d))
* add tool_result frecency tracking hook ([dbed4cb](https://github.com/MonsieurBarti/fff-pi/commit/dbed4cb4cd3941bf5898bb4c15f45210231467f8))
* integrate fff SIMD search engine ([aa1befd](https://github.com/MonsieurBarti/fff-pi/commit/aa1befde6710c747bf4bf3bcb683a4358c0ff0bd))
* scaffold fff-pi extension template ([e9d4deb](https://github.com/MonsieurBarti/fff-pi/commit/e9d4deba834d286d7684070a3fe52db82dd802a5))
* wire extension entry point with tools, commands, and hooks ([5255646](https://github.com/MonsieurBarti/fff-pi/commit/525564602cbce0b69eb5439c66bd9f5947ed894d))


### Bug Fixes

* address code review findings ([d0b203b](https://github.com/MonsieurBarti/fff-pi/commit/d0b203ba82d4b196548e0e4fc6e5f7d40870cf26))
* address critical and major review findings ([042347f](https://github.com/MonsieurBarti/fff-pi/commit/042347fec1459428d47e521f162548812ed8e037))

## Changelog
