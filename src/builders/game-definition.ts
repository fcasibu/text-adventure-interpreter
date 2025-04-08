import { strict as assert } from 'assert';
import { PLAYER_LOCATION_VAR } from '../constants/parser';
import {
  ItemInteractions,
  NamedEntities,
  type GameDefinition,
  type GameVariableDefinition,
  type ItemDefinition,
  type ItemId,
  type SymbolDefinition,
} from '../types';
import { ReferenceError, UndefinedIdentifierError } from '../errors/parser';

export class GameDefinitionBuilder {
  private gameDefinition: GameDefinition = {
    variables: {
      playerLocation: {
        name: '',
        type: 'ID',
        initialValue: '',
        line: 0,
        col: 0,
      },
    },
    items: {},
    rooms: {},
    commands: [],
    scripts: {
      displayRoomInfo: {
        id: '',
        body: [],
        line: 0,
        col: 0,
      },
    },
    playerStartLocation: '',
  };

  public build() {
    return this.gameDefinition;
  }

  public setInitialItemDefinition(
    definition: Pick<ItemDefinition, 'id' | 'name' | 'line' | 'col'>,
  ) {
    this.gameDefinition.items[definition.id] = {
      id: definition.id,
      name: definition.name,
      line: definition.line,
      col: definition.col,
      desc: '',
      initialLocation: '',
      interactions: [],
    };

    return this;
  }

  public setItemDesc(itemId: ItemId, desc: string) {
    assert(
      this.gameDefinition.items[itemId],
      'setInitialItemDefinition must be called first',
    );

    this.gameDefinition.items[itemId].desc = desc;

    return this;
  }

  public setItemLocation(itemId: ItemId, location: string) {
    assert(
      this.gameDefinition.items[itemId],
      'setInitialItemDefinition must be called first',
    );

    this.gameDefinition.items[itemId].initialLocation = location;

    return this;
  }

  public setItemInteraction(itemId: ItemId, interaction: ItemInteractions) {
    assert(
      this.gameDefinition.items[itemId],
      'setInitialItemDefinition must be called first',
    );

    this.gameDefinition.items[itemId].interactions.push(interaction);

    return this;
  }

  public setVariable(
    variableName: string,
    data: GameVariableDefinition,
    symbols: Readonly<Map<string, SymbolDefinition>>,
  ) {
    if (data.type === 'ID') {
      assert(
        typeof data.initialValue === 'string',
        `Invalid format found for ID for variable ${variableName}`,
      );

      const referencedSymbol = symbols.get(data.initialValue);

      if (!referencedSymbol) {
        throw new UndefinedIdentifierError(
          'Identifier',
          data.initialValue,
          data.line,
          data.col,
        );
      }

      if (variableName === PLAYER_LOCATION_VAR) {
        if (referencedSymbol.type !== NamedEntities.ROOM) {
          throw new ReferenceError(
            `Variable '${variableName}' expected assignment of ROOM ID, but '${data.initialValue}' is type ${referencedSymbol.type}`,
            data.line,
            data.col,
          );
        }

        this.gameDefinition.playerStartLocation = data.initialValue;
      }
    }

    this.gameDefinition.variables[variableName] = data;

    return this;
  }
}
