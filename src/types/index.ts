// prettier-ignore
export enum NamedEntities {
  VARIABLE, ITEM, ROOM, SCRIPT
}

// prettier-ignore
export enum TokenType {
  // Keywords
  VAR, ITEM, DESC, LOCATION, TAKEABLE, ID, ROOM, COMMAND, EFFECT, EXECUTE,
  SCRIPT, MESSAGE, IF, HAS, ITEMS, THEN, FOR, IN, DO, ENDIF, ENDFOR, ENDSCRIPT,

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

export interface BaseExpression {
  line: number;
  col: number;
}

export interface VariableAccessExpression extends BaseExpression {
  kind: 'variableAccess';
  variableName: string;
}

export interface IndexedAccessExpression extends BaseExpression {
  kind: 'indexedAccess';
  objectName: EntityId;
  index: VariableAccessExpression;
}

export interface PropertyAccessExpression extends BaseExpression {
  kind: 'propertyAccess';
  object: IndexedAccessExpression | VariableAccessExpression;
  propertyName: string;
}

export type Expression =
  | VariableAccessExpression
  | IndexedAccessExpression
  | PropertyAccessExpression;

export interface BaseCondition {
  line: number;
  col: number;
}

export interface CollectionCheckCondition extends BaseCondition {
  kind: 'collectionCheck';
  target: PropertyAccessExpression;
  checkType: 'HAS_ITEMS';
}

export interface ComparisonCondition extends BaseCondition {
  kind: 'comparison';
  left: Expression;
  operator: '==';
  right: Expression;
}

export type Condition = CollectionCheckCondition | ComparisonCondition;

export interface BaseScriptAction {
  line: number;
  col: number;
}

export interface MessageAction extends BaseScriptAction {
  kind: 'message';
  messageTemplate?: string;
  valueExpression?: Expression;
}

export interface IfAction extends BaseScriptAction {
  kind: 'if';
  condition: Condition;
  thenBranch: ScriptBlock;
}

export interface ForAction extends BaseScriptAction {
  kind: 'for';
  variableName: string;
  collection: PropertyAccessExpression;
  body: ScriptBlock;
}

export type ScriptAction = MessageAction | IfAction | ForAction;
export type ScriptBlock = ScriptAction[];

export interface CallScriptEffect {
  kind: 'callScript';
  scriptId: ScriptId;
  line: number;
  col: number;
}

export type VariableType = 'NUMBER' | 'STRING' | 'BOOL' | 'ID';
export type VariableValue = string | boolean | number;

export interface BaseDefinition {
  line: number;
  col: number;
}

export enum ItemInteractions {
  Takeable,
}

export interface GameVariableDefinition extends BaseDefinition {
  name: VariableName;
  type: VariableType;
  initialValue: VariableValue;
}

export interface ItemDefinition extends BaseDefinition {
  id: ItemId;
  name: string;
  desc: string;
  initialLocation: RoomId;
  interactions: ItemInteractions[];
}

export interface RoomDefinition extends BaseDefinition {
  id: RoomId;
  name: string;
  desc: string;
}

export interface CommandDefinition extends BaseDefinition {
  verb: CommandVerb;
  effect: CallScriptEffect;
}

export interface ScriptDefinition extends BaseDefinition {
  id: ScriptId;
  body: ScriptBlock;
}

export interface GameDefinition {
  variables: {
    // required variables to define (probably not good)
    playerLocation: GameVariableDefinition;
  } & Record<VariableName, GameVariableDefinition>;
  items: Record<ItemId, ItemDefinition>;
  rooms: Record<RoomId, RoomDefinition>;
  commands: CommandDefinition[];
  scripts: Record<ScriptId, ScriptDefinition>;
  playerStartLocation: RoomId;
}
