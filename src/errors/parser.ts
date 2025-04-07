export class VariableAlreadyDefinedError extends Error {
  constructor(
    name: string,
    varLine: number,
    varCol: number,
    currentLine: number,
    currentCol: number,
  ) {
    super(
      `${currentLine}:${currentCol}: Variable "${name}" already defined at Line ${varLine}, Column ${varCol}`,
    );
    this.name = 'VariableAlreadyDefinedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VariableAlreadyDefinedError);
    }
  }
}

export class MissingVariableNameError extends Error {
  constructor(line: number, col: number) {
    super(
      `${line}:${col}: Invalid definition of a variable, missing identifier.`,
    );
    this.name = 'MissingVariableNameError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingVariableNameError);
    }
  }
}

export class MissingItemIdentifierError extends Error {
  constructor(line: number, col: number) {
    super(
      `${line}:${col}: Item missing an identifier. Define an item with ID=<identifier>`,
    );
    this.name = 'MissingItemIdentifier';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingItemIdentifierError);
    }
  }
}

export class ItemAlreadyDefinedError extends Error {
  constructor(
    name: string,
    itemLine: number,
    itemCol: number,
    currentLine: number,
    currentCol: number,
  ) {
    super(
      `${currentLine}:${currentCol}: Item "${name}" already defined at Line ${itemLine}, Column ${itemCol}`,
    );
    this.name = 'ItemAlreadyDefinedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ItemAlreadyDefinedError);
    }
  }
}

export class MissingRoomIdentifierError extends Error {
  constructor(line: number, col: number) {
    super(`${line}:${col}: Room missing an identifier.`);
    this.name = 'MissingRoomIdentifier';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingRoomIdentifierError);
    }
  }
}

export class RoomAlreadyDefinedError extends Error {
  constructor(
    name: string,
    itemLine: number,
    itemCol: number,
    currentLine: number,
    currentCol: number,
  ) {
    super(
      `${currentLine}:${currentCol}: Room "${name}" already defined at Line ${itemLine}, Column ${itemCol}`,
    );
    this.name = 'RoomAlreadyDefinedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RoomAlreadyDefinedError);
    }
  }
}

export class MissingScriptIdentifierError extends Error {
  constructor(line: number, col: number) {
    super(`${line}:${col}: Script missing an identifier`);
    this.name = 'MissingScriptIdentifier';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingScriptIdentifierError);
    }
  }
}

export class ScriptAlreadyDefinedError extends Error {
  constructor(
    name: string,
    itemLine: number,
    itemCol: number,
    currentLine: number,
    currentCol: number,
  ) {
    super(
      `${currentLine}:${currentCol}: Script "${name}" already defined at Line ${itemLine}, Column ${itemCol}`,
    );
    this.name = 'ScriptAlreadyDefinedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScriptAlreadyDefinedError);
    }
  }
}

export class UnterminatedBlockError extends Error {
  constructor(startLine: number, startCol: number) {
    super(`${startLine}:${startCol}: Missing End Block`);
    this.name = 'UnterminatedBlockError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnterminatedBlockError);
    }
  }
}

export class UnexpectedTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnexpectedTokenError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedTokenError);
    }
  }
}

export class UndefinedIdentifierError extends Error {
  constructor(type: string, identifier: string, line: number, col: number) {
    super(`${line}:${col}: Unknown ${type} "${identifier}"`);
    this.name = 'UndefinedIdentifierError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UndefinedIdentifierError);
    }
  }
}

export class ReferenceError extends Error {
  constructor(message: string, line: number, col: number) {
    super(`${line}:${col}: ${message}`);
    this.name = 'ReferenceError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ReferenceError);
    }
  }
}
