// prettier-ignore
export enum NamedEntities {
  VARIABLE, ITEM, ROOM, SCRIPT
}

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

export interface SymbolDefinition {
  type: NamedEntities;
  definitionLine: number;
  definitionColumn: number;
}

export type EntityId = string;
export type RoomId = EntityId;
export type ItemId = EntityId;
export type VariableName = string;
export type ScriptId = string;
export type CommandVerb = string;

export interface VariableAccessExpression {
  kind: 'variableAccess';
  variableName: string;
  line: number;
  col: number;
}

export interface IndexedAccessExpression {
  kind: 'indexedAccess';
  object: VariableAccessExpression;
  index: VariableAccessExpression;
  line: number;
  col: number;
}

export interface PropertyAccessExpression {
  kind: 'propertyAccess';
  object: VariableAccessExpression | IndexedAccessExpression;
  propertyName: string;
  line: number;
  col: number;
}

export interface HasItemsCondition {
  kind: 'hasItems';
  target: IndexedAccessExpression;
  line: number;
  col: number;
}

export interface ComparisonCondition {
  kind: 'comparison';
  left: PropertyAccessExpression;
  operator: '==';
  right: VariableAccessExpression;
  line: number;
  col: number;
}

export type Condition = HasItemsCondition | ComparisonCondition;

export interface MessageAction {
  kind: 'message';
  messageTemplate: string;
  line: number;
  col: number;
}

export interface IfAction {
  kind: 'if';
  condition: Condition;
  thenBranch: ScriptBlock;
  line: number;
  col: number;
}

export interface ForAction {
  kind: 'for';
  variableName: string;
  collection: PropertyAccessExpression;
  body: ScriptBlock;
  line: number;
  col: number;
}

export type ScriptAction = MessageAction | IfAction | ForAction;
export type ScriptBlock = ScriptAction[];

export interface GameVariableDefinition {
  name: VariableName;
  initialValue: RoomId;
  line: number;
  col: number;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  desc: string;
  initialLocation: RoomId;
  isTakeable: boolean;
  line: number;
  col: number;
}

export interface RoomDefinition {
  id: RoomId;
  name: string;
  desc: string;
  line: number;
  col: number;
}

export interface CallScriptEffect {
  kind: 'callScript';
  scriptId: ScriptId;
  line: number;
  col: number;
}

export interface CommandDefinition {
  verb: CommandVerb;
  effect: CallScriptEffect;
  line: number;
  col: number;
}

export interface ScriptDefinition {
  id: ScriptId;
  body: ScriptBlock;
  line: number;
  col: number;
}

export interface GameDefinition {
  variables: {
    playerLocation: GameVariableDefinition;
  };
  items: Record<ItemId, ItemDefinition>;
  rooms: Record<RoomId, RoomDefinition>;
  commands: CommandDefinition[];
  scripts: {
    displayRoomInfo: ScriptDefinition;
  };
  playerStartLocation: RoomId;
}
