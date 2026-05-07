import { writeFileSync } from 'node:fs';

export function printJson(value: unknown): void {
  if (value === undefined) return;
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

export function printOk(): void {
  process.stdout.write(JSON.stringify({ status: 'ok' }) + '\n');
}

export function writeBinary(buf: Uint8Array, output?: string): void {
  if (output) {
    writeFileSync(output, buf);
    process.stdout.write(`wrote ${buf.byteLength} bytes to ${output}\n`);
    return;
  }
  process.stdout.write(buf);
}

export async function readFileToBase64(path: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const buf = await readFile(path);
  return buf.toString('base64');
}
