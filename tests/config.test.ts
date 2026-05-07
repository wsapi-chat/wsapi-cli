import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfig, readConfig, writeConfig } from '../src/config.js';
import { CliError } from '../src/errors.js';

let dir: string;
let configFile: string;
const savedEnv = { ...process.env };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'wsapi-cli-config-'));
  configFile = join(dir, 'config.json');
  for (const key of ['WSAPI_API_KEY', 'WSAPI_INSTANCE_ID', 'WSAPI_BASE_URL', 'WSAPI_PROFILE']) {
    delete process.env[key];
  }
});

afterEach(() => {
  process.env = { ...savedEnv };
  rmSync(dir, { recursive: true, force: true });
});

describe('resolveConfig precedence', () => {
  it('prefers CLI flags over env over profile', () => {
    writeFileSync(
      configFile,
      JSON.stringify({
        defaultProfile: 'p',
        profiles: { p: { apiKey: 'profile-key', instanceId: 'profile-inst', baseUrl: 'https://profile' } },
      }),
    );
    process.env.WSAPI_API_KEY = 'env-key';
    process.env.WSAPI_INSTANCE_ID = 'env-inst';

    const cfg = resolveConfig({ apiKey: 'flag-key', config: configFile });
    expect(cfg.apiKey).toBe('flag-key');
    expect(cfg.instanceId).toBe('env-inst');
    expect(cfg.baseUrl).toBe('https://profile');
  });

  it('uses default profile when no env or flags are set', () => {
    writeFileSync(
      configFile,
      JSON.stringify({
        defaultProfile: 'staging',
        profiles: { staging: { apiKey: 'k', instanceId: 'i' } },
      }),
    );
    const cfg = resolveConfig({ config: configFile });
    expect(cfg).toMatchObject({ apiKey: 'k', instanceId: 'i', baseUrl: 'https://api.wsapi.chat' });
  });

  it('errors if API key is missing everywhere', () => {
    expect(() => resolveConfig({ config: configFile })).toThrow(CliError);
  });

  it('errors if a named profile does not exist', () => {
    writeFileSync(configFile, JSON.stringify({ profiles: { existing: { apiKey: 'k', instanceId: 'i' } } }));
    expect(() => resolveConfig({ profile: 'missing', config: configFile })).toThrow(/profile not found/);
  });
});

describe('config file roundtrip', () => {
  it('writes and reads back the config', () => {
    const written = writeConfig({ defaultProfile: 'p', profiles: { p: { apiKey: 'k', instanceId: 'i' } } }, configFile);
    expect(written).toBe(configFile);
    const cfg = readConfig(configFile);
    expect(cfg.defaultProfile).toBe('p');
    expect(cfg.profiles?.p?.apiKey).toBe('k');
  });

  it('returns empty config when file is missing', () => {
    expect(readConfig(configFile)).toEqual({});
  });
});
