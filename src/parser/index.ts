import fs from "fs";
import { Tokens } from "./tokens";
import { SyntaxErrors } from "./errors";
import i18n from "./i18n/en.json";
import chalk from "chalk";

class QshSyntaxError {
  constructor(
    public code: number,
    public message: string,
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

class Block {
  constructor(public children: any[], public parent: any[]) {
    this.children = children;
    this.parent = parent;
  }
}
class Token {
  constructor(public value: string, public type: Tokens, public parent: Block) {
    for (const [k, v] of Object.entries({ value, type, parent })) {
      // @ts-ignore
      this[k] = v;
    }
  }
}

export function parse(
  data: string | Buffer
): [(Token | Block)[], QshSyntaxError[], string] {
  let errors: QshSyntaxError[] = [];
  function syntaxError(code: SyntaxErrors) {
    errors.push(
      new QshSyntaxError(
        code,
        // @ts-ignore
        i18n[SyntaxErrors[code]],
        line,
        character - 1,
        character + 1
      )
    );
  }

  data = data.toString();
  const result: (Token | Block)[] = [];
  function push(data: Token | Block) {
    const i = result.push(data) - 1;
    return result[i];
  }
  let current: Block;
  let isComment = false;
  let abort = false;
  let line = 0;
  let character = 0;
  for (const char of data.split("")) {
    character++;
    if (abort) break;
    if (current === undefined) current = <Block>push(new Block([], result));
    switch (char) {
      case ";": {
        if (current.children.length === 0) {
          syntaxError(SyntaxErrors.UnnecessarySemicolon);
        }
        current = <Block>push(new Block([], current.parent));
        break;
      }
      case "\n": {
        if (isComment) isComment = !isComment;
        line++;
        character = 0;
        break;
      }
      case "#": {
        isComment = true;
        line++;
        break;
      }
      default: {
        if (isComment) break;
        current.children.push(new Token(char, Tokens.Character, current));
        break;
      }
    }
  }
  return [result, errors, data];
}

export function parseFile(name: string) {
  let path: string | number = name;
  if (name === "-") path = 0;
  const data = fs.readFileSync(path);

  return parse(data);
}

export function formatError(error: QshSyntaxError, data: string, file: string) {
  let line = data.split("\n")[error.line];
  line =
    line.slice(0, error.char) +
    chalk.bold(line.slice(error.char, error.ends || line.length - 1)) +
    line.slice(error.ends || line.length - 1, line.length) +
    "\n" +
    "\t    \t" +
    " ".repeat(error.char) +
    chalk.redBright(
      "^".repeat((error.ends || line.length - 1) - error.char - 1)
    );

  return chalk`{blueBright ${file.replace(/^\.\//g, "")}}{grey :}{yellow ${
    error.line
  }}{grey :}{yellow ${error.char}} {redBright error} {grey [}{yellowBright ${
    error.code
  }}{grey ]:} ${error.message}\n\t{grey at:} \t${line}`;
}
