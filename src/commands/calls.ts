import type { Command } from 'commander';
import { action, buildBody } from '../runner.js';

export function registerCallsCommands(program: Command): void {
  const calls = program.command('calls').description('Call management');

  calls
    .command('reject <callId>')
    .description('Reject an incoming call')
    .requiredOption('--caller-id <jid>', 'JID of the caller')
    .option('--data <json>', 'extra body fields as JSON; prefix with @ to load from file')
    .action(
      action(async (c, cmd) => {
        const [callId] = cmd.args;
        await c.request(`/calls/${encodeURIComponent(callId)}/reject`, {
          method: 'POST',
          body: buildBody({ callerId: cmd.opts().callerId }, cmd.opts().data),
        });
        return { status: 'ok' };
      }),
    );
}
