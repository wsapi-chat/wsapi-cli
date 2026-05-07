# WSApi CLI

[![npm](https://img.shields.io/npm/v/@wsapichat/cli?logo=npm)](https://www.npmjs.com/package/@wsapichat/cli)
[![CI](https://github.com/wsapi-chat/wsapi-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/wsapi-chat/wsapi-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A command-line client for the [WSAPI](https://wsapi.chat) WhatsApp API. Wraps every REST endpoint
in the WSAPI public OpenAPI spec under a single `wsapi` binary, written in TypeScript on top of
[Commander.js](https://github.com/tj/commander.js).

This is an independent API and is not affiliated with META or WhatsApp.

## Features

- **Full REST coverage** — every endpoint across messages, groups, communities, contacts, users,
  chats, calls, newsletters, status, media, and session management.
- **JSON in, JSON out** — every command emits JSON to stdout, ready to pipe into `jq`, `xargs`,
  scripts, or your shell of choice.
- **Layered configuration** — flags, environment variables, and named profiles in
  `~/.wsapi/config.json`. Switch between staging and production with `--profile`.
- **`--data` escape hatch** — every body-bearing command accepts a `--data <json>` flag that
  merges arbitrary fields on top of the typed flags, so you're never blocked when the spec adds
  a new field.
- **Local file uploads** — pass `--data-file ./path` for any media command and the CLI will
  base64-encode it inline.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A WSAPI instance ID and API key

### Installation

```bash
npm install -g @wsapichat/cli
```

Verify the installation:

```bash
wsapi --version
wsapi --help
```

---

## Usage

### 1. Configure credentials

`wsapi` resolves credentials in this order, first match wins:

1. CLI flags: `--api-key`, `--instance-id`, `--base-url`
2. Environment variables: `WSAPI_API_KEY`, `WSAPI_INSTANCE_ID`, `WSAPI_BASE_URL`
3. The named profile from `--profile <name>` or `WSAPI_PROFILE`
4. The `defaultProfile` in the config file

Use the built-in `wsapi config` commands to manage profiles:

```bash
# Create a profile and mark it as the default
wsapi config set-profile prod \
  --api-key "ws_live_..." \
  --instance-id "ins_..." \
  --default

wsapi config list                # list profile names
wsapi config use staging         # switch the default
wsapi config rm staging          # delete a profile
wsapi config path                # print the config file path
```

The config file is stored at `~/.wsapi/config.json` (or `$XDG_CONFIG_HOME/wsapi/config.json`),
mode 0600.

You can also bypass the config file entirely with environment variables:

```bash
export WSAPI_API_KEY="ws_live_..."
export WSAPI_INSTANCE_ID="ins_..."

wsapi session status
```

### 2. Pair a device

```bash
# Save the QR PNG to a file and scan it with WhatsApp
wsapi session qr --output qr.png

# Or get the raw QR string (useful for rendering yourself)
wsapi session qr --text

# Pair via phone-number code instead of QR
wsapi session pair-code 15551234567

# Confirm the device is paired
wsapi session status
```

### 3. Send messages

```bash
# Plain text
wsapi messages text \
  --to 15551234567@s.whatsapp.net \
  --text "Hello from the CLI"

# Image by URL with a caption
wsapi messages image \
  --to 15551234567@s.whatsapp.net \
  --url https://example.com/cat.jpg \
  --caption "cat"

# Image from a local file
wsapi messages image \
  --to 15551234567@s.whatsapp.net \
  --data-file ./photo.jpg \
  --view-once

# Document with a custom filename
wsapi messages document \
  --to 15551234567@s.whatsapp.net \
  --data-file ./report.pdf \
  --filename "Q1 report.pdf" \
  --caption "this quarter"

# React to a message
wsapi messages react 3EB0... --to 15551234567@s.whatsapp.net --reaction "👍"
```

### 4. Group operations

```bash
# List joined groups, then print just their names
wsapi groups list | jq -r '.[].name'

# Get group info
wsapi groups get 1234567890@g.us

# Add a participant
wsapi groups update-participants 1234567890@g.us \
  --action add \
  --participants 15551234567@s.whatsapp.net
```

### 5. Download inbound media

```bash
wsapi media download <mediaId> --output incoming.jpg
```

Without `--output`, binary endpoints write to stdout. Pipe it into a file or another command.

---

## Command overview

| Group         | Examples                                                                                                                                                                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session`     | `status`, `qr`, `qr --text`, `pair-code <phone>`, `logout`, `flush-history`                                                                                                                                                                                                                              |
| `messages`    | `text`, `image`, `video`, `audio`, `voice`, `document`, `sticker`, `contact`, `location`, `link`, `react`, `edit`, `read`, `star`, `pin`, `delete`, `delete-for-me`                                                                                                                                      |
| `groups`      | `list`, `get`, `create`, `set-name`, `set-description`, `set-picture`, `leave`, `participants`, `update-participants`, `invite-link`, `reset-invite`, `set-announce`, `set-locked`, `set-join-approval`, `set-member-add-mode`, `join-link`, `join-invite`, `invite-info`, `requests`, `update-requests` |
| `communities` | `list`, `get`, `create`, `leave`, `set-name`, `set-description`, `set-picture`, `set-locked`, `participants`, `update-participants`, `invite-link`, `reset-invite`, `subgroups`, `create-subgroup`, `link-subgroup`, `unlink-subgroup`                                                                   |
| `contacts`    | `list`, `get`, `create`, `sync`, `blocklist`, `block`, `unblock`                                                                                                                                                                                                                                         |
| `users`       | `me`, `update-me`, `set-presence`, `privacy`, `set-privacy`, `check`, `check-bulk`, `profile`                                                                                                                                                                                                            |
| `media`       | `download <id> --output <file>`                                                                                                                                                                                                                                                                          |
| `chats`       | `list`, `get`, `delete`, `picture`, `business`, `set-presence`, `subscribe-presence`, `set-ephemeral`, `mute`, `pin`, `archive`, `read`, `request-history`, `clear`                                                                                                                                      |
| `calls`       | `reject`                                                                                                                                                                                                                                                                                                 |
| `newsletters` | `list`, `get`, `invite-info`, `create`, `subscribe`, `unsubscribe`, `mute`, `unmute`                                                                                                                                                                                                                     |
| `status`      | `privacy`, `text`, `image`, `video`, `delete`                                                                                                                                                                                                                                                            |

Run `wsapi <group> --help` and `wsapi <group> <command> --help` for the full list of options
on each command.

---

## Escape hatch: `--data`

Every body-bearing command supports a `--data <json>` flag whose JSON object is merged on top
of the typed flags. Keys in `--data` win over flags, so it's both an extension point (for fields
the CLI doesn't expose explicitly) and a full-body override.

```bash
# Add a field the CLI doesn't expose
wsapi messages text \
  --to 15551234567@s.whatsapp.net \
  --text "hi" \
  --data '{"someNewField":true}'

# Load the body from a file
wsapi messages text \
  --to 15551234567@s.whatsapp.net \
  --text "ignored" \
  --data @./body.json
```

---

## Exit codes & error format

- `0` — success
- `1` — any error (config, API, network, validation)

API errors are emitted to stderr as JSON:

```json
{
  "error": "device not paired",
  "status": 403,
  "body": { "status": 403, "detail": "device not paired" }
}
```

CLI/config errors are plain text on stderr:

```
error: missing API key. Set WSAPI_API_KEY, pass --api-key, or run `wsapi config set-profile`.
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
