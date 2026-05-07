# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build        # Build with tsup (ESM, shebang banner, chmod +x)
npm run dev          # Watch mode for development
npm run type-check   # TypeScript type checking without emitting
```

## Test Commands

```bash
npm run test                                 # Run all tests once
npm run test:watch                           # Watch mode
npm run test:coverage                        # Coverage report
npx vitest tests/runner.test.ts              # Run a single test file
```

## Architecture

This is a **command-line tool**, not a library. The package is published to npm as
`@wsapichat/cli` and ships a single `wsapi` binary at `dist/index.js`.

### Core modules

- **`src/index.ts`** — Commander root program. Declares the global flags (`--profile`,
  `--api-key`, `--instance-id`, `--base-url`, `--config`) and delegates to each resource
  group's `register*Commands(program)` function.
- **`src/client.ts`** — `WsApiClient`. Thin `fetch` wrapper with `request<T>()` (JSON) and
  `requestBinary()` (PNG / media). Injects `X-Api-Key` and `X-Instance-Id` on every call,
  parses error bodies into `ApiError`.
- **`src/config.ts`** — Profile/env/flag resolution. Reads/writes `~/.wsapi/config.json`
  (or `$XDG_CONFIG_HOME/wsapi/config.json`).
- **`src/runner.ts`** — `action()` action wrapper, `buildBody()`, `parseJsonArg()`, and the
  centralised `handleError()` that exits 1 with structured output.
- **`src/output.ts`** — `printJson`, `writeBinary`, `readFileToBase64`.
- **`src/errors.ts`** — `CliError` (CLI/config errors) and `ApiError` (HTTP errors).

### Resource groups

Each file in `src/commands/` corresponds to one OpenAPI tag and exports a single
`register<Group>Commands(program: Command): void` function. Twelve groups exist today:
`session`, `messages`, `groups`, `communities`, `contacts`, `users`, `media`, `chats`,
`calls`, `newsletters`, `status`, plus the local `config` group for profile management.

## Code Patterns

- **Always include `--data <json>`** on body-bearing commands so users can extend the request
  with fields the CLI doesn't expose explicitly. `buildBody(flagFields, dataJson)` merges
  `--data` keys on top of typed flags.
- **204 No Content** — `request()` returns `undefined`; return `{ status: 'ok' }` from the
  handler so the user still sees a confirmation on stdout.
- **Binary endpoints** use `client.requestBinary(...)` + `writeBinary(buf, output)` and
  expose `--output <file>` (default: stdout).
- **Local file uploads** — accept `--data-file <path>` and run it through `readFileToBase64`.
- **WhatsApp IDs** — users `{phone}@s.whatsapp.net`, groups `{id}@g.us`, newsletters
  `{id}@newsletter`.

## OpenAPI as the source of truth

The OpenAPI spec lives in [wsapi-docs](https://github.com/wsapi-chat/wsapi-docs); the file is
also vendored in sibling repositories. When extending the CLI, find the matching tag in the
spec, then add a command that mirrors its parameters.
