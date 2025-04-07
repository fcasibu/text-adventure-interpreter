// prettier-ignore
export enum TokenType {
  // Keywords
  VAR, ITEM, DESC, LOCATION, TAKEABLE, ID, ROOM, COMMAND, EFFECT, EXECUTE,
  SCRIPT, MESSAGE, IF, HAS, ITEMS, THEN, FOR, IN, DO, ENDIF, ENDFOR, ENDSCRIPT,
  LOOK,

  // Literals/variable name
  STRING, BOOL, NUMBER, IDENT,

  // one or more characters
  ASSIGNMENT, DOT, LBRACKET, RBRACKET, EQ, EOL,

  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}
