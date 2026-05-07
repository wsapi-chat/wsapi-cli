import type { Command } from 'commander';
import { action, handleError, makeClient } from '../runner.js';
import { writeBinary, printJson } from '../output.js';

export function registerSessionCommands(program: Command): void {
  const session = program.command('session').description('Manage WhatsApp session (login, logout, status)');

  session
    .command('status')
    .description('Get session status (isConnected, isLoggedIn, deviceId)')
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
