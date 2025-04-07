import { Lexer } from './lexer';
import fs from 'fs/promises';
import path from 'path';
import { TokenType, type Token } from './types';

async function main() {
  const source = await fs.readFile(
    path.join(__dirname, 'programs', 'main.scribe'),
    'utf8',
  );

  const lexer = new Lexer(source);

  lexer.tokenize().map(debug);
}

void main();

function debug(token: Token) {
  console.log(
    `main.scribe:${token.line}:${token.col} Token type: ${getTokenTypeName(token.type)}, Value: ${token.value}`,
  );
}

function getTokenTypeName(type: TokenType): string {
  const typeNames: Record<TokenType, string> = {
    [TokenType.VAR]: 'VAR',
    [TokenType.ITEM]: 'ITEM',
    [TokenType.DESC]: 'DESC',
    [TokenType.LOCATION]: 'LOCATION',
    [TokenType.TAKEABLE]: 'TAKEABLE',
    [TokenType.ID]: 'ID',
    [TokenType.ROOM]: 'ROOM',
    [TokenType.COMMAND]: 'COMMAND',
    [TokenType.EFFECT]: 'EFFECT',
    [TokenType.EXECUTE]: 'EXECUTE',
    [TokenType.SCRIPT]: 'SCRIPT',
    [TokenType.MESSAGE]: 'MESSAGE',
    [TokenType.IF]: 'IF',
    [TokenType.HAS]: 'HAS',
    [TokenType.ITEMS]: 'ITEMS',
    [TokenType.THEN]: 'THEN',
    [TokenType.FOR]: 'FOR',
    [TokenType.IN]: 'IN',
    [TokenType.DO]: 'DO',
    [TokenType.ENDIF]: 'ENDIF',
    [TokenType.ENDFOR]: 'ENDFOR',
    [TokenType.ENDSCRIPT]: 'ENDSCRIPT',
    [TokenType.LOOK]: 'LOOK',
    [TokenType.STRING]: 'STRING',
    [TokenType.BOOL]: 'BOOL',
    [TokenType.NUMBER]: 'NUMBER',
    [TokenType.IDENT]: 'IDENTIFIER',
    [TokenType.ASSIGNMENT]: 'ASSIGNMENT',
    [TokenType.DOT]: 'DOT',
    [TokenType.LBRACKET]: 'LEFT_BRACKET',
    [TokenType.RBRACKET]: 'RIGHT_BRACKET',
    [TokenType.EQ]: 'EQUALS',
    [TokenType.EOL]: 'END_OF_LINE',
    [TokenType.EOF]: 'END_OF_FILE',
  };

  return typeNames[type] || `UNKNOWN_TOKEN_TYPE(${type})`;
}
