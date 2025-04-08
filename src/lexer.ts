import { LexerError } from './errors/lexer';
import { TokenType, type Token } from './types';
import { strict as assert } from 'assert';

export class Lexer {
  private char: string;
  private cursor = 0;
  private line = 1;
  private col = 1;
  private tokens: Token[] = [];

  private static tokenTypeMap = new Map<string, TokenType>([
    ['VAR', TokenType.VAR],
    ['ITEM', TokenType.ITEM],
    ['DESC', TokenType.DESC],
    ['LOCATION', TokenType.LOCATION],
    ['TAKEABLE', TokenType.TAKEABLE],
    ['ID', TokenType.ID],
    ['ROOM', TokenType.ROOM],
    ['COMMAND', TokenType.COMMAND],
    ['EFFECT', TokenType.EFFECT],
    ['EXECUTE', TokenType.EXECUTE],
    ['SCRIPT', TokenType.SCRIPT],
    ['MESSAGE', TokenType.MESSAGE],
    ['IF', TokenType.IF],
    ['HAS', TokenType.HAS],
    ['ITEMS', TokenType.ITEMS],
    ['THEN', TokenType.THEN],
    ['FOR', TokenType.FOR],
    ['IN', TokenType.IN],
    ['DO', TokenType.DO],
    ['ENDIF', TokenType.ENDIF],
    ['ENDFOR', TokenType.ENDFOR],
    ['ENDSCRIPT', TokenType.ENDSCRIPT],
  ]);

  constructor(private readonly source: string) {
    this.char = source[0] ?? '';
  }

  public tokenize(): Token[] {
    if (!this.source) return [];

    while (!this.eof()) {
      this.skipWhitespace();
      this.scan();
    }

    this.addToken(TokenType.EOL, 'EOL', this.col);
    this.addToken(TokenType.EOF, 'EOF', this.col);

    return this.tokens;
  }

  private scan() {
    const col = this.col;
    const ch = this.char;

    switch (ch) {
      case '\n': {
        this.line += 1;
        this.addToken(TokenType.EOL, 'NEWLINE', col);
        break;
      }
      case '=': {
        const nextChar = this.peek();

        let type = TokenType.ASSIGNMENT;
        let value = ch;

        if (nextChar === '=') {
          type = TokenType.EQ;
          value += nextChar;
          this.consume();
        }

        this.addToken(type, value, col);
        break;
      }
      case '.': {
        this.addToken(TokenType.DOT, ch, col);
        break;
      }
      case '[': {
        this.addToken(TokenType.LBRACKET, ch, col);
        break;
      }
      case ']': {
        this.addToken(TokenType.RBRACKET, ch, col);
        break;
      }
      case '"':
      case "'": {
        const value = this.scanString();
        this.addToken(TokenType.STRING, value, col);
        return;
      }
      case '#': {
        this.skipComment();
        return;
      }
      default: {
        if (Lexer.isKeyword(ch)) {
          const keyword = this.scanKeyword();
          this.addToken(Lexer.getTokenTypeOfKeyword(keyword), keyword, col);
          return;
        } else if (Lexer.isIdent(ch)) {
          const value = this.scanIdentifierOrBooleanLiteral();
          let type = TokenType.IDENT;

          if (value === 'true' || value === 'false') {
            type = TokenType.BOOL;
          }

          this.addToken(type, value, col);
          return;
        } else if (Lexer.isDigit(ch)) {
          const value = this.scanNumber();
          this.addToken(TokenType.NUMBER, value, col);
          return;
        }

        throw new LexerError(
          `${this.line}:${this.col}: Invalid character ${this.char}`,
        );
      }
    }

    this.consume();
  }

  private addToken(type: TokenType, value: string, col: number) {
    this.tokens.push({
      type,
      value,
      line: this.line,
      col,
    });
  }

  private skipComment() {
    assert(this.char === '#', 'Called on a non-comment');

    while (!Lexer.isEndOfLine(this.char)) {
      this.consume();
    }
  }

  private scanKeyword() {
    let keyword = '';

    while (Lexer.isKeyword(this.char)) {
      keyword += this.char;
      this.consume();
    }

    return keyword;
  }

  private scanString() {
    let value = '';

    const quote = this.char;
    if (quote !== "'" && quote !== '"') {
      throw new LexerError(`${this.line}:${this.col}: Invalid start of string`);
    }
    this.consume(); // skip opening quote

    while (this.char !== "'" && this.char !== '"') {
      value += this.char;
      this.consume();
    }

    if (this.char !== quote) {
      throw new LexerError(
        `${this.line}:${this.col}: Unterminated string: ${this.char} Expected: ${quote}`,
      );
    }

    this.consume(); // skip closing quote

    return value;
  }

  private scanNumber() {
    let value = '';

    while (Lexer.isDigit(this.char)) {
      value += this.char;
      this.consume();
    }

    return value;
  }

  private scanIdentifierOrBooleanLiteral() {
    let ident = '';

    while (Lexer.isIdent(this.char)) {
      ident += this.char;
      this.consume();
    }

    return ident;
  }

  private skipWhitespace() {
    while (Lexer.isWhiteSpace(this.char)) {
      this.consume();
    }
  }

  private peek() {
    assert(
      this.cursor + 1 < this.source.length,
      `Peek attempt out of bounds. Cursor: ${this.cursor}, Length: ${this.source.length}`,
    );

    const nextChar = this.source[this.cursor + 1];
    assert(typeof nextChar !== 'undefined');

    return nextChar;
  }

  private consume() {
    assert(
      this.cursor < this.source.length,
      `Consume attempt out of bounds. Cursor: ${this.cursor}, Length: ${this.source.length}`,
    );

    this.col = this.char === '\n' ? 1 : this.col + 1;
    this.cursor += 1;

    const char = this.source[this.cursor];
    assert(typeof char !== 'undefined');

    this.char = char;
  }

  private eof() {
    return this.cursor >= this.source.length - 1;
  }

  private static isDigit(ch: string): boolean {
    return /\d/.test(ch);
  }

  private static isKeyword(ch: string): boolean {
    return /[A-Z]/.test(ch);
  }

  private static isIdent(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  private static isWhiteSpace(ch: string): boolean {
    return ch !== '\n' && /\s/.test(ch);
  }

  private static isEndOfLine(ch: string): boolean {
    return ch === '\n';
  }

  private static getTokenTypeOfKeyword(keyword: string): TokenType {
    assert(keyword, `Cannot lookup empty keyword: ${keyword}`);

    const tokenType = this.tokenTypeMap.get(keyword);

    if (tokenType === undefined) {
      throw new LexerError(`Invalid token: ${keyword}`);
    }

    return tokenType;
  }
}
