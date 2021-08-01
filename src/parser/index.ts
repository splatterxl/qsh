import fs from 'fs';
import { BlockTypes, Tokens } from './tokens';
import { SyntaxErrors } from './errors';
import i18n from './i18n/en.json';
import chalk from 'chalk';
import { ExitCodes } from '../exitcodes';

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
    let tmp = current;
    current = current.parent;
    if (tmp === current) {
      console.log('what');
    }
    return 1;
  }
  let current = <Block>(
    push(new Block([], <Block>(<unknown>result), BlockTypes.File), result)
  );

  <Block>push(new Block([], current, BlockTypes.Statement));

  let character = 0;
  let line = 0;

  let isComment = false;
  let isCommentBlock = false;
  let isCommentBlockEnd = false;
  let abort = false;
  let inQuotes = false;
  let quotes: '"' | "'" | '' = '';
  let inVar = false;
  let inVarBlock = false;
  let isFunction = false;
  let isFunctionBody = false;

  // the most imporant variable
  let isEscaped = false;

  for (const char of data.split('')) {
    if (isFunctionBody && char !== '}') {
      current.children.push(new Token(char, Tokens.Character, current));
      continue;
    }
    function pushEscaped(str = char) {
      current.children.push(new Token(str, Tokens.Character, current));
      isEscaped = false;
    }

    if (isCommentBlockEnd && char !== '#') continue;
    character++;
    if (abort) break;
    switch (char) {
      case '\\': {
        if (isEscaped) {
          pushEscaped();
          break;
        } else {
          isEscaped = true;
          break;
        }
      }
      case ';': {
        if (isEscaped || inQuotes) {
          pushEscaped();
          break;
        }
        if (isCommentBlock) {
          isCommentBlockEnd = true;
          break;
        }
        if (isComment) break;
        if (inVarBlock === true) {
          syntaxError(SyntaxErrors.UnexpectedIdentifier, true);
          break;
        }
        stepOut();
        current = <Block>(
          push(
            new Block([], current.parent, BlockTypes.Statement),
            current.parent.children
          )
        );
        break;
      }
      case '\n': {
        if (isEscaped) {
          break;
        }
        if (isComment && !isCommentBlock) isComment = !isComment;
        if (isComment && isCommentBlock) break;
        line++;
        character = 0;
        break;
      }
      case '#': {
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isCommentBlockEnd) {
          isCommentBlockEnd = false;
          isCommentBlock = false;
          isComment = false;
          break;
        }
        if (isComment) {
          isCommentBlock = true;
          break;
        }
        isComment = true;
        line++;
        break;
      }
      case ' ': {
        if (isEscaped) {
          // being escaped does nothing for space
          isEscaped = false;
        }
        if (isComment || current.children.length === 0) break;
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
        if (current.children[0].value === 'fn') {
          isFunction = true;
        }
        break;
      }
      case "'": {
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isComment) break;
        if (inQuotes && quotes === "'") {
          inQuotes = false;
          quotes = '';
          stepOut();
        } else if (inQuotes && quotes === '"') {
          current.children.push(new Token("'", Tokens.Character, current));
        } else {
          inQuotes = true;
          quotes = "'";
        }
        break;
      }
      case '"': {
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isComment) break;
        if (inQuotes && quotes === '"') {
          inQuotes = false;
          quotes = '';
        } else if (inQuotes && quotes === "'") {
          current.children.push(new Token('"', Tokens.Character, current));
        } else {
          inQuotes = true;
          quotes = '"';
        }
        break;
      }
      case '@':
      case '$': {
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isComment) break;
        if (inVar) {
          stepOut();
        }
        current = <Block>(
          push(
            new Block([], current, BlockTypes.GenericVariableReference),
            current.children
          )
        );
        if (char === '$') {
          current.type = BlockTypes.EnvironmentVariableReference;
        } else if (char === '@') {
          current.type = BlockTypes.ScopedVariableReference;
        }
        inVar = true;
        break;
      }
      case '{': {
        if (isFunction) {
          isFunctionBody = true;
          break;
        }
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isComment) break;
        if (inVar) {
          inVarBlock = true;
        } else {
          syntaxError(SyntaxErrors.UnexpectedIdentifier, true);
        }
        break;
      }
      case '}': {
        if (isFunction) {
          isFunctionBody = false;
          break;
        }
        if (isEscaped) {
          pushEscaped();
          break;
        }
        if (isComment) break;
        if (!inVar) {
          syntaxError(SyntaxErrors.UnexpectedIdentifier, true);
        } else {
          inVarBlock = false;
        }
        break;
      }
      default: {
        if (isEscaped) isEscaped = false;
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
    if (current.type === BlockTypes.Statement) {
      if (current.children.length === 0) {
        current = <Block>push(new Block([], current, BlockTypes.Command));
      } else {
        current = <Block>push(new Block([], current, BlockTypes.String));
      }
    } else if (current.type === BlockTypes.File)
      current = <Block>push(new Block([], current, BlockTypes.Statement));
    current.resolve();
  }
  return [result, errors, data, abort];
}

export function parseFile(name: string) {
  let path: string | number = name;
  let data: Buffer;
  if (name === '-') path = 0;
  try {
    data = fs.readFileSync(path);
  } catch {
    console.log(`${name}: no such file or directory`);
    process.exit(ExitCodes.FileNotFound);
  }

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
