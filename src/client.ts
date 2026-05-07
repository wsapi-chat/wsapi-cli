import { ApiError } from './errors.js';
import type { ResolvedConfig } from './config.js';

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  accept?: string;
}

export class WsApiClient {
  constructor(private readonly cfg: ResolvedConfig) {}

  private url(path: string, query?: RequestOptions['query']): string {
    const base = this.cfg.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(base + cleanPath);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      'X-Api-Key': this.cfg.apiKey,
      'X-Instance-Id': this.cfg.instanceId,
      Accept: 'application/json',
      ...extra,
    };
  }

  async request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const headers = this.headers(opts.accept ? { Accept: opts.accept } : undefined);
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      headers,
    };
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch(this.url(path, opts.query), init);
    return this.parse<T>(res);
  }

  async requestBinary(
    path: string,
    opts: RequestOptions = {},
  ): Promise<{
    data: Uint8Array;
    contentType: string | null;
    filename: string | null;
  }> {
    const headers = this.headers({ Accept: opts.accept ?? '*/*' });
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      headers,
    };
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch(this.url(path, opts.query), init);
    if (!res.ok) {
      await this.throwError(res);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      data: buf,
      contentType: res.headers.get('content-type'),
      filename: parseFilename(res.headers.get('content-disposition')),
    };
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      await this.throwError(res);
    }
    if (res.status === 204) return undefined as T;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      return (await res.json()) as T;
    }
    const text = await res.text();
    return text as unknown as T;
  }

  private async throwError(res: Response): Promise<never> {
    let body: unknown;
    let detail = res.statusText || `HTTP ${res.status}`;
    try {
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        body = await res.json();
        const b = body as { detail?: string };
        if (b && typeof b.detail === 'string') detail = b.detail;
      } else {
        const text = await res.text();
        if (text) {
          body = text;
          detail = text.slice(0, 500);
        }
      }
    } catch {
      // ignore body parse errors
    }
    throw new ApiError(res.status, detail, body);
  }
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return m ? decodeURIComponent(m[1]) : null;
}
