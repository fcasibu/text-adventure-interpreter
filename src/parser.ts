import { strict as assert } from 'assert';
import {
  ItemInteractions,
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

        case TokenType.ITEM: {
          this.parseItemDefinition();
          break;
        }

        case TokenType.EOL: {
          this.consume();
          break;
        }

        default: {
          throw new UnexpectedTokenError(
            `Unexpected token ${this.currentToken.value}`,
            this.currentToken.line,
            this.currentToken.col,
          );
        }
      }
    }

    return this.gameDefinitionBuilder.build();
  }

  private parseVariableDefinition() {
    this.expect(TokenType.VAR, `Expected VAR found ${this.currentToken.value}`);

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

    this.consume(); // skip variable value
    this.expect(TokenType.EOL, `Expected EOL found ${this.currentToken.value}`);
  }

  private parseItemDefinition() {
    const { line: itemLine, col: itemCol } = this.currentToken;
    this.expect(
      TokenType.ITEM,
      `Expected ITEM found ${this.currentToken.value}`,
    );
    const { value: name } = this.currentToken;

    this.expect(
      TokenType.STRING,
      `Expected string name of ITEM found ${this.currentToken.value}`,
    );

    this.expect(TokenType.ID, 'Expected "ID" keyword after item name.');
    this.expect(TokenType.ASSIGNMENT, 'Expected "=" after "ID"');

    const { value: identifier, line: idLine, col: idCol } = this.currentToken;

    if (!this.symbolsMap.has(identifier)) {
      throw new UndefinedIdentifierError(
        'Identifier',
        identifier,
        idLine,
        idCol,
      );
    }

    this.expect(
      TokenType.IDENT,
      `Expected Identifier for ITEM found ${this.currentToken.value}`,
    );
    this.expect(TokenType.EOL, `Expected EOL found ${this.currentToken.value}`);

    this.gameDefinitionBuilder.setInitialItemDefinition({
      id: identifier,
      name,
      line: itemLine,
      col: itemCol,
    });

    const itemProperties = new Set([
      TokenType.DESC,
      TokenType.LOCATION,
      TokenType.TAKEABLE,
    ]);

    while (itemProperties.has(this.currentToken.type)) {
      switch (this.currentToken.type) {
        case TokenType.DESC: {
          this.expect(
            TokenType.DESC,
            `Expected DESC found ${this.currentToken.value}`,
          );
          const { variableValue, variableType } = this.parseVariableValue();
          assert(
            typeof variableValue === 'string',
            `Invalid value type ${variableType}`,
          );

          this.gameDefinitionBuilder.setItemDesc(identifier, variableValue);

          this.consume(); // skip value
          this.expect(
            TokenType.EOL,
            `Expected end of line found ${this.currentToken.value}`,
          );
          break;
        }

        case TokenType.LOCATION: {
          this.expect(
            TokenType.LOCATION,
            `Expected LOCATION found ${this.currentToken.value}`,
          );
          this.expect(TokenType.ASSIGNMENT, `Expected "=" after "LOCATION"`);
          const { variableValue, variableType } = this.parseVariableValue();
          assert(
            typeof variableValue === 'string',
            `Invalid value type ${variableType}`,
          );

          if (!this.symbolsMap.has(variableValue)) {
            throw new UndefinedIdentifierError(
              'Identifier for ITEM LOCATION',
              variableValue,
              this.currentToken.line,
              this.currentToken.col,
            );
          }
          this.gameDefinitionBuilder.setItemLocation(identifier, variableValue);

          this.consume(); // skip value
          this.expect(
            TokenType.EOL,
            `Expected end of line found ${this.currentToken.value}`,
          );
          break;
        }

        case TokenType.TAKEABLE: {
          this.expect(
            TokenType.TAKEABLE,
            `Expected TAKEABLE found ${this.currentToken.value}`,
          );
          this.expect(TokenType.ASSIGNMENT, `Expected "=" after "TAKEABLE"`);

          const { variableValue, variableType } = this.parseVariableValue();
          assert(
            typeof variableValue === 'boolean',
            `Invalid value type ${variableType}`,
          );

          if (variableValue) {
            this.gameDefinitionBuilder.setItemInteraction(
              identifier,
              ItemInteractions.Takeable,
            );
          }

          this.consume(); // skip value
          this.expect(
            TokenType.EOL,
            `Expected end of line found ${this.currentToken.value}`,
          );
          break;
        }
        default:
          break;
      }
    }
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
          `Unexpected token ${valueToken.value} for variable value assignment`,
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
