import type { Command } from 'commander';
import { action, buildBody, commaList } from '../runner.js';
import { readFileToBase64 } from '../output.js';

export function registerMessagesCommands(program: Command): void {
  const m = program.command('messages').description('Send and manage WhatsApp messages');

  // ── Text ────────────────────────────────────────────────
  m.command('text')
    .description('Send a text message')
    .requiredOption('--to <jid>', 'recipient JID (user or group)')
    .requiredOption('--text <text>', 'message text')
    .option('--mentions <jids>', 'comma-separated mentioned JIDs', commaList)
    .option('--reply-to <id>', 'reply to message ID')
    .option('--reply-to-sender-id <jid>', 'sender JID of the message being replied to')
    .option('--forwarded', 'mark as forwarded')
    .option('--ephemeral <off|24h|7d|90d>', 'disappearing message timer')
    .option('--data <json>', 'extra body fields as JSON (overrides flags); prefix with @ to load from file')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/messages/text', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              text: o.text,
              mentions: o.mentions,
              replyTo: o.replyTo,
              replyToSenderId: o.replyToSenderId,
              isForwarded: o.forwarded || undefined,
              ephemeralExpiration: o.ephemeral,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Media (image/video/audio/voice) ─────────────────────
  for (const kind of ['image', 'video', 'audio', 'voice'] as const) {
    m.command(kind)
      .description(`Send a ${kind} message`)
      .requiredOption('--to <jid>', 'recipient JID')
      .option('--url <url>', 'URL of the media (mutually exclusive with --data-file)')
      .option('--data-file <path>', 'local file to upload as base64 (mutually exclusive with --url)')
      .option('--mime-type <type>', 'MIME type (auto-detected if omitted)')
      .option('--caption <text>', 'media caption')
      .option('--mentions <jids>', 'comma-separated mentioned JIDs', commaList)
      .option('--reply-to <id>', 'reply to message ID')
      .option('--reply-to-sender-id <jid>', 'sender JID of the message being replied to')
      .option('--forwarded', 'mark as forwarded')
      .option('--view-once', 'send as view-once')
      .option('--ephemeral <off|24h|7d|90d>', 'disappearing timer')
      .option('--data <json>', 'extra body fields as JSON')
      .action(
        action(async (c, cmd) => {
          const o = cmd.opts();
          const data = o.dataFile ? await readFileToBase64(o.dataFile) : undefined;
          return c.request(`/messages/${kind}`, {
            method: 'POST',
            body: buildBody(
              {
                to: o.to,
                url: o.url,
                data,
                mimeType: o.mimeType,
                caption: o.caption,
                mentions: o.mentions,
                replyTo: o.replyTo,
                replyToSenderId: o.replyToSenderId,
                isForwarded: o.forwarded || undefined,
                viewOnce: o.viewOnce || undefined,
                ephemeralExpiration: o.ephemeral,
              },
              o.data,
            ),
          });
        }),
      );
  }

  // ── Document ────────────────────────────────────────────
  m.command('document')
    .description('Send a document message')
    .requiredOption('--to <jid>', 'recipient JID')
    .requiredOption('--filename <name>', 'filename shown to recipient')
    .option('--url <url>', 'URL of the document')
    .option('--data-file <path>', 'local file to upload as base64')
    .option('--mime-type <type>', 'MIME type')
    .option('--caption <text>', 'caption')
    .option('--mentions <jids>', 'comma-separated JIDs', commaList)
    .option('--reply-to <id>', 'reply to message ID')
    .option('--reply-to-sender-id <jid>', 'sender JID of replied message')
    .option('--forwarded', 'mark as forwarded')
    .option('--ephemeral <off|24h|7d|90d>', 'disappearing timer')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        const data = o.dataFile ? await readFileToBase64(o.dataFile) : undefined;
        return c.request('/messages/document', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              filename: o.filename,
              url: o.url,
              data,
              mimeType: o.mimeType,
              caption: o.caption,
              mentions: o.mentions,
              replyTo: o.replyTo,
              replyToSenderId: o.replyToSenderId,
              isForwarded: o.forwarded || undefined,
              ephemeralExpiration: o.ephemeral,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Sticker ─────────────────────────────────────────────
  m.command('sticker')
    .description('Send a sticker message (WebP)')
    .requiredOption('--to <jid>', 'recipient JID')
    .option('--url <url>', 'URL of the sticker')
    .option('--data-file <path>', 'local sticker file (WebP)')
    .option('--animated', 'mark as animated')
    .option('--mentions <jids>', 'comma-separated JIDs', commaList)
    .option('--reply-to <id>', 'reply to message ID')
    .option('--reply-to-sender-id <jid>', 'sender JID of replied message')
    .option('--forwarded', 'mark as forwarded')
    .option('--ephemeral <off|24h|7d|90d>', 'disappearing timer')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const o = cmd.opts();
        const data = o.dataFile ? await readFileToBase64(o.dataFile) : undefined;
        return c.request('/messages/sticker', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              url: o.url,
              data,
              isAnimated: o.animated || undefined,
              mentions: o.mentions,
              replyTo: o.replyTo,
              replyToSenderId: o.replyToSenderId,
              isForwarded: o.forwarded || undefined,
              ephemeralExpiration: o.ephemeral,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Contact ─────────────────────────────────────────────
  m.command('contact')
    .description('Send a contact card')
    .requiredOption('--to <jid>', 'recipient JID')
    .option('--display-name <name>', 'contact display name (auto-generates a vCard)')
    .option('--vcard <vcard>', 'raw vCard string')
    .option('--reply-to <id>', 'reply to message ID')
    .option('--reply-to-sender-id <jid>', 'sender JID of replied message')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/messages/contact', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              displayName: o.displayName,
              vcard: o.vcard,
              replyTo: o.replyTo,
              replyToSenderId: o.replyToSenderId,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Location ────────────────────────────────────────────
  m.command('location')
    .description('Send a location message')
    .requiredOption('--to <jid>', 'recipient JID')
    .option('--latitude <n>', 'latitude', parseFloat)
    .option('--longitude <n>', 'longitude', parseFloat)
    .option('--name <name>', 'location name')
    .option('--address <address>', 'location address')
    .option('--url <url>', 'location URL')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/messages/location', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              latitude: o.latitude,
              longitude: o.longitude,
              name: o.name,
              address: o.address,
              url: o.url,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Link ───────────────────────────────────────────────
  m.command('link')
    .description('Send a link preview message')
    .requiredOption('--to <jid>', 'recipient JID')
    .requiredOption('--text <text>', 'message text')
    .requiredOption('--url <url>', 'link URL')
    .option('--title <title>', 'preview title')
    .option('--description <desc>', 'preview description')
    .option('--jpeg-thumbnail <base64>', 'base64 JPEG thumbnail')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const o = cmd.opts();
        return c.request('/messages/link', {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              text: o.text,
              url: o.url,
              title: o.title,
              description: o.description,
              jpegThumbnail: o.jpegThumbnail,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Reaction ────────────────────────────────────────────
  m.command('react <messageId>')
    .description('React to a message (empty reaction removes it)')
    .requiredOption('--to <jid>', 'chat JID')
    .requiredOption('--reaction <emoji>', 'emoji reaction (empty string to remove)')
    .option('--sender-id <jid>', 'sender JID of the original message (group chats)')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        return c.request(`/messages/${encodeURIComponent(messageId)}/reaction`, {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              senderId: o.senderId,
              reaction: o.reaction,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Edit ────────────────────────────────────────────────
  m.command('edit <messageId>')
    .description('Edit a sent message')
    .requiredOption('--to <jid>', 'chat JID')
    .requiredOption('--text <text>', 'new message text')
    .option('--mentions <jids>', 'comma-separated JIDs', commaList)
    .option('--ephemeral <off|24h|7d|90d>', 'disappearing timer')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action((c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        return c.request(`/messages/${encodeURIComponent(messageId)}/edit`, {
          method: 'POST',
          body: buildBody(
            {
              to: o.to,
              text: o.text,
              mentions: o.mentions,
              ephemeralExpiration: o.ephemeral,
            },
            o.data,
          ),
        });
      }),
    );

  // ── Read ────────────────────────────────────────────────
  m.command('read <messageId>')
    .description('Mark a message as read/delivered/played')
    .requiredOption('--chat-id <jid>', 'chat JID')
    .requiredOption('--sender-id <jid>', 'sender JID')
    .requiredOption('--receipt-type <type>', 'delivered | sender | read | played')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        await c.request(`/messages/${encodeURIComponent(messageId)}/read`, {
          method: 'POST',
          body: buildBody(
            {
              chatId: o.chatId,
              senderId: o.senderId,
              receiptType: o.receiptType,
            },
            o.data,
          ),
        });
        return { status: 'ok' };
      }),
    );

  // ── Star ────────────────────────────────────────────────
  m.command('star <messageId>')
    .description('Star or unstar a message')
    .requiredOption('--chat-id <jid>', 'chat JID')
    .requiredOption('--sender-id <jid>', 'sender JID')
    .option('--unstar', 'unstar instead of starring')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        await c.request(`/messages/${encodeURIComponent(messageId)}/star`, {
          method: 'POST',
          body: buildBody(
            {
              chatId: o.chatId,
              senderId: o.senderId,
              starred: !o.unstar,
            },
            o.data,
          ),
        });
        return { status: 'ok' };
      }),
    );

  // ── Pin ─────────────────────────────────────────────────
  m.command('pin <messageId>')
    .description('Pin or unpin a message')
    .requiredOption('--chat-id <jid>', 'chat JID')
    .requiredOption('--sender-id <jid>', 'sender JID')
    .option('--unpin', 'unpin instead of pinning')
    .option('--expiration <duration>', 'pin expiration duration (e.g. 24h, 7d, 30d)')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        await c.request(`/messages/${encodeURIComponent(messageId)}/pin`, {
          method: 'POST',
          body: buildBody(
            {
              chatId: o.chatId,
              senderId: o.senderId,
              pinned: !o.unpin,
              pinExpiration: o.expiration,
            },
            o.data,
          ),
        });
        return { status: 'ok' };
      }),
    );

  // ── Delete ──────────────────────────────────────────────
  m.command('delete <messageId>')
    .description('Delete a message for everyone')
    .requiredOption('--chat-id <jid>', 'chat JID')
    .requiredOption('--sender-id <jid>', 'sender JID')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        await c.request(`/messages/${encodeURIComponent(messageId)}/delete`, {
          method: 'POST',
          body: buildBody({ chatId: o.chatId, senderId: o.senderId }, o.data),
        });
        return { status: 'ok' };
      }),
    );

  m.command('delete-for-me <messageId>')
    .description('Delete a message only from your chat')
    .requiredOption('--chat-id <jid>', 'chat JID')
    .option('--sender-id <jid>', 'sender JID')
    .option('--from-me', 'the message was sent by me')
    .option('--timestamp <iso8601>', 'message timestamp (ISO-8601)')
    .option('--data <json>', 'extra body fields as JSON')
    .action(
      action(async (c, cmd) => {
        const [messageId] = cmd.args;
        const o = cmd.opts();
        await c.request(`/messages/${encodeURIComponent(messageId)}/delete-for-me`, {
          method: 'POST',
          body: buildBody(
            {
              chatId: o.chatId,
              senderId: o.senderId,
              isFromMe: o.fromMe || undefined,
              timestamp: o.timestamp,
            },
            o.data,
          ),
        });
        return { status: 'ok' };
      }),
    );
}
