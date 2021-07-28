import fs from 'fs';
import { BlockTypes, Tokens } from './tokens';
import { SyntaxErrors } from './errors';
import i18n from './i18n/en.json';
import chalk from 'chalk';

export type AbstractSyntaxTree = Block[];

export class QshSyntaxError {
  constructor(
    public code: number,
    public message: string,
    public fatal: boolean,
    public line: number,
    public char: number,
    public ends?: number
  ) {
    this.code = code;
    this.message = message;
    this.line = line;
    this.char = char;
    this.ends = ends;
  }
}

export class Block {
  public id: number;
  public value?: string;
  constructor(
    public children: (Token | Block)[],
    public parent: Block,
    public type: BlockTypes
  ) {
    this.children = children;
    this.parent = parent;
    this.type = type;
    Object.defineProperty(this, 'value', { enumerable: false });
    Object.defineProperty(this, 'id', {
      value: ~~(Math.random() * 10000),
      enumerable: false,
    });
  }

  resolve() {
    if (this.children.every((v) => v.type === Tokens.Character)) {
      Object.defineProperty(this, 'children', { enumerable: false });
      Object.defineProperty(this, 'value', {
        enumerable: true,
        value: this.children.reduce((a, b) => a + b.value, ''),
      });
    }
    return this;
  }
}
export class Token {
  constructor(public value: string, public type: Tokens, public parent: Block) {
    for (const [k, v] of Object.entries({ value, type, parent })) {
      // @ts-ignore
      this[k] = v;
    }
  }
}

export function parse(
  data: string | Buffer
): [ast: Block[], errors: QshSyntaxError[], data: string, aborted: boolean] {
  let errors: QshSyntaxError[] = [];
  function syntaxError(
    code: SyntaxErrors,
    fatal = false,
    lineNum = line,
    charStartNum = character - 1,
    charEndNum = character
  ) {
    errors.push(
      new QshSyntaxError(
        code,
        // @ts-ignore
        i18n[SyntaxErrors[code]],
        fatal,
        lineNum,
        charStartNum,
        charEndNum
      )
    );
    if (fatal) abort = true;
  }

  data = data.toString();
  const result: Block[] = [];
  function push(data: Token | Block, arr = current.children) {
    const i = arr.push(data) - 1;
    return arr[i];
  }
  function stepOut() {
    current.resolve();
    current = current.parent;
    function checkType() {
      if (current.type === BlockTypes.Statement) {
        current = current.parent;
        checkType();
      }
    }
    return 1;
  }
  let current = <Block>(
    push(new Block([], <Block>(<unknown>result), BlockTypes.File), result)
  );

  current = <Block>push(new Block([], current, BlockTypes.Statement));

  let character = 0;
  let line = 0;

  let isComment = false;
  let abort = false;
  let inQuotes = false;
  let quotes: '"' | "'" | '' = '';
  let inVar = false;
  let inVarBlock = false;

  for (const char of data.split('')) {
    character++;
    if (abort) break;
    switch (char) {
      case ';': {
        if (inQuotes) break;
        if (inVarBlock) syntaxError(SyntaxErrors.UnexpectedIdentifier);
        current.resolve();
        stepOut();
        current = <Block>(
          push(
            new Block([], current.parent, BlockTypes.Statement),
            current.children
          )
        );
        break;
      }
      case '\n': {
        if (isComment) isComment = !isComment;
        line++;
        character = 0;
        break;
      }
      case '#': {
        isComment = true;
        line++;
        break;
      }
      case ' ': {
        if (!inVar) {
          if (inQuotes) {
            push(new Token(' ', Tokens.Character, current));
          } else if (
            [BlockTypes.String, BlockTypes.Command].includes(current.type)
          ) {
            stepOut();
          }
        } else {
          inVar = false;
          stepOut();
        }
        break;
      }
      case "'": {
        if (inQuotes && quotes === "'") {
          inQuotes = false;
          quotes = '';
          stepOut();
        } else if (inQuotes) {
          current.children.push(new Token("'", Tokens.Character, current));
        } else {
          inQuotes = true;
          quotes = "'";
        }
        break;
      }
      case '"': {
        if (inQuotes && quotes === '"') {
          inQuotes = false;
          quotes = '';
        } else if (inQuotes) {
          current.children.push(new Token('"', Tokens.Character, current));
        } else {
          inQuotes = true;
          quotes = '"';
        }
        break;
      }
      case '@':
      case '$': {
        if (inVar) syntaxError(SyntaxErrors.UnexpectedIdentifier);
        current = <Block>(
          push(
            new Block([], current, BlockTypes.GenericVariableReference),
            current.children
          )
        );
        if (char === '$') {
          current.type = BlockTypes.EnvironmentVariableReference;
        } else {
          current.type = BlockTypes.ScopedVariableReference;
        }
        inVar = true;
        break;
      }
      case '{': {
        if (inVar) {
          inVarBlock = true;
        } else {
          syntaxError(SyntaxErrors.UnexpectedIdentifier);
        }
        break;
      }
      case '}': {
        if (!inVar) {
          syntaxError(SyntaxErrors.UnexpectedIdentifier);
        } else {
          inVarBlock = false;
        }
        break;
      }
      default: {
        if (isComment) break;
        if (
          current.children.length === 0 &&
          current.type === BlockTypes.Statement
        ) {
          current = <Block>push(new Block([], current, BlockTypes.Command));
        } else if (current.type === BlockTypes.Statement) {
          current = <Block>push(new Block([], current, BlockTypes.String));
        }
        current.children.push(new Token(char, Tokens.Character, current));
        break;
      }
    }
  }
  return [result.filter((v) => v.children.length), errors, data, abort];
}

export function parseFile(name: string) {
  let path: string | number = name;
  if (name === '-') path = 0;
  const data = fs.readFileSync(path);

  return parse(data);
}

export function formatError(error: QshSyntaxError, data: string, file: string) {
  let line = data.split('\n')[error.line];
  if (!line) line = data.split('\n')[error.line - 1];
  line =
    line.slice(0, error.char) +
    chalk.bold(line.slice(error.char, error.ends || line.length - 1)) +
    line.slice(error.ends || line.length - 1, line.length) +
    '\n' +
    '\t    \t' +
    ' '.repeat(error.char) +
    chalk.redBright('^'.repeat((error.ends || line.length - 1) - error.char));

  return chalk`{blueBright ${file.replace(/^\.\//g, '')}}{grey :}{yellow ${
    error.line
  }}{grey :}{yellow ${error.char}} ${
    error.fatal ? chalk.ansi256(165)('FATAL ') : ''
  }{redBright error} {grey [}{yellowBright ${error.code}}{grey ]:} ${
    error.message
  }\n\t{grey at:} \t${line}`;
}
