import type { Command } from 'commander';
import { action, buildBody, commaList } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerUsersCommands(program: Command): void {
  const u = program.command('users').description('Account management, user lookup, and profile');

  u.command('me')
    .description('Get own profile info')
    .action(action((c) => c.request('/users/me/profile')));

  u.command('update-me')
    .description('Update own profile (name, status, picture)')
    .option('--name <name>', 'display name')
    .option('--status <text>', 'status text')
    .option('--picture-file <path>', 'JPEG file (base64-encoded for upload)')
    .option('--picture-base64 <base64>', 'base64-encoded JPEG')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        const picture = o.pictureFile ? await readFileToBase64(o.pictureFile) : o.pictureBase64;
        await c.request('/users/me/profile', {
          method: 'PUT',
          body: buildBody({ name: o.name, status: o.status, picture }, o.data),
        });
        return { status: 'ok' };
      }),
    );

  u.command('set-presence')
    .description('Set presence to available or unavailable')
    .requiredOption('--presence <state>', 'available | unavailable')
    .action(
      action(async (c, cmd) => {
        await c.request('/users/me/presence', {
          method: 'PUT',
          body: { presence: cmd.opts().presence },
        });
        return { status: 'ok' };
      }),
    );

  u.command('privacy')
    .description('Get privacy settings')
    .action(action((c) => c.request('/users/me/privacy')));

  u.command('set-privacy')
    .description('Update a single privacy setting')
    .requiredOption('--setting <name>', 'groupadd | last | status | profile | readreceipts | online | calladd')
    .requiredOption('--value <value>', 'all | contacts | contact_blacklist | match_last_seen | known | none')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/users/me/privacy', {
          method: 'PUT',
          body: { setting: o.setting, value: o.value },
        });
      }),
    );

  u.command('check <phone>')
    .description('Check if a phone number is on WhatsApp')
    .action(
      action((c, cmd) => {
        const [phone] = cmd.args;
        return c.request(`/users/${encodeURIComponent(phone)}/check`);
      }),
    );

  u.command('check-bulk')
    .description('Bulk check phone numbers on WhatsApp')
    .requiredOption('--phones <list>', 'comma-separated phone numbers', commaList)
    .action(
      action((c, cmd) => {
        return c.request('/users/check', {
          method: 'POST',
          body: { phones: cmd.opts().phones },
        });
      }),
    );

  u.command('profile <phone>')
    .description("Get a user's public profile info")
    .action(
      action((c, cmd) => {
        const [phone] = cmd.args;
        return c.request(`/users/${encodeURIComponent(phone)}/profile`);
      }),
    );
}
