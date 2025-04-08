import { strict as assert } from 'assert';
import {
  NamedEntities,
  TokenType,
  type SymbolDefinition,
  type Token,
} from './types';
import {
  ItemAlreadyDefinedError,
  MissingItemIdentifierError,
  MissingRoomIdentifierError,
  MissingScriptIdentifierError,
  MissingVariableNameError,
  RoomAlreadyDefinedError,
  ScriptAlreadyDefinedError,
  UnexpectedTokenError,
  UnterminatedBlockError,
  VariableAlreadyDefinedError,
} from './errors/parser';

export class SymbolParser {
  private symbolsMap = new Map<string, SymbolDefinition>();
  private currentToken: Token;
  private currentPosition = 0;

  constructor(private readonly tokens: Token[]) {
    this.currentToken = tokens[this.currentPosition]!;
  }

  public parse() {
    if (!this.tokens.length) return this.symbolsMap;

    while (!this.eof()) {
      switch (this.currentToken.type) {
        case TokenType.VAR: {
          this.parseVariableDefinition();
          break;
        }
        case TokenType.ITEM: {
          this.parseItemDefinition();
          break;
        }

        case TokenType.ROOM: {
          this.parseRoomDefinition();
          break;
        }

        case TokenType.SCRIPT: {
          this.parseScriptDefinition();
          break;
        }
        default: {
          this.consume(); // ignore other things
        }
      }
    }
    return this.symbolsMap;
  }

  private parseVariableDefinition() {
    this.expect(TokenType.VAR, `Expected VAR found ${this.currentToken.value}`);

    const { value, line, col, type } = this.currentToken;

    if (!SymbolParser.match(type, TokenType.IDENT)) {
      throw new MissingVariableNameError(line, col);
    }

    if (this.symbolsMap.has(value)) {
      const symbol = this.symbolsMap.get(value);
      assert(symbol);

      throw new VariableAlreadyDefinedError(
        value,
        symbol.definitionLine,
        symbol.definitionColumn,
        line,
        col,
      );
    }

    this.symbolsMap.set(
      value,
      SymbolParser.createSymbol(NamedEntities.VARIABLE, line, col),
    );

    this.skipToNextLine();
  }

  private parseItemDefinition() {
    this.expect(
      TokenType.ITEM,
      `Expected ITEM found ${this.currentToken.value}`,
    );
    this.expect(
      TokenType.STRING,
      `Expected string name for ITEM found ${this.currentToken.value}`,
    );
    this.expect(TokenType.ID, 'Expected "ID" keyword after item name.');
    this.expect(
      TokenType.ASSIGNMENT,
      'Expected "=" keyword after "ID" keyword.',
    );

    const { type, value, line, col } = this.currentToken;
    if (!SymbolParser.match(type, TokenType.IDENT)) {
      throw new MissingItemIdentifierError(line, col);
    }

    if (this.symbolsMap.has(value)) {
      const symbol = this.symbolsMap.get(value);
      assert(symbol);

      throw new ItemAlreadyDefinedError(
        value,
        symbol.definitionLine,
        symbol.definitionColumn,
        line,
        col,
      );
    }

    this.symbolsMap.set(
      value,
      SymbolParser.createSymbol(NamedEntities.ITEM, line, col),
    );

    this.consume(); // skip EOL
    this.expect(TokenType.EOL, `Expected EOL found ${this.currentToken.value}`);
  }

  private parseRoomDefinition() {
    this.expect(
      TokenType.ROOM,
      `Expected ROOM found ${this.currentToken.value}`,
    );
    this.expect(
      TokenType.STRING,
      `Expected string name for ROOM found ${this.currentToken.value}`,
    );
    this.expect(TokenType.ID, 'Expected "ID" after room name');
    this.expect(TokenType.ASSIGNMENT, 'Expected "=" after "ID" keyword');

    const { type, value, line, col } = this.currentToken;
    if (!SymbolParser.match(type, TokenType.IDENT)) {
      throw new MissingRoomIdentifierError(line, col);
    }

    if (this.symbolsMap.has(value)) {
      const symbol = this.symbolsMap.get(value);
      assert(symbol);

      throw new RoomAlreadyDefinedError(
        value,
        symbol.definitionLine,
        symbol.definitionColumn,
        line,
        col,
      );
    }

    this.symbolsMap.set(
      value,
      SymbolParser.createSymbol(NamedEntities.ROOM, line, col),
    );

    this.consume(); // skip EOL
    this.expect(TokenType.EOL, `Expected EOL found ${this.currentToken.value}`);
  }

  private parseScriptDefinition() {
    this.expect(
      TokenType.SCRIPT,
      `Expected SCRIPT found ${this.currentToken.value}`,
    );

    const { type, value, line, col } = this.currentToken;
    if (!SymbolParser.match(type, TokenType.IDENT)) {
      throw new MissingScriptIdentifierError(line, col);
    }

    if (this.symbolsMap.has(value)) {
      const symbol = this.symbolsMap.get(value);
      assert(symbol);

      throw new ScriptAlreadyDefinedError(
        value,
        symbol.definitionLine,
        symbol.definitionColumn,
        line,
        col,
      );
    }

    this.symbolsMap.set(
      value,
      SymbolParser.createSymbol(NamedEntities.SCRIPT, line, col),
    );

    this.skipBlock(this.currentToken, TokenType.ENDSCRIPT);
  }

  private consume() {
    assert(
      this.currentPosition < this.tokens.length,
      `Consume attempted out of bounds. Current position: ${this.currentPosition}, Length: ${this.tokens.length}`,
    );

    this.currentPosition += 1;
    const token = this.tokens[this.currentPosition];
    assert(token);

    this.currentToken = token;
  }

  private skipToNextLine() {
    while (!this.eol()) {
      this.consume();
    }

    assert(
      SymbolParser.match(this.currentToken.type, TokenType.EOL),
      `Encountered an invalid token, Type: ${this.currentToken.type}, Value: ${this.currentToken.value}`,
    );

    this.consume(); // consume new line itself
  }

  private skipBlock(startToken: Token, endTokenType: TokenType) {
    while (
      !SymbolParser.match(this.currentToken.type, endTokenType) &&
      !this.eof()
    ) {
      this.consume();
    }

    if (!SymbolParser.match(this.currentToken.type, endTokenType)) {
      throw new UnterminatedBlockError(startToken.line, startToken.col);
    }
  }

  private static match(tokenType: TokenType, toMatchTokenType: TokenType) {
    return tokenType === toMatchTokenType;
  }

  private expect(tokenType: TokenType, message: string) {
    if (!SymbolParser.match(this.currentToken.type, tokenType)) {
      throw new UnexpectedTokenError(
        message,
        this.currentToken.line,
        this.currentToken.col,
      );
    }

    this.consume();
  }

  private eol() {
    return this.currentToken.type === TokenType.EOL;
  }

  private eof() {
    return this.currentToken.type === TokenType.EOF;
  }

  private static createSymbol(
    type: NamedEntities,
    line: number,
    col: number,
  ): SymbolDefinition {
    return { type, definitionColumn: col, definitionLine: line };
  }
}
