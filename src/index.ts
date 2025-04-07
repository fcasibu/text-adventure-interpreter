import { Lexer } from './lexer';
import fs from 'fs/promises';
import path from 'path';
import { Parser } from './parser';
import { SymbolParser } from './symbols';

async function main() {
  const source = await fs.readFile(
    path.join(__dirname, 'programs', 'main.scribe'),
    'utf8',
  );

  const lexer = new Lexer(source);

  const tokens = lexer.tokenize();
  const symbolParser = new SymbolParser(tokens);
  const parser = new Parser(tokens, symbolParser.parse());
  console.log(JSON.stringify(parser.parse(), null, 2));
}

void main();
