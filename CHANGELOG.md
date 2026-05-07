# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.2] - 2026-05-07

### Fixed

- `wsapi --version` now reflects the installed package version. Previously it was hardcoded to `0.1.0` in `src/index.ts` and never updated by the release workflow's `npm version` step.

### Changed

- Build: `tsup` injects `__WSAPI_CLI_VERSION__` from `package.json` at build time so the bundled binary stays in sync with the npm version automatically.

### Added

- `tests/version.test.ts` regression test that runs `dist/index.js --version` and asserts it matches `package.json#version`.

## [0.1.1] - 2026-05-07

### Changed

- Bump `commander` 12 → 14.
- Bump `typescript` 5.9 → 6.0 (added explicit `"types": ["node"]` to `tsconfig.json` since TS 6 no longer auto-discovers `@types/node`).
- Bump `@eslint/js` 9.39 → 10.0 to align with `eslint` 10.
- Bump `softprops/action-gh-release` v2 → v3 in the release workflow.
- CI: added `npm run type-check` to the Lint & Format job so future TS regressions don't slip through.

## [0.1.0] - 2026-05-07

### Added

- Initial release.
- `wsapi` binary built on Commander.js, exposing every endpoint in the WSAPI public OpenAPI spec.
- Twelve resource groups: `session`, `messages`, `groups`, `communities`, `contacts`, `users`, `media`, `chats`, `calls`, `newsletters`, `status`, plus a `config` group for managing local profiles.
- Layered configuration: CLI flags, `WSAPI_*` environment variables, and named profiles in `~/.wsapi/config.json` (or `$XDG_CONFIG_HOME/wsapi/config.json`).
- `--data <json>` escape hatch on every body-bearing command, with `@file.json` support.
- Local-file uploads (`--data-file`) for media, document, sticker, image and video status, group/community/newsletter pictures, and own profile picture.
- Binary download support for `session qr` (PNG) and `media download`, writing to `--output` or stdout.
- JSON output to stdout and structured JSON error reporting on stderr for easy piping into `jq`.
