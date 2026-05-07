import type { Command } from 'commander';
import { action, buildBody } from '../runner.js';

export function registerContactsCommands(program: Command): void {
  const ct = program.command('contacts').description('Contact lookup and management');

  ct.command('list')
    .description('List all contacts')
    .action(action((c) => c.request('/contacts')));

  ct.command('get <id>')
    .description('Get a specific contact by JID')
    .action(
      action((c, cmd) => {
        const [id] = cmd.args;
        return c.request(`/contacts/${encodeURIComponent(id)}`);
      }),
    );

  ct.command('create')
    .description('Create or update a contact')
    .requiredOption('--id <id>', 'phone number or JID of the contact')
    .requiredOption('--full-name <name>', 'full name of the contact')
    .option('--first-name <name>', 'first name')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        await c.request('/contacts', {
          method: 'POST',
          body: buildBody(
            {
              id: o.id,
              fullName: o.fullName,
              firstName: o.firstName,
            },
            o.data,
          ),
        });
        return { status: 'ok' };
      }),
    );

  ct.command('sync')
    .description('Trigger a full contact sync from the WhatsApp server')
    .action(
      action(async (c) => {
        await c.request('/contacts/sync', { method: 'POST' });
        return { status: 'ok' };
      }),
    );

  ct.command('blocklist')
    .description('List blocked contacts')
    .action(action((c) => c.request('/contacts/blocklist')));

  ct.command('block <id>')
    .description('Block a contact')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/contacts/${encodeURIComponent(id)}/block`, { method: 'PUT' });
        return { status: 'ok' };
      }),
    );

  ct.command('unblock <id>')
    .description('Unblock a contact')
    .action(
      action(async (c, cmd) => {
        const [id] = cmd.args;
        await c.request(`/contacts/${encodeURIComponent(id)}/unblock`, { method: 'PUT' });
        return { status: 'ok' };
      }),
    );
}
