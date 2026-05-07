import type { Command } from 'commander';
import { action, buildBody, commaList } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerGroupsCommands(program: Command): void {
  const g = program.command('groups').description('Group management');

  g.command('list')
    .description('List joined groups')
    .action(action((c) => c.request('/groups')));

  g.command('get <id>')
    .description('Get group info by JID')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/groups/${encodeURIComponent(id)}`);
      }),
    );

  g.command('create')
    .description('Create a new group')
    .requiredOption('--name <name>', 'group name')
    .requiredOption('--participants <jids>', 'comma-separated participant JIDs', commaList)
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/groups', {
          method: 'POST',
          body: buildBody({ name: o.name, participants: o.participants }, o.data),
        });
      }),
    );

  g.command('set-name <id>')
    .description('Set group name')
    .requiredOption('--name <name>', 'new group name')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/groups/${encodeURIComponent(id)}/name`, {
          method: 'PUT',
          body: { name: cmd.opts().name },
        });
        return { status: 'ok' };
      }),
    );

  g.command('set-description <id>')
    .description('Set group description')
    .option('--description <text>', 'description (omit for empty)')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/groups/${encodeURIComponent(id)}/description`, {
          method: 'PUT',
          body: { description: cmd.opts().description ?? '' },
        });
        return { status: 'ok' };
      }),
    );

  g.command('set-picture <id>')
    .description('Set group picture (JPEG)')
    .option('--data-file <path>', 'JPEG file to upload (base64 encoded)')
    .option('--data-base64 <base64>', 'base64-encoded JPEG image')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        const data = o.dataFile ? await readFileToBase64(o.dataFile) : o.dataBase64;
        return c.request(`/groups/${encodeURIComponent(id)}/picture`, {
          method: 'POST',
          body: { data },
        });
      }),
    );

  g.command('leave <id>')
    .description('Leave a group')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/groups/${encodeURIComponent(id)}/leave`, { method: 'POST' });
        return { status: 'ok' };
      }),
    );

  g.command('participants <id>')
    .description('Get group participants')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/groups/${encodeURIComponent(id)}/participants`);
      }),
    );

  g.command('update-participants <id>')
    .description('Add, remove, promote, or demote participants')
    .requiredOption('--action <action>', 'add | remove | promote | demote')
    .requiredOption('--participants <jids>', 'comma-separated JIDs', commaList)
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        await c.request(`/groups/${encodeURIComponent(id)}/participants`, {
          method: 'PUT',
          body: { participants: o.participants, action: o.action },
        });
        return { status: 'ok' };
      }),
    );

  g.command('invite-link <id>')
    .description('Get the current group invite link')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/groups/${encodeURIComponent(id)}/invite-link`);
      }),
    );

  g.command('reset-invite <id>')
    .description('Reset and rotate the group invite link')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/groups/${encodeURIComponent(id)}/invite-link/reset`, { method: 'POST' });
      }),
    );

  for (const setting of [
    { cmd: 'set-announce', path: 'announce', help: 'Toggle announce mode (only admins can send)' },
    { cmd: 'set-locked', path: 'locked', help: 'Toggle locked mode (only admins can edit info)' },
    { cmd: 'set-join-approval', path: 'join-approval', help: 'Toggle join approval requirement' },
  ]) {
    g.command(`${setting.cmd} <id>`)
      .description(setting.help)
      .requiredOption('--enabled <bool>', 'true | false')
      .action(
        action(async (c, cmd) => {
          const [id] = cmd.args;
          const enabled = cmd.opts().enabled === 'true' || cmd.opts().enabled === true;
          await c.request(`/groups/${encodeURIComponent(id)}/settings/${setting.path}`, {
            method: 'PUT',
            body: { enabled },
          });
          return { status: 'ok' };
        }),
      );
  }

  g.command('set-member-add-mode <id>')
    .description('Control whether only admins can add members')
    .requiredOption('--only-admin-add <bool>', 'true | false')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const v = cmd.opts().onlyAdminAdd;
        const onlyAdminAdd = v === 'true' || v === true;
        await c.request(`/groups/${encodeURIComponent(id)}/settings/member-add-mode`, {
          method: 'PUT',
          body: { onlyAdminAdd },
        });
        return { status: 'ok' };
      }),
    );

  g.command('join-link')
    .description('Join a group via an invite link code')
    .requiredOption('--code <code>', 'invite link code (the part after https://chat.whatsapp.com/)')
    .action(
      action((c, cmd) => {
        return c.request('/groups/join/link', {
          method: 'POST',
          body: { code: cmd.opts().code },
        });
      }),
    );

  g.command('join-invite')
    .description('Accept a group invite received in a direct message')
    .requiredOption('--group-id <jid>', 'group JID')
    .requiredOption('--inviter-id <jid>', 'inviter JID')
    .requiredOption('--code <code>', 'invite code')
    .option('--expiration <unix>', 'expiration timestamp (int64)')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        await c.request('/groups/join/invite', {
          method: 'POST',
          body: {
            groupId: o.groupId,
            inviterId: o.inviterId,
            code: o.code,
            ...(o.expiration ? { expiration: Number.parseInt(o.expiration, 10) } : {}),
          },
        });
        return { status: 'ok' };
      }),
    );

  g.command('invite-info <code>')
    .description('Preview group info from an invite code')
    .action(
      action((c, cmd) => {
        const [code] = cmd.args;
        return c.request(`/groups/invite/${encodeURIComponent(code)}`);
      }),
    );

  g.command('requests <id>')
    .description('List pending join requests')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/groups/${encodeURIComponent(id)}/requests`);
      }),
    );

  g.command('update-requests <id>')
    .description('Approve or reject pending join requests')
    .requiredOption('--action <action>', 'approve | reject')
    .requiredOption('--participants <jids>', 'comma-separated JIDs', commaList)
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        await c.request(`/groups/${encodeURIComponent(id)}/requests`, {
          method: 'PUT',
          body: { participants: o.participants, action: o.action },
        });
        return { status: 'ok' };
      }),
    );
}
