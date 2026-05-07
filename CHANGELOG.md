# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
