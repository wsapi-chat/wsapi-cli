import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { resolveConfig, type GlobalOptions } from './config.js';
import { WsApiClient } from './client.js';
import { CliError, ApiError } from './errors.js';
import { printJson } from './output.js';

export function getGlobalOptions(cmd: Command): GlobalOptions {
  let root: Command = cmd;
  while (root.parent) root = root.parent;
  return root.opts() as GlobalOptions;
}

export function makeClient(cmd: Command): WsApiClient {
  const opts = getGlobalOptions(cmd);
  const cfg = resolveConfig(opts);
  return new WsApiClient(cfg);
}

export type Handler = (client: WsApiClient, cmd: Command) => Promise<unknown> | unknown;

export function action(handler: Handler) {
  return async (...args: unknown[]) => {
    const cmd = args[args.length - 1] as Command;
    try {
      const client = makeClient(cmd);
      const result = await handler(client, cmd);
      if (result !== undefined) {
        printJson(result);
      }
    } catch (e) {
      handleError(e);
    }
  };
}

export function handleError(e: unknown): never {
  if (e instanceof ApiError) {
    process.stderr.write(JSON.stringify({ error: e.detail, status: e.status, body: e.body }, null, 2) + '\n');
    process.exit(1);
  }
  if (e instanceof CliError) {
    process.stderr.write(`error: ${e.message}\n`);
    process.exit(e.exitCode);
  }
  if (e instanceof Error) {
    process.stderr.write(`error: ${e.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`error: ${String(e)}\n`);
  process.exit(1);
}

export function parseJsonArg(value?: string): Record<string, unknown> {
  if (!value) return {};
  let raw = value;
  if (value.startsWith('@')) {
    raw = readFileSync(value.slice(1), 'utf8');
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new CliError('--data must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof CliError) throw e;
    throw new CliError(`failed to parse --data as JSON: ${(e as Error).message}`);
  }
}

/**
 * Merge typed flag values with a `--data` JSON object override.
 * `--data` keys win over flag keys, so users can pass exotic fields
 * without a dedicated flag.
 */
export function buildBody(fromFlags: Record<string, unknown>, data?: string): Record<string, unknown> {
  const fromData = parseJsonArg(data);
  const compact: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fromFlags)) {
    if (v === undefined) continue;
    compact[k] = v;
  }
  return { ...compact, ...fromData };
}

export function commaList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function intArg(value: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) throw new CliError(`expected integer, got ${value}`);
  return n;
}

export function floatArg(value: string): number {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) throw new CliError(`expected number, got ${value}`);
  return n;
}

export function boolArg(value: string): boolean {
  const v = value.toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  throw new CliError(`expected boolean, got ${value}`);
}
