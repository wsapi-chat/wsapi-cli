import { afterEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import { registerGroupsCommands } from '../src/commands/groups.js';
import { registerCallsCommands } from '../src/commands/calls.js';
import { registerNewslettersCommands } from '../src/commands/newsletters.js';
import { registerChatsCommands } from '../src/commands/chats.js';
import { registerUsersCommands } from '../src/commands/users.js';
import { registerCommunitiesCommands } from '../src/commands/communities.js';
import { registerStatusCommands } from '../src/commands/status.js';
import { WsApiClient } from '../src/client.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function program() {
  const p = new Command()
    .exitOverride()
    .option('--api-key <key>', '', 'test-key')
    .option('--instance-id <id>', '', 'test-instance')
    .option('--base-url <url>', '', 'https://unused.invalid');
  for (const register of [
    registerGroupsCommands,
    registerCallsCommands,
    registerNewslettersCommands,
    registerChatsCommands,
    registerUsersCommands,
    registerCommunitiesCommands,
    registerStatusCommands,
  ])
    register(p);
  return p;
}
describe('command request contracts', () => {
  it.each([
    ['groups', 'set-name', 'g', '--name', 'name'],
    ['groups', 'set-announce', 'g', '--enabled', 'true'],
    ['groups', 'set-locked', 'g', '--enabled', 'true'],
    ['groups', 'set-join-approval', 'g', '--enabled', 'true'],
    ['groups', 'join-link', '--code', 'invite'],
    ['calls', 'reject', 'call', '--caller-id', 'u'],
    ['newsletters', 'subscribe', 'n'],
    ['users', 'set-presence', '--presence', 'available'],
    ['communities', 'set-name', 'c', '--name', 'name'],
    ['status', 'text', '--text', 'hello'],
  ])('%j merges --data and prints successful 204 responses', async (...args) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync([...args, '--data', '{"enabled":false,"extra":0}'], { from: 'user' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toMatchObject({ enabled: false, extra: 0 });
  });

  it('binary responses preserve bytes and encode media ids', async () => {
    const bytes = new Uint8Array([0, 255, 128, 10]);
    const fetchMock = vi.fn().mockResolvedValue(new Response(bytes, { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new WsApiClient({ apiKey: 'k', instanceId: 'i', baseUrl: 'https://unused.invalid' });
    const result = await client.requestBinary('/media/download', { query: { id: 'a+/=' } });
    expect(result.data).toEqual(bytes);
    expect(fetchMock.mock.calls[0][0]).toBe('https://unused.invalid/media/download?id=a%2B%2F%3D');
  });
});
