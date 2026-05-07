# Contributing to the WSApi CLI

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)
- [Git](https://git-scm.com/)

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/wsapi-cli.git
   cd wsapi-cli
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Commands

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run build`         | Build with tsup (ESM output to `dist/`)   |
| `npm run dev`           | Watch mode for development                |
| `npm run test`          | Run all tests                             |
| `npm run test:watch`    | Run tests in watch mode                   |
| `npm run test:coverage` | Run tests with coverage                   |
| `npm run lint`          | Run ESLint                                |
| `npm run lint:fix`      | Run ESLint with auto-fix                  |
| `npm run format`        | Format code with Prettier                 |
| `npm run format:check`  | Check formatting                          |
| `npm run type-check`    | TypeScript type checking without emitting |

## Project Structure

| Directory       | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `src/index.ts`  | Commander root program; wires resource groups together                        |
| `src/client.ts` | Thin `fetch` wrapper that injects `X-Api-Key` and `X-Instance-Id` headers     |
| `src/config.ts` | Profile/env/flag resolution and read/write of the local config file           |
| `src/runner.ts` | Shared action helper, error handler, and arg/body parsers                     |
| `src/commands/` | One file per OpenAPI tag (messages, groups, chats, …) plus the `config` group |
| `src/output.ts` | JSON output, binary stdout/file output, base64 file helpers                   |
| `src/errors.ts` | `CliError` and `ApiError`                                                     |
| `tests/`        | Vitest unit tests for pure helpers                                            |

## Key Patterns

### Adding a new command

1. Identify the OpenAPI tag the endpoint belongs to and open the corresponding file in
   `src/commands/`.
2. Add a `commandName` block with `requiredOption`/`option` declarations for the typed flags
   you want to expose.
3. The action should look like:
   ```ts
   .action(action((c, cmd) => {
     const o = cmd.opts();
     return c.request('/path', {
       method: 'POST',
       body: buildBody({ ...flags }, o.data),
     });
   }))
   ```
4. Always include a `--data <json>` option for the body. `buildBody` merges it on top of the
   typed flags so unknown fields are not blocking.
5. For commands that return 204 No Content, await the request and return `{ status: 'ok' }` so
   the user gets confirmation on stdout.

### Local file uploads

Media commands accept either `--url <url>` (server-side fetch) or `--data-file <path>` (read
the file and base64-encode it inline). Use the `readFileToBase64` helper from `src/output.ts`.

### Binary downloads

Endpoints that return binary content (`session qr` PNG, `media download`) should call
`client.requestBinary(...)` and pipe the result through `writeBinary(buf, output)` from
`src/output.ts`.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `test:` — adding or updating tests
- `refactor:` — code refactoring
- `chore:` — maintenance tasks

## Submitting a Pull Request

1. Ensure your code builds: `npm run build`
2. Ensure all tests pass: `npm run test`
3. Ensure linting passes: `npm run lint`
4. Ensure formatting is correct: `npm run format:check`
5. Push your branch and open a pull request against `main`

## Reporting Issues

Use the [GitHub issue templates](https://github.com/wsapi-chat/wsapi-cli/issues/new/choose) to
report bugs or request features.
