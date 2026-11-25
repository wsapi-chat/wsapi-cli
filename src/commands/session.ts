import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { action, buildBody, handleError, makeClient } from '../runner.js';
import { writeBinary, printJson } from '../output.js';
import { CliError } from '../errors.js';

/**
 * Read a WebAuthn assertion (the browser's `PublicKeyCredential.toJSON()` output) from a
 * file, or from stdin when `source` is omitted or `-`.
 */
export function readPasskeyAssertion(source?: string): Record<string, unknown> {
  const fromStdin = !source || source === '-';
  if (fromStdin && process.stdin.isTTY) {
    throw new CliError('no assertion given: pass a JSON file path, or pipe the assertion JSON on stdin');
  }
  let raw: string;
  try {
    raw = readFileSync(fromStdin ? 0 : source, 'utf8');
  } catch (e) {
    throw new CliError(`failed to read assertion from ${fromStdin ? 'stdin' : source}: ${(e as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new CliError(`failed to parse assertion as JSON: ${(e as Error).message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CliError('assertion must be a JSON object (PublicKeyCredential.toJSON() output)');
  }
  return parsed as Record<string, unknown>;
}

export function registerSessionCommands(program: Command): void {
  const session = program.command('session').description('Manage WhatsApp session (login, logout, status)');

  session
    .command('status')
    .description('Get session status (isConnected, isLoggedIn, deviceId, passkeyStatus)')
    .action(action((c) => c.request('/session/status')));

  session
    .command('qr')
    .description('Fetch the pairing QR code')
    .option('-o, --output <file>', 'write the PNG to a file (default: stdout)')
    .option('--text', 'fetch the QR as a raw text string instead of a PNG')
    .action(async function (this: Command, options: { output?: string; text?: boolean }) {
      try {
        const c = makeClient(this);
        if (options.text) {
          const result = await c.request('/session/qr/text');
          printJson(result);
          return;
        }
        const { data } = await c.requestBinary('/session/qr', { accept: 'image/png' });
        writeBinary(data, options.output);
      } catch (e) {
        handleError(e);
      }
    });

  session
    .command('pair-code <phone>')
    .description('Get a pair code for a phone number')
    .action(
      action((c, cmd) => {
        const [phone] = cmd.args;
        return c.request(`/session/pair-code/${encodeURIComponent(phone)}`);
      }),
    );

  const passkey = session
    .command('passkey')
    .description('Passkey (WebAuthn) verification for accounts that require it to link a device');

  passkey
    .command('status')
    .description('Get the passkey verification state (status, challenge, origin, ...)')
    .action(action((c) => c.request('/session/passkey')));

  passkey
    .command('request')
    .description('Ask WhatsApp for a passkey challenge for the unpaired device')
    .action(action((c) => c.request('/session/passkey/request', { method: 'POST' })));

  passkey
    .command('submit [file]')
    .description('Submit a passkey assertion (PublicKeyCredential.toJSON() output) from a JSON file or stdin')
    .option('--data <json>', 'extra body fields as JSON; prefix with @ to load from file')
    .action(
      action((c, cmd) => {
        const [file] = cmd.args;
        return c.request('/session/passkey', {
          method: 'POST',
          body: buildBody(readPasskeyAssertion(file), cmd.opts().data),
        });
      }),
    );

  passkey
    .command('confirm')
    .description('Send the passkey confirmation (optional: the server now sends it automatically)')
    .action(
      action(async (c) => {
        await c.request('/session/passkey/confirm', { method: 'POST' });
        return { status: 'ok' };
      }),
    );

  session
    .command('logout')
    .description('Logout from WhatsApp')
    .action(
      action(async (c) => {
        await c.request('/session/logout', { method: 'POST' });
        return { status: 'ok' };
      }),
    );

  session
    .command('flush-history')
    .description('Asynchronously flush cached history sync messages')
    .action(action((c) => c.request('/session/flush-history', { method: 'POST' })));
}
