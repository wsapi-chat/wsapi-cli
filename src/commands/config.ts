import type { Command } from 'commander';
import { configPath, readConfig, writeConfig, type ConfigFile, type GlobalOptions } from '../config.js';
import { handleError } from '../runner.js';
import { CliError } from '../errors.js';
import { printJson } from '../output.js';

function rootOpts(cmd: Command): GlobalOptions {
  let r: Command = cmd;
  while (r.parent) r = r.parent;
  return r.opts() as GlobalOptions;
}

export function registerConfigCommand(program: Command): void {
  const config = program.command('config').description('Manage CLI configuration profiles');

  config
    .command('path')
    .description('Print the path to the active config file')
    .action(function (this: Command) {
      try {
        const opts = rootOpts(this);
        process.stdout.write(configPath(opts.config) + '\n');
      } catch (e) {
        handleError(e);
      }
    });

  config
    .command('show')
    .description('Print the resolved config file contents')
    .action(function (this: Command) {
      try {
        const opts = rootOpts(this);
        const cfg = readConfig(opts.config);
        printJson(cfg);
      } catch (e) {
        handleError(e);
      }
    });

  config
    .command('list')
    .description('List configured profile names')
    .action(function (this: Command) {
      try {
        const opts = rootOpts(this);
        const cfg = readConfig(opts.config);
        const names = Object.keys(cfg.profiles ?? {});
        printJson({ defaultProfile: cfg.defaultProfile, profiles: names });
      } catch (e) {
        handleError(e);
      }
    });

  config
    .command('set-profile <name>')
    .description('Create or update a named profile')
    .option('--api-key <key>', 'API key for this profile')
    .option('--instance-id <id>', 'instance ID for this profile')
    .option('--base-url <url>', 'base URL for this profile')
    .option('--default', 'mark this profile as the default')
    .action(function (this: Command, name: string, options: Record<string, unknown>) {
      try {
        const opts = rootOpts(this);
        const cfg: ConfigFile = readConfig(opts.config);
        cfg.profiles ??= {};
        const existing = cfg.profiles[name] ?? {};
        cfg.profiles[name] = {
          ...existing,
          ...(options.apiKey ? { apiKey: options.apiKey as string } : {}),
          ...(options.instanceId ? { instanceId: options.instanceId as string } : {}),
          ...(options.baseUrl ? { baseUrl: options.baseUrl as string } : {}),
        };
        if (options.default) cfg.defaultProfile = name;
        const path = writeConfig(cfg, opts.config);
        process.stdout.write(`profile "${name}" saved to ${path}\n`);
      } catch (e) {
        handleError(e);
      }
    });

  config
    .command('remove <name>')
    .alias('rm')
    .description('Delete a named profile')
    .action(function (this: Command, name: string) {
      try {
        const opts = rootOpts(this);
        const cfg = readConfig(opts.config);
        if (!cfg.profiles?.[name]) throw new CliError(`profile not found: ${name}`);
        delete cfg.profiles[name];
        if (cfg.defaultProfile === name) delete cfg.defaultProfile;
        const path = writeConfig(cfg, opts.config);
        process.stdout.write(`profile "${name}" removed from ${path}\n`);
      } catch (e) {
        handleError(e);
      }
    });

  config
    .command('use <name>')
    .description('Set the default profile')
    .action(function (this: Command, name: string) {
      try {
        const opts = rootOpts(this);
        const cfg = readConfig(opts.config);
        if (!cfg.profiles?.[name]) throw new CliError(`profile not found: ${name}`);
        cfg.defaultProfile = name;
        const path = writeConfig(cfg, opts.config);
        process.stdout.write(`default profile set to "${name}" in ${path}\n`);
      } catch (e) {
        handleError(e);
      }
    });
}
