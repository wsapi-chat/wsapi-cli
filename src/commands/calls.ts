import type { Command } from 'commander';
import { action } from '../runner.js';

export function registerCallsCommands(program: Command): void {
  const calls = program.command('calls').description('Call management');

  calls
    .command('reject <callId>')
    .description('Reject an incoming call')
    .requiredOption('--caller-id <jid>', 'JID of the caller')
    .action(
      action(async (c, cmd) => {
        const [callId] = cmd.args;
        await c.request(`/calls/${encodeURIComponent(callId)}/reject`, {
          method: 'POST',
          body: { callerId: cmd.opts().callerId },
        });
        return { status: 'ok' };
      }),
    );
}
