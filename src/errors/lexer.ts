export class LexerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LexerError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LexerError);
    }
  }
}
