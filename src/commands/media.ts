import type { Command } from 'commander';
import { handleError, makeClient } from '../runner.js';
import { writeBinary } from '../output.js';

export function registerMediaCommands(program: Command): void {
  const md = program.command('media').description('Download media');

  md.command('download <id>')
    .description('Download media by ID (from a received message webhook event)')
    .option('-o, --output <file>', 'write to file (default: stdout)')
    .action(async function (this: Command, id: string, options: { output?: string }) {
      try {
        const c = makeClient(this);
        const { data, filename } = await c.requestBinary('/media/download', {
          query: { id },
        });
        const out = options.output ?? filename ?? undefined;
        writeBinary(data, out);
      } catch (e) {
        handleError(e);
      }
    });
}
