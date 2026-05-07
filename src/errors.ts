export class CliError extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

export class ApiError extends CliError {
  readonly status: number;
  readonly detail: string;
  readonly body: unknown;
  constructor(status: number, detail: string, body: unknown) {
    super(`API error ${status}: ${detail}`, 1);
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}
