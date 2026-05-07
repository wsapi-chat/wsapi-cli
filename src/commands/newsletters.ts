import type { Command } from 'commander';
import { action, buildBody } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerNewslettersCommands(program: Command): void {
  const n = program.command('newsletters').description('Newsletter / channel management');

  n.command('list')
    .description('List subscribed newsletters')
    .action(action((c) => c.request('/newsletters')));

  n.command('get <id>')
    .description('Get newsletter info by JID')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/newsletters/${encodeURIComponent(id)}`);
      }),
    );

  n.command('invite-info <code>')
    .description('Look up a newsletter by invite code')
    .action(
      action((c, cmd) => {
        const [code] = cmd.args;
        return c.request(`/newsletters/invite/${encodeURIComponent(code)}`);
      }),
    );

  n.command('create')
    .description('Create a newsletter')
    .requiredOption('--name <name>', 'newsletter name')
    .option('--description <text>', 'newsletter description')
    .option('--picture-file <path>', 'JPEG file for the newsletter picture')
    .option('--picture-base64 <base64>', 'base64 JPEG picture')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        const picture = o.pictureFile ? await readFileToBase64(o.pictureFile) : o.pictureBase64;
        return c.request('/newsletters', {
          method: 'POST',
          body: buildBody(
            {
              name: o.name,
              description: o.description,
              picture,
            },
            o.data,
          ),
        });
      }),
    );

  n.command('subscribe <id>')
    .description('Subscribe to a newsletter')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/newsletters/${encodeURIComponent(id)}/subscription`, {
          method: 'PUT',
          body: { subscribed: true },
        });
        return { status: 'ok' };
      }),
    );

  n.command('unsubscribe <id>')
    .description('Unsubscribe from a newsletter')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/newsletters/${encodeURIComponent(id)}/subscription`, {
          method: 'PUT',
          body: { subscribed: false },
        });
        return { status: 'ok' };
      }),
    );

  n.command('mute <id>')
    .description('Mute a newsletter')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/newsletters/${encodeURIComponent(id)}/mute`, {
          method: 'PUT',
          body: { mute: true },
        });
        return { status: 'ok' };
      }),
    );

  n.command('unmute <id>')
    .description('Unmute a newsletter')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/newsletters/${encodeURIComponent(id)}/mute`, {
          method: 'PUT',
          body: { mute: false },
        });
        return { status: 'ok' };
      }),
    );
}
