import type { Command } from 'commander';
import { action, buildBody, intArg } from '../runner.js';

export function registerChatsCommands(program: Command): void {
  const ch = program.command('chats').description('Chat listing, info, and settings');

  ch.command('list')
    .description('List all known chats')
    .action(action((c) => c.request('/chats')));

  ch.command('get <chatId>')
    .description('Get chat info')
    .action(
      action((c, cmd) => {
        const [chatId] = cmd.args;
        return c.request(`/chats/${encodeURIComponent(chatId)}`);
      }),
    );

  ch.command('delete <chatId>')
    .description('Delete a chat')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}`, { method: 'DELETE' });
        return { status: 'ok' };
      }),
    );

  ch.command('picture <chatId>')
    .description("Get the chat's profile picture info")
    .action(
      action((c, cmd) => {
        const [chatId] = cmd.args;
        return c.request(`/chats/${encodeURIComponent(chatId)}/picture`);
      }),
    );

  ch.command('business <chatId>')
    .description('Get business profile for a chat')
    .action(
      action((c, cmd) => {
        const [chatId] = cmd.args;
        return c.request(`/chats/${encodeURIComponent(chatId)}/business`);
      }),
    );

  ch.command('set-presence <chatId>')
    .description('Send chat presence (typing, paused, recording)')
    .requiredOption('--state <state>', 'typing | paused | recording')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/presence`, {
          method: 'PUT',
          body: { state: cmd.opts().state },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('subscribe-presence <chatId>')
    .description('Subscribe to presence updates for a chat')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/presence/subscribe`, { method: 'PUT' });
        return { status: 'ok' };
      }),
    );

  ch.command('set-ephemeral <chatId>')
    .description('Set disappearing-messages timer')
    .requiredOption('--expiration <off|24h|7d|90d>', 'timer value')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/ephemeral`, {
          method: 'PUT',
          body: { expiration: cmd.opts().expiration },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('mute <chatId>')
    .description('Mute or unmute a chat')
    .requiredOption('--duration <8h|1w|always|off>', 'mute duration')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/mute`, {
          method: 'PUT',
          body: { duration: cmd.opts().duration },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('pin <chatId>')
    .description('Pin or unpin a chat')
    .option('--unpin', 'unpin instead of pinning')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/pin`, {
          method: 'PUT',
          body: { pinned: !cmd.opts().unpin },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('archive <chatId>')
    .description('Archive or unarchive a chat')
    .option('--unarchive', 'unarchive instead of archiving')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/archive`, {
          method: 'PUT',
          body: { archived: !cmd.opts().unarchive },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('read <chatId>')
    .description('Mark a chat as read or unread')
    .option('--unread', 'mark unread instead of read')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/read`, {
          method: 'PUT',
          body: { read: !cmd.opts().unread },
        });
        return { status: 'ok' };
      }),
    );

  ch.command('request-history <chatId>')
    .description('Request on-demand message history (delivered async via events)')
    .requiredOption('--last-message-id <id>', 'ID of the last known message')
    .requiredOption('--last-message-sender-id <jid>', 'sender of the last known message')
    .option('--count <n>', 'number of messages to request (1-500, default 50)', intArg)
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const [chatId] = cmd.args;
        const o = cmd.opts();
        return c.request(`/chats/${encodeURIComponent(chatId)}/messages`, {
          method: 'POST',
          body: buildBody(
            {
              lastMessageId: o.lastMessageId,
              lastMessageSenderId: o.lastMessageSenderId,
              count: o.count,
            },
            o.data,
          ),
        });
      }),
    );

  ch.command('clear <chatId>')
    .description('Clear all messages from a chat')
    .action(
      action(async (c, cmd) => {
        const [chatId] = cmd.args;
        await c.request(`/chats/${encodeURIComponent(chatId)}/clear`, { method: 'POST' });
        return { status: 'ok' };
      }),
    );
}
