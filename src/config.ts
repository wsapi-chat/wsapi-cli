import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { CliError } from './errors.js';

export const DEFAULT_BASE_URL = 'https://api.wsapi.chat';

export interface Profile {
  baseUrl?: string;
  apiKey?: string;
  instanceId?: string;
}

export interface ConfigFile {
  defaultProfile?: string;
  profiles?: Record<string, Profile>;
}

export interface ResolvedConfig {
  baseUrl: string;
  apiKey: string;
  instanceId: string;
}

export interface GlobalOptions {
  profile?: string;
  apiKey?: string;
  instanceId?: string;
  baseUrl?: string;
  config?: string;
}

export function configPath(override?: string): string {
  if (override) return override;
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, 'wsapi', 'config.json');
  return join(homedir(), '.wsapi', 'config.json');
}

export function readConfig(path?: string): ConfigFile {
  const file = configPath(path);
  if (!existsSync(file)) return {};
  try {
    const raw = readFileSync(file, 'utf8');
    return JSON.parse(raw) as ConfigFile;
  } catch (e) {
    throw new CliError(`failed to read config at ${file}: ${(e as Error).message}`);
  }
}

export function writeConfig(cfg: ConfigFile, path?: string): string {
  const file = configPath(path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 });
  return file;
}

export function resolveConfig(opts: GlobalOptions): ResolvedConfig {
  const file = readConfig(opts.config);
  const profileName = opts.profile ?? process.env.WSAPI_PROFILE ?? file.defaultProfile;
  const profile = profileName ? file.profiles?.[profileName] : undefined;

  if (opts.profile && !profile) {
    throw new CliError(`profile not found: ${opts.profile}`);
  }

  const baseUrl = opts.baseUrl ?? process.env.WSAPI_BASE_URL ?? profile?.baseUrl ?? DEFAULT_BASE_URL;
  const apiKey = opts.apiKey ?? process.env.WSAPI_API_KEY ?? profile?.apiKey;
  const instanceId = opts.instanceId ?? process.env.WSAPI_INSTANCE_ID ?? profile?.instanceId;

  if (!apiKey) {
    throw new CliError('missing API key. Set WSAPI_API_KEY, pass --api-key, or run `wsapi config set-profile`.');
  }
  if (!instanceId) {
    throw new CliError(
      'missing instance ID. Set WSAPI_INSTANCE_ID, pass --instance-id, or run `wsapi config set-profile`.',
    );
  }

  return { baseUrl, apiKey, instanceId };
}
