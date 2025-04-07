import { strict as assert } from 'assert';
import {
  TokenType,
  type GameDefinition,
  type SymbolDefinition,
  type Token,
  type VariableType,
  type VariableValue,
} from './types';
import {
  InvalidNumberFormatError,
  UndefinedIdentifierError,
  UnexpectedTokenError,
} from './errors/parser';
import { GameDefinitionBuilder } from './builders/game-definition';

export class Parser {
  private currentToken: Token;
  private currentPosition = 0;
  private gameDefinitionBuilder = new GameDefinitionBuilder();

  constructor(
    private readonly tokens: Token[],
    private readonly symbolsMap: Map<string, SymbolDefinition>,
  ) {
    this.currentToken = tokens[this.currentPosition]!;
  }

  public parse(): GameDefinition {
    if (!this.tokens.length) return this.gameDefinitionBuilder.build();

    while (!this.eof()) {
      switch (this.currentToken.type) {
        case TokenType.VAR: {
          this.parseVariableDefinition();
          break;
        }
        // TODO(fcasibu): other token types
        default: {
          this.consume(); // ignore other things for now
        }
      }
    }

    return this.gameDefinitionBuilder.build();
  }

  private parseVariableDefinition() {
    assert(
      this.currentToken.type === TokenType.VAR,
      'parseVariableDefinition should only be called for a variable',
    );

    this.consume(); // skip var keyword

    const { value: variableName, line, col } = this.currentToken;

    if (!this.symbolsMap.has(variableName)) {
      throw new UndefinedIdentifierError('Variablel', variableName, line, col);
    }

    this.expect(TokenType.IDENT, 'Expected variable identifier after VAR');
    this.expect(
      TokenType.ASSIGNMENT,
      `Expected "=" after variable ${variableName}`,
    );

    const { variableValue, variableType } = this.parseVariableValue();

    this.gameDefinitionBuilder.setVariable(
      variableName,
      {
        name: variableName,
        type: variableType,
        line,
        col,
        initialValue: variableValue,
      },
      this.symbolsMap,
    );

    this.consume();
    this.expect(
      TokenType.EOL,
      `Expected end of line after variable value ${variableValue}`,
    );
  }

  private parseVariableValue(): {
    variableValue: VariableValue;
    variableType: VariableType;
  } {
    const valueToken = this.currentToken;
    let parsedInitialValue: VariableValue = '';
    let variableType: VariableType = 'STRING';

    switch (valueToken.type) {
      case TokenType.NUMBER: {
        const parsedNumber = parseFloat(valueToken.value);
        if (Number.isNaN(parsedNumber)) {
          throw new InvalidNumberFormatError(
            `Invalid number format: ${valueToken.value}`,
            valueToken.line,
            valueToken.col,
          );
        }

        parsedInitialValue = parsedNumber;
        variableType = 'NUMBER';
        break;
      }
      case TokenType.STRING: {
        parsedInitialValue = valueToken.value;
        variableType = 'STRING';
        break;
      }
      case TokenType.BOOL: {
        assert(
          valueToken.value === 'true' || valueToken.value === 'false',
          'Invalid boolean value',
        );

        parsedInitialValue = valueToken.value === 'true' ? true : false;
        variableType = 'BOOL';
        break;
      }
      case TokenType.IDENT: {
        const referencedId = valueToken.value;

        parsedInitialValue = referencedId;
        variableType = 'ID';
        break;
      }
      default: {
        throw new UnexpectedTokenError(
          `Unexpected token type ${valueToken.type} for variable value assignment`,
          valueToken.line,
          valueToken.col,
        );
      }
    }

    return { variableValue: parsedInitialValue, variableType: variableType };
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

  private static match(tokenType: TokenType, toMatchTokenType: TokenType) {
    return tokenType === toMatchTokenType;
  }

  private expect(tokenType: TokenType, message: string) {
    if (!Parser.match(this.currentToken.type, tokenType)) {
      throw new UnexpectedTokenError(
        message,
        this.currentToken.line,
        this.currentToken.col,
      );
    }

    this.consume();
  }

  private eof() {
    return this.currentToken.type === TokenType.EOF;
  }
}
