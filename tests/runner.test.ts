import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildBody, commaList, intArg, floatArg, boolArg, parseJsonArg } from '../src/runner.js';
import { CliError } from '../src/errors.js';

describe('buildBody', () => {
  it('drops undefined flag values', () => {
    expect(buildBody({ to: 'a', text: undefined })).toEqual({ to: 'a' });
  });

  it('lets --data override flags', () => {
    const out = buildBody({ to: 'flag', text: 'flag-text' }, '{"to":"data"}');
    expect(out).toEqual({ to: 'data', text: 'flag-text' });
  });

  it('reads --data from a file when prefixed with @', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wsapi-cli-test-'));
    const path = join(dir, 'body.json');
    writeFileSync(path, '{"foo":"bar"}');
    expect(buildBody({}, `@${path}`)).toEqual({ foo: 'bar' });
  });

  it('rejects non-object JSON in --data', () => {
    expect(() => parseJsonArg('"plain-string"')).toThrow(CliError);
    expect(() => parseJsonArg('[1,2]')).toThrow(CliError);
    expect(() => parseJsonArg('null')).toThrow(CliError);
  });

  it('reports a useful error on malformed JSON', () => {
    expect(() => parseJsonArg('{not-json')).toThrow(/failed to parse --data/);
  });
});

describe('argument parsers', () => {
  it('splits comma lists and trims whitespace', () => {
    expect(commaList('a, b ,c')).toEqual(['a', 'b', 'c']);
    expect(commaList('a,,b')).toEqual(['a', 'b']);
    expect(commaList('')).toEqual([]);
  });

  it('parses ints and rejects garbage', () => {
    expect(intArg('42')).toBe(42);
    expect(() => intArg('not-a-number')).toThrow(CliError);
  });

  it('parses floats and rejects garbage', () => {
    expect(floatArg('3.14')).toBeCloseTo(3.14);
    expect(() => floatArg('xyz')).toThrow(CliError);
  });

  it('parses bools loosely', () => {
    expect(boolArg('true')).toBe(true);
    expect(boolArg('1')).toBe(true);
    expect(boolArg('YES')).toBe(true);
    expect(boolArg('false')).toBe(false);
    expect(boolArg('0')).toBe(false);
    expect(boolArg('no')).toBe(false);
    expect(() => boolArg('maybe')).toThrow(CliError);
  });
});
