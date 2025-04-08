import { strict as assert } from 'assert';
import {
  ItemInteractions,
  TokenType,
  type CollectionCheckCondition,
  type ComparisonCondition,
  type Condition,
  type Expression,
  type ForAction,
  type GameDefinition,
  type IfAction,
  type MessageAction,
  type ScriptAction,
  type ScriptBlock,
  type SymbolDefinition,
  type Token,
  type VariableAccessExpression,
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

        case TokenType.ROOM: {
          this.parseRoomDefinition();
          break;
        }

        case TokenType.COMMAND: {
          this.parseCommandDefinition();
          break;
        }

        case TokenType.SCRIPT: {
          this.parseScriptDefinition();
          break;
        }

        case TokenType.EOL: {
          this.consume();
          break;
        }

        default: {
          this.consume();
          break;
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
    const { value: name } = this.expect(
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
          const { variableValue } = this.parseObjectDescription();

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

  private parseRoomDefinition() {
    const { line: roomLine, col: roomCol } = this.currentToken;
    this.expect(
      TokenType.ROOM,
      `Expected ROOM found ${this.currentToken.value}`,
    );
    const { value: name } = this.expect(
      TokenType.STRING,
      `Expected string name of ITEM found ${this.currentToken.value}`,
    );

    this.expect(TokenType.ID, 'Expected "ID" keyword after ROOM name.');
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

    this.gameDefinitionBuilder.setInitialRoomDefinition({
      id: identifier,
      name,
      line: roomLine,
      col: roomCol,
    });

    const roomProperties = new Set([TokenType.DESC]);

    while (roomProperties.has(this.currentToken.type)) {
      switch (this.currentToken.type) {
        case TokenType.DESC: {
          const { variableValue } = this.parseObjectDescription();
          this.gameDefinitionBuilder.setRoomDesc(identifier, variableValue);

          this.consume(); // skip value
          this.expect(
            TokenType.EOL,
            `Expected end of line found ${this.currentToken.value}`,
          );
          break;
        }

        default:
          throw new Error('not yet implemented');
      }
    }
  }

  private parseCommandDefinition() {
    const { line: commandLine, col: commandCol } = this.currentToken;
    this.expect(
      TokenType.COMMAND,
      `Expected COMMAND found ${this.currentToken.value}`,
    );

    const { value: commandVerb } = this.expect(
      TokenType.STRING,
      `Expected string name of COMMAND found ${this.currentToken.value}`,
    );

    this.expect(
      TokenType.EOL,
      `Expected EOL after COMMAND name found ${this.currentToken.value}`,
    );

    const commandProperties = new Set([TokenType.EFFECT]);

    while (commandProperties.has(this.currentToken.type)) {
      const { line: effectLine, col: effectCol } = this.currentToken;
      this.expect(
        TokenType.EFFECT,
        `Expected EFFECT found ${this.currentToken.value}`,
      );

      switch (this.currentToken.type) {
        case TokenType.EXECUTE: {
          this.consume(); // skip EXECUTE keyword

          const {
            value: scriptName,
            line: scriptNameLine,
            col: scriptNameCol,
          } = this.currentToken;
          const referencedSymbol = this.symbolsMap.get(scriptName);

          if (!referencedSymbol) {
            throw new UndefinedIdentifierError(
              'Identifier',
              scriptName,
              scriptNameLine,
              scriptNameCol,
            );
          }

          this.gameDefinitionBuilder.addCommand({
            line: commandLine,
            col: commandCol,
            verb: commandVerb,
            effect: {
              kind: 'callScript',
              scriptId: scriptName,
              line: effectLine,
              col: effectCol,
            },
          });

          this.consume(); // skip value
          this.expect(
            TokenType.EOL,
            `Expected end of line found ${this.currentToken.value}`,
          );
          break;
        }
        default: {
          throw new UnexpectedTokenError(
            `Unexpected token ${this.currentToken.value} found within the effect block`,
            effectLine,
            effectCol,
          );
        }
      }
    }
  }

  private parseScriptDefinition() {
    const scriptToken = this.expect(
      TokenType.SCRIPT,
      `Expected SCRIPT found ${this.currentToken.value}`,
    );
    const nameToken = this.expect(
      TokenType.IDENT,
      'Expected script identifier after "SCRIPT"',
    );
    const scriptName = nameToken.value;

    this.expect(
      TokenType.EOL,
      `Expected EOL after SCRIPT identifier found ${this.currentToken.value}`,
    );

    this.gameDefinitionBuilder.setInitialScriptDefinition({
      id: scriptName,
      line: scriptToken.line,
      col: scriptToken.col,
    });

    const scriptBody: ScriptBlock = this.parseBlockUntil(TokenType.ENDSCRIPT);

    this.gameDefinitionBuilder.setScriptBody(scriptName, scriptBody);

    this.expect(
      TokenType.ENDSCRIPT,
      `Expected ENDSCRIPT for script '${scriptName}' but found ${this.currentToken.type}`,
    );
    this.expect(
      TokenType.EOL,
      `Expected EOL after ENDSCRIPT but found ${this.currentToken.value}`,
    );
  }

  private parseScriptAction(): ScriptAction {
    const actionToken = this.currentToken;
    switch (actionToken.type) {
      case TokenType.MESSAGE:
        return this.parseMessageAction();
      case TokenType.IF:
        return this.parseIfAction();
      case TokenType.FOR:
        return this.parseForAction();
      default:
        throw new UnexpectedTokenError(
          `Unexpected token type ${actionToken.value} inside script block. Expected action keyword (MESSAGE, IF, FOR, etc.).`,
          actionToken.line,
          actionToken.col,
        );
    }
  }

  private parseMessageAction(): MessageAction {
    this.expect(
      TokenType.MESSAGE,
      `Expected MESSAGE but found ${this.currentToken.value}`,
    );
    const messageLine = this.currentToken.line;
    const messageCol = this.currentToken.col;
    let actionData: Pick<MessageAction, 'messageTemplate' | 'valueExpression'>;

    if (Parser.match(this.currentToken.type, TokenType.IDENT)) {
      const expression = this.parseExpression();
      actionData = { valueExpression: expression };
    } else if (Parser.match(this.currentToken.type, TokenType.STRING)) {
      const templateToken = this.expect(
        TokenType.STRING,
        'Expected string literal after MESSAGE',
      );
      actionData = { messageTemplate: templateToken.value };
    } else {
      throw new UnexpectedTokenError(
        'Expected string literal or expression after MESSAGE',
        this.currentToken.line,
        this.currentToken.col,
      );
    }

    const messageAction: MessageAction = {
      kind: 'message',
      ...actionData,
      line: messageLine,
      col: messageCol,
    };

    this.expect(
      TokenType.EOL,
      `Expected end of line after MESSAGE statement content but found $${this.currentToken.value}`,
    );
    return messageAction;
  }

  private parseIfAction(): IfAction {
    const ifToken = this.expect(TokenType.IF, 'Expected "IF" keyword');
    const condition = this.parseCondition();
    this.expect(TokenType.THEN, 'Expected "THEN" keyword after IF condition');
    this.expect(TokenType.EOL, 'Expected end of line after THEN');

    // TODO(fcasibu): elseif/ else
    const thenBranch = this.parseBlockUntil(TokenType.ENDIF);

    this.expect(TokenType.ENDIF, 'Expected "ENDIF" to close IF statement');
    this.expect(TokenType.EOL, 'Expected end of line after ENDIF');

    const ifAction: IfAction = {
      kind: 'if',
      condition: condition,
      thenBranch: thenBranch,
      line: ifToken.line,
      col: ifToken.col,
    };
    return ifAction;
  }

  private parseForAction(): ForAction {
    const forToken = this.expect(TokenType.FOR, 'Expected "FOR" keyword');
    const variableToken = this.expect(
      TokenType.IDENT,
      'Expected loop variable name after FOR',
    );
    const variableName = variableToken.value;
    this.expect(TokenType.IN, 'Expected "IN" keyword after loop variable');
    const collectionExpr = this.parseExpression();

    if (
      collectionExpr.kind !== 'propertyAccess' &&
      collectionExpr.kind !== 'variableAccess' &&
      collectionExpr.kind !== 'indexedAccess'
    ) {
      throw new UnexpectedTokenError(
        'Invalid expression type found for FOR loop collection, found ${this.currentToken.value}',
        forToken.line,
        forToken.col,
      );
    }

    this.expect(
      TokenType.DO,
      'Expected "DO" keyword after collection expression',
    );
    this.expect(
      TokenType.EOL,
      `Expected end of line after DO but foudn ${this.currentToken.value}`,
    );

    const body = this.parseBlockUntil(TokenType.ENDFOR);

    this.expect(TokenType.ENDFOR, 'Expected "ENDFOR" to close FOR loop');
    this.expect(
      TokenType.EOL,
      `Expected end of line after ENDFOR but found ${this.currentToken.value}`,
    );

    const forAction: ForAction = {
      kind: 'for',
      variableName: variableName,
      collection: collectionExpr,
      body: body,
      line: forToken.line,
      col: forToken.col,
    };
    return forAction;
  }

  private parseCondition(): Condition {
    const startLine = this.currentToken.line;
    const startCol = this.currentToken.col;
    const leftExpr = this.parseExpression();

    if (Parser.match(this.currentToken.type, TokenType.HAS)) {
      this.consume();
      this.expect(TokenType.ITEMS, 'Expected "ITEMS" after "HAS"');

      if (
        leftExpr.kind !== 'indexedAccess' &&
        leftExpr.kind !== 'propertyAccess'
      ) {
        throw new UnexpectedTokenError(
          '"HAS ITEMS" condition requires a valid object/collection access',
          startLine,
          startCol,
        );
      }

      const condition: CollectionCheckCondition = {
        kind: 'collectionCheck',
        target: leftExpr,
        checkType: 'HAS_ITEMS',
        line: startLine,
        col: startCol,
      };
      return condition;
    } else if (Parser.match(this.currentToken.type, TokenType.EQ)) {
      this.consume();
      const rightExpr = this.parseExpression();

      const condition: ComparisonCondition = {
        kind: 'comparison',
        left: leftExpr,
        operator: '==',
        right: rightExpr,
        line: startLine,
        col: startCol,
      };
      return condition;
    } else {
      throw new UnexpectedTokenError(
        `Expected condition operator (HAS, ==) after expression, but found ${this.currentToken.type}`,
        this.currentToken.line,
        this.currentToken.col,
      );
    }
  }

  private parseBlockUntil(...endTokens: TokenType[]): ScriptBlock {
    const block: ScriptBlock = [];
    const endTokenSet = new Set(endTokens);

    while (!endTokenSet.has(this.currentToken.type)) {
      if (Parser.match(this.currentToken.type, TokenType.EOL)) {
        this.consume();
        continue;
      }
      block.push(this.parseScriptAction());
    }

    return block;
  }

  private parseExpression(): Expression {
    let leftExpr = this.parsePrimaryExpression();
    while (
      Parser.match(this.currentToken.type, TokenType.DOT) ||
      Parser.match(this.currentToken.type, TokenType.LBRACKET)
    ) {
      if (Parser.match(this.currentToken.type, TokenType.DOT)) {
        this.consume();
        const propertyToken = this.currentToken;
        if (!Parser.match(propertyToken.type, TokenType.IDENT)) {
          throw new UnexpectedTokenError(
            'Expected property name identifier after "."',
            propertyToken.line,
            propertyToken.col,
          );
        }
        this.consume();

        leftExpr = {
          kind: 'propertyAccess',
          object: leftExpr,
          propertyName: propertyToken.value,
          line: propertyToken.line,
          col: propertyToken.col,
        };
      } else if (Parser.match(this.currentToken.type, TokenType.LBRACKET)) {
        const lBracketToken = this.currentToken;
        this.consume();
        const indexExpr = this.parseExpression();
        this.expect(TokenType.RBRACKET, 'Expected "]" after index expression');

        leftExpr = {
          kind: 'indexedAccess',
          object: leftExpr,
          index: indexExpr,
          line: lBracketToken.line,
          col: lBracketToken.col,
        };
      }
    }

    return leftExpr;
  }

  private parsePrimaryExpression(): Expression {
    const token = this.currentToken;

    if (Parser.match(token.type, TokenType.IDENT)) {
      this.consume();
      const variableAccess: VariableAccessExpression = {
        kind: 'variableAccess',
        variableName: token.value,
        line: token.line,
        col: token.col,
      };
      return variableAccess;
    }

    throw new UnexpectedTokenError(
      `Expected expression start (Identifier or Literal), but found ${token.type}`,
      token.line,
      token.col,
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
          `Unexpected token ${valueToken.value} for variable value assignment`,
          valueToken.line,
          valueToken.col,
        );
      }
    }

    return { variableValue: parsedInitialValue, variableType: variableType };
  }

  private parseObjectDescription() {
    this.expect(
      TokenType.DESC,
      `Expected DESC found ${this.currentToken.value}`,
    );
    const { variableValue, variableType } = this.parseVariableValue();
    assert(
      typeof variableValue === 'string',
      `Invalid value type ${variableType}`,
    );

    return { variableValue, variableType };
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

  private expect(tokenType: TokenType, message: string): Token {
    const token = this.currentToken;
    if (!Parser.match(token.type, tokenType)) {
      throw new UnexpectedTokenError(
        message,
        this.currentToken.line,
        this.currentToken.col,
      );
    }

    this.consume();
    return token;
  }

  private eof() {
    return this.currentToken.type === TokenType.EOF;
  }

  private static match(tokenType: TokenType, toMatchTokenType: TokenType) {
    return tokenType === toMatchTokenType;
  }
}
