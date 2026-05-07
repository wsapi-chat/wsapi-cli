# AGENTS.md

Guidance for AI agents working with this codebase.

## Build & Test

```bash
npm run build          # Build with tsup (ESM to dist/)
npm run test           # Run all tests (vitest)
npm run lint           # ESLint
npm run format:check   # Prettier check
npm run type-check     # TypeScript type checking
```

## Project Structure

- `src/index.ts` — Commander root program; registers each resource group
- `src/client.ts` — `fetch`-based HTTP client; injects `X-Api-Key` and `X-Instance-Id`
- `src/config.ts` — Profile/env/flag resolution and config-file I/O
- `src/runner.ts` — `action()` wrapper, `buildBody()`, arg parsers, error handler
- `src/commands/` — One file per OpenAPI tag + a `config` command for profile management
- `src/output.ts` — JSON, binary, and base64 helpers
- `src/errors.ts` — `CliError` and `ApiError`
- `tests/` — Vitest unit tests

## Key Patterns

### Command shape

Every command shares the same shape:

```ts
.command('something')
  .description('...')
  .requiredOption('--to <jid>', '...')
  .option('--data <json>', 'extra body fields as JSON; prefix with @ to load from file')
  .action(action((c, cmd) => {
    const o = cmd.opts();
    return c.request('/path', {
      method: 'POST',
      body: buildBody({ to: o.to /* ... */ }, o.data),
    });
  }));
```

The `action()` helper handles errors, prints any returned value as JSON, and exits with the
right code.

### `--data` escape hatch

Every body-bearing command must include `--data <json>`. `buildBody(flags, data)` merges JSON
from `--data` on top of the typed flags so users can extend or override the body without us
having to expose every field.

### 204 No Content

When the API returns 204, `request()` resolves to `undefined` (which `action()` would skip
printing). To still confirm to the user, return `{ status: 'ok' }` from the handler.

### Binary endpoints

Use `client.requestBinary(...)` plus `writeBinary(buf, output)` from `src/output.ts`. The
`--output <file>` flag is the convention for choosing file vs. stdout.

### Adding a new resource group

1. Create `src/commands/<group>.ts` with a `register<Group>Commands(program)` function.
2. Wire it up in `src/index.ts`.
3. Mirror the conventions above — typed flags + `--data` for any body, 204 → `{status:'ok'}`,
   `requestBinary` for binary responses.

## WhatsApp IDs

- Users: `{phone}@s.whatsapp.net`
- Groups: `{id}@g.us`
- Newsletters: `{id}@newsletter`
