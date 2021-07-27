"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.parseFile = exports.parse = exports.Token = exports.Block = exports.QshSyntaxError = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const tokens_1 = require("./tokens");
const errors_1 = require("./errors");
const en_json_1 = tslib_1.__importDefault(require("./i18n/en.json"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
class QshSyntaxError {
    code;
    message;
    fatal;
    line;
    char;
    ends;
    constructor(code, message, fatal, line, char, ends) {
        this.code = code;
        this.message = message;
        this.fatal = fatal;
        this.line = line;
        this.char = char;
        this.ends = ends;
        this.code = code;
        this.message = message;
        this.line = line;
        this.char = char;
        this.ends = ends;
    }
}
exports.QshSyntaxError = QshSyntaxError;
class Block {
    children;
    parent;
    type;
    value;
    constructor(children, parent, type) {
        this.children = children;
        this.parent = parent;
        this.type = type;
        this.children = children;
        this.parent = parent;
        this.type = type;
        Object.defineProperty(this, 'value', { enumerable: false });
    }
    resolve() {
        if (this.children.every((v) => v.type === tokens_1.Tokens.Character)) {
            Object.defineProperty(this, 'children', { enumerable: false });
            Object.defineProperty(this, 'value', {
                enumerable: true,
                value: this.children.reduce((a, b) => a + b.value, ''),
            });
        }
    }
}
exports.Block = Block;
class Token {
    value;
    type;
    parent;
    constructor(value, type, parent) {
        this.value = value;
        this.type = type;
        this.parent = parent;
        for (const [k, v] of Object.entries({ value, type, parent })) {
            // @ts-ignore
            this[k] = v;
        }
    }
}
exports.Token = Token;
function parse(data) {
    let errors = [];
    function syntaxError(code, fatal = false) {
        errors.push(new QshSyntaxError(code, 
        // @ts-ignore
        en_json_1.default[errors_1.SyntaxErrors[code]], fatal, line, character - 1, character + 1));
        if (fatal)
            abort = true;
    }
    data = data.toString();
    const result = [];
    function push(data, arr = current.children) {
        const i = arr.push(data) - 1;
        return arr[i];
    }
    function stepOut() {
        // @ts-ignore
        if (current.parent === result)
            return;
        current.resolve();
        current = current.parent;
        return 1;
    }
    let current = (push(new Block([], result, tokens_1.BlockTypes.Statement), result));
    let isComment = false;
    let abort = false;
    let line = 0;
    let character = 0;
    let inQuotes = false;
    let quotes = '';
    for (const char of data.split('')) {
        character++;
        if (abort)
            break;
        switch (char) {
            case ';': {
                current.resolve();
                stepOut();
                current = (push(new Block([], current.parent, tokens_1.BlockTypes.Statement), current.children));
                break;
            }
            case '\n': {
                if (isComment)
                    isComment = !isComment;
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
                if (inQuotes) {
                    push(new Token(' ', tokens_1.Tokens.Character, current));
                }
                else if ([tokens_1.BlockTypes.String, tokens_1.BlockTypes.Command].includes(current.type)) {
                    stepOut();
                }
                break;
            }
            case "'": {
                if (inQuotes && quotes === "'") {
                    inQuotes = false;
                    quotes = '';
                    stepOut();
                }
                else if (inQuotes) {
                    current.children.push(new Token("'", tokens_1.Tokens.Character, current));
                }
                else {
                    inQuotes = true;
                    quotes = "'";
                }
                break;
            }
            case '"': {
                if (inQuotes && quotes === '"') {
                    inQuotes = false;
                    quotes = '';
                }
                else if (inQuotes) {
                    current.children.push(new Token('"', tokens_1.Tokens.Character, current));
                }
                else {
                    inQuotes = true;
                    quotes = '"';
                }
                break;
            }
            default: {
                if (isComment)
                    break;
                if (current.children.length === 0 &&
                    current.type === tokens_1.BlockTypes.Statement) {
                    current = push(new Block([], current, tokens_1.BlockTypes.Command));
                }
                else if (current.type === tokens_1.BlockTypes.Statement) {
                    current = push(new Block([], current, tokens_1.BlockTypes.String));
                }
                current.children.push(new Token(char, tokens_1.Tokens.Character, current));
                break;
            }
        }
    }
    return [result.filter((v) => v.children.length), errors, data, abort];
}
exports.parse = parse;
function parseFile(name) {
    let path = name;
    if (name === '-')
        path = 0;
    const data = fs_1.default.readFileSync(path);
    return parse(data);
}
exports.parseFile = parseFile;
function formatError(error, data, file) {
    let line = data.split('\n')[error.line];
    line =
        line.slice(0, error.char) +
            chalk_1.default.bold(line.slice(error.char, error.ends || line.length - 1)) +
            line.slice(error.ends || line.length - 1, line.length) +
            '\n' +
            '\t    \t' +
            ' '.repeat(error.char) +
            chalk_1.default.redBright('^'.repeat((error.ends || line.length - 1) - error.char - 1));
    return chalk_1.default `{blueBright ${file.replace(/^\.\//g, '')}}{grey :}{yellow ${error.line}}{grey :}{yellow ${error.char}} ${error.fatal ? chalk_1.default.ansi256(165)('FATAL ') : ''}{redBright error} {grey [}{yellowBright ${error.code}}{grey ]:} ${error.message}\n\t{grey at:} \t${line}`;
}
exports.formatError = formatError;
