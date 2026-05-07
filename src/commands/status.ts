import type { Command } from 'commander';
import { action, buildBody } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerStatusCommands(program: Command): void {
  const s = program.command('status').description('Status / story posting');

  s.command('privacy')
    .description('Get status broadcast privacy settings')
    .action(action((c) => c.request('/status/privacy')));

  s.command('text')
    .description('Post a text status')
    .requiredOption('--text <text>', 'status text')
    .action(
      action((c, cmd) => {
        return c.request('/status/text', {
          method: 'POST',
          body: { text: cmd.opts().text },
        });
      }),
    );

  for (const kind of ['image', 'video'] as const) {
    s.command(kind)
      .description(`Post a${kind === 'image' ? 'n' : ''} ${kind} status`)
      .option('--url <url>', 'URL of the media')
      .option('--data-file <path>', 'local file to upload as base64')
      .option('--mime-type <type>', 'MIME type')
      .option('--caption <text>', 'caption')
      .option('--data <json>', 'extra body fields as JSON')
      .action(
        action(async (c, cmd) => {
          const o = cmd.opts();
          const data = o.dataFile ? await readFileToBase64(o.dataFile) : undefined;
          return c.request(`/status/${kind}`, {
            method: 'POST',
            body: buildBody(
              {
                url: o.url,
                data,
                mimeType: o.mimeType,
                caption: o.caption,
              },
              o.data,
            ),
          });
        }),
      );
  }

  s.command('delete <messageId>')
    .description('Delete (revoke) a previously-posted status')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        await c.request(`/status/${encodeURIComponent(messageId)}/delete`, { method: 'POST' });
        return { status: 'ok' };
      }),
    );
}
