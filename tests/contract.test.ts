import { afterEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import { registerGroupsCommands } from '../src/commands/groups.js';
import { registerCallsCommands } from '../src/commands/calls.js';
import { registerNewslettersCommands } from '../src/commands/newsletters.js';
import { registerChatsCommands } from '../src/commands/chats.js';
import { registerUsersCommands } from '../src/commands/users.js';
import { registerCommunitiesCommands } from '../src/commands/communities.js';
import { registerStatusCommands } from '../src/commands/status.js';
import { registerSessionCommands } from '../src/commands/session.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
    registerSessionCommands,
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

  it('groups create omits participants when not given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 'g@g.us' }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync(['groups', 'create', '--name', 'solo'], { from: 'user' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'solo' });
  });

  it('groups create still sends participants when given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 'g@g.us' }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync(
      ['groups', 'create', '--name', 'g', '--participants', 'a@s.whatsapp.net, b@s.whatsapp.net'],
      {
        from: 'user',
      },
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'g',
      participants: ['a@s.whatsapp.net', 'b@s.whatsapp.net'],
    });
  });
});

describe('session passkey commands', () => {
  const state = { status: 'required', challenge: { challenge: 'abc' }, origin: 'https://web.whatsapp.com' };

  it.each([
    [['status'], '/session/passkey', 'GET'],
    [['request'], '/session/passkey/request', 'POST'],
  ])('passkey %j calls %s', async (sub, path, method) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(state));
    vi.stubGlobal('fetch', fetchMock);
    const out = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync(['session', 'passkey', ...sub], { from: 'user' });
    expect(fetchMock.mock.calls[0][0]).toBe(`https://unused.invalid${path}`);
    expect((fetchMock.mock.calls[0][1] as RequestInit).method ?? 'GET').toBe(method);
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBeUndefined();
    expect(JSON.parse(String(out.mock.calls[0][0]))).toEqual(state);
  });

  it('passkey confirm prints ok on 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const out = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync(['session', 'passkey', 'confirm'], { from: 'user' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://unused.invalid/session/passkey/confirm');
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('POST');
    expect(JSON.parse(String(out.mock.calls[0][0]))).toEqual({ status: 'ok' });
  });

  it('passkey submit posts the assertion file and merges --data', async () => {
    const assertion = {
      id: 'cred',
      rawId: 'cred',
      type: 'public-key',
      response: { clientDataJSON: 'cd', authenticatorData: 'ad', signature: 'sig', userHandle: null },
    };
    const dir = mkdtempSync(join(tmpdir(), 'wsapi-cli-test-'));
    const file = join(dir, 'assertion.json');
    writeFileSync(file, JSON.stringify(assertion));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'submitted' }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    await program().parseAsync(['session', 'passkey', 'submit', file, '--data', '{"type":"x"}'], { from: 'user' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toBe('https://unused.invalid/session/passkey');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ ...assertion, type: 'x' });
  });
});

describe('readPasskeyAssertion', () => {
  it('rejects non-object JSON', async () => {
    const { readPasskeyAssertion } = await import('../src/commands/session.js');
    const dir = mkdtempSync(join(tmpdir(), 'wsapi-cli-test-'));
    const file = join(dir, 'bad.json');
    writeFileSync(file, '[1]');
    expect(() => readPasskeyAssertion(file)).toThrow(/JSON object/);
    writeFileSync(file, 'not json');
    expect(() => readPasskeyAssertion(file)).toThrow(/parse/);
    expect(() => readPasskeyAssertion(join(dir, 'missing.json'))).toThrow(/failed to read/);
  });
});
