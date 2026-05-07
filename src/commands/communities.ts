import type { Command } from 'commander';
import { action, buildBody, commaList } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerCommunitiesCommands(program: Command): void {
  const cm = program.command('communities').description('Community management');

  cm.command('list')
    .description('List joined communities')
    .action(action((c) => c.request('/communities')));

  cm.command('get <id>')
    .description('Get community info')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/communities/${encodeURIComponent(id)}`);
      }),
    );

  cm.command('create')
    .description('Create a new community')
    .requiredOption('--name <name>', 'community name')
    .option('--participants <jids>', 'comma-separated JIDs', commaList)
    .option('--approval-mode <mode>', 'join approval mode')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/communities', {
          method: 'POST',
          body: buildBody(
            {
              name: o.name,
              participants: o.participants,
              approvalMode: o.approvalMode,
            },
            o.data,
          ),
        });
      }),
    );

  cm.command('leave <id>')
    .description('Leave a community')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/communities/${encodeURIComponent(id)}/leave`, { method: 'POST' });
        return { status: 'ok' };
      }),
    );

  cm.command('set-name <id>')
    .description('Set community name')
    .requiredOption('--name <name>', 'new name')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/communities/${encodeURIComponent(id)}/name`, {
          method: 'PUT',
          body: { name: cmd.opts().name },
        });
        return { status: 'ok' };
      }),
    );

  cm.command('set-description <id>')
    .description('Set community description')
    .option('--description <text>', 'description')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/communities/${encodeURIComponent(id)}/description`, {
          method: 'PUT',
          body: { description: cmd.opts().description ?? '' },
        });
        return { status: 'ok' };
      }),
    );

  cm.command('set-picture <id>')
    .description('Set community picture (JPEG)')
    .option('--data-file <path>', 'JPEG file to upload')
    .option('--data-base64 <base64>', 'base64-encoded JPEG image')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        const data = o.dataFile ? await readFileToBase64(o.dataFile) : o.dataBase64;
        return c.request(`/communities/${encodeURIComponent(id)}/picture`, {
          method: 'POST',
          body: { data },
        });
      }),
    );

  cm.command('set-locked <id>')
    .description('Set community locked mode')
    .requiredOption('--enabled <bool>', 'true | false')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const enabled = cmd.opts().enabled === 'true' || cmd.opts().enabled === true;
        await c.request(`/communities/${encodeURIComponent(id)}/settings/locked`, {
          method: 'PUT',
          body: { enabled },
        });
        return { status: 'ok' };
      }),
    );

  cm.command('participants <id>')
    .description('Get community participants')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/communities/${encodeURIComponent(id)}/participants`);
      }),
    );

  cm.command('update-participants <id>')
    .description('Add, remove, promote, or demote participants')
    .requiredOption('--action <action>', 'add | remove | promote | demote')
    .requiredOption('--participants <jids>', 'comma-separated JIDs', commaList)
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        await c.request(`/communities/${encodeURIComponent(id)}/participants`, {
          method: 'PUT',
          body: { participants: o.participants, action: o.action },
        });
        return { status: 'ok' };
      }),
    );

  cm.command('invite-link <id>')
    .description('Get the community invite link')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/communities/${encodeURIComponent(id)}/invite-link`);
      }),
    );

  cm.command('reset-invite <id>')
    .description('Reset the community invite link')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/communities/${encodeURIComponent(id)}/invite-link/reset`, { method: 'POST' });
      }),
    );

  cm.command('subgroups <id>')
    .description('List sub-groups linked to a community')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/communities/${encodeURIComponent(id)}/groups`);
      }),
    );

  cm.command('create-subgroup <id>')
    .description('Create a sub-group within a community')
    .requiredOption('--name <name>', 'sub-group name')
    .option('--participants <jids>', 'comma-separated JIDs', commaList)
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        const o = cmd.opts();
        return c.request(`/communities/${encodeURIComponent(id)}/groups`, {
          method: 'POST',
          body: buildBody({ name: o.name, participants: o.participants }, o.data),
        });
      }),
    );

  cm.command('link-subgroup <id>')
    .description('Link an existing group to a community as a sub-group')
    .requiredOption('--group-id <jid>', 'group JID to link')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/communities/${encodeURIComponent(id)}/groups/link`, {
          method: 'POST',
          body: { groupId: cmd.opts().groupId },
        });
        return { status: 'ok' };
      }),
    );

  cm.command('unlink-subgroup <id> <groupId>')
    .description('Unlink a sub-group from a community')
    .action(
      action(async (c, cmd) => {
        const [id, groupId] = cmd.args;
        await c.request(`/communities/${encodeURIComponent(id)}/groups/${encodeURIComponent(groupId)}`, {
          method: 'DELETE',
        });
        return { status: 'ok' };
      }),
    );
}
