"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.parseFile = exports.parse = exports.Token = exports.Block = exports.QshSyntaxError = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const tokens_1 = require("./tokens");
const errors_1 = require("./errors");
const en_json_1 = tslib_1.__importDefault(require("./i18n/en.json"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const exitcodes_1 = require("../exitcodes");
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
        return this;
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
    function syntaxError(code, fatal = false, lineNum = line, charStartNum = character - 1, charEndNum = character) {
        errors.push(new QshSyntaxError(code, 
        // @ts-ignore
        en_json_1.default[errors_1.SyntaxErrors[code]], fatal, lineNum, charStartNum, charEndNum));
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
        current.resolve();
        let tmp = current;
        current = current.parent;
        if (tmp === current) {
            console.log('what');
        }
        return 1;
    }
    let current = (push(new Block([], result, tokens_1.BlockTypes.File), result));
    push(new Block([], current, tokens_1.BlockTypes.Statement));
    let ind = 0;
    let character = 0;
    let line = 0;
    let isComment = false;
    let isCommentBlock = false;
    let isCommentBlockEnd = false;
    let abort = false;
    let inQuotes = false;
    let quotes = '';
    let inVar = false;
    let inVarBlock = false;
    let inFunction = false;
    // the most imporant variable
    let isEscaped = false;
    for (const char of data.split('')) {
        ind++;
        function pushEscaped(str = char) {
            current.children.push(new Token(str, tokens_1.Tokens.Character, current));
            isEscaped = false;
        }
        if (isCommentBlockEnd && char !== '#')
            continue;
        character++;
        if (abort)
            break;
        switch (char) {
            case '\\': {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                else {
                    isEscaped = true;
                    break;
                }
            }
            case ';': {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isCommentBlock) {
                    isCommentBlockEnd = true;
                    break;
                }
                if (inQuotes || isComment)
                    break;
                if (inVarBlock) {
                    syntaxError(errors_1.SyntaxErrors.UnexpectedIdentifier, true);
                    break;
                }
                stepOut();
                current = (push(new Block([], current.parent, tokens_1.BlockTypes.Statement), current.parent.children));
                break;
            }
            case '\n': {
                if (isEscaped) {
                    break;
                }
                if (isComment && !isCommentBlock)
                    isComment = !isComment;
                if (isComment && isCommentBlock)
                    break;
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
                if (isComment || current.children.length === 0)
                    break;
                if (!inVar) {
                    if (inQuotes) {
                        push(new Token(' ', tokens_1.Tokens.Character, current));
                    }
                    else if ([tokens_1.BlockTypes.String, tokens_1.BlockTypes.Command].includes(current.type)) {
                        stepOut();
                    }
                }
                else {
                    let type = current.type;
                    if (inFunction) {
                        switch (type) {
                            case tokens_1.BlockTypes.FunctionName: {
                                current = (push(new Block([], current, tokens_1.BlockTypes.FunctionBody)));
                                break;
                            }
                            case tokens_1.BlockTypes.FunctionBody: {
                                // everything's done
                                break;
                            }
                            default: {
                                current = (push(new Block([], current, tokens_1.BlockTypes.FunctionName)));
                                break;
                            }
                        }
                    }
                    inVar = false;
                    stepOut();
                }
                break;
            }
            case "'": {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isComment)
                    break;
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
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isComment)
                    break;
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
            case '@':
            case '$': {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isComment)
                    break;
                if (inVar) {
                    stepOut();
                }
                current = (push(new Block([], current, tokens_1.BlockTypes.GenericVariableReference), current.children));
                if (char === '$') {
                    current.type = tokens_1.BlockTypes.EnvironmentVariableReference;
                }
                else {
                    current.type = tokens_1.BlockTypes.ScopedVariableReference;
                }
                inVar = true;
                break;
            }
            case '{': {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isComment)
                    break;
                if (inVar) {
                    inVarBlock = true;
                }
                else {
                    if (!inFunction)
                        syntaxError(errors_1.SyntaxErrors.UnexpectedIdentifier, true);
                    else {
                        break;
                    }
                }
                break;
            }
            case '}': {
                if (isEscaped) {
                    pushEscaped();
                    break;
                }
                if (isComment)
                    break;
                if (!inVar) {
                    syntaxError(errors_1.SyntaxErrors.UnexpectedIdentifier, true);
                }
                else {
                    inVarBlock = false;
                }
                break;
            }
            case 'f': {
                if (data[ind] === 'n') {
                    break;
                }
            }
            case 'n': {
                if (data[ind - 2] === 'f' && char === 'n') {
                    inFunction = true;
                    current.type = tokens_1.BlockTypes.Function;
                    break;
                }
            }
            default: {
                if (isEscaped)
                    isEscaped = false;
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
        if (current.type === tokens_1.BlockTypes.Statement) {
            if (current.children.length === 0) {
                current = push(new Block([], current, tokens_1.BlockTypes.Command));
            }
            else {
                current = push(new Block([], current, tokens_1.BlockTypes.String));
            }
        }
        else if (current.type === tokens_1.BlockTypes.File)
            current = push(new Block([], current, tokens_1.BlockTypes.Statement));
        current.resolve();
    }
    return [result, errors, data, abort];
}
exports.parse = parse;
function parseFile(name) {
    let path = name;
    let data;
    if (name === '-')
        path = 0;
    try {
        data = fs_1.default.readFileSync(path);
    }
    catch {
        console.log(`${name}: no such file or directory`);
        process.exit(exitcodes_1.ExitCodes.FileNotFound);
    }
    return parse(data);
}
exports.parseFile = parseFile;
function formatError(error, data, file) {
    let line = data.split('\n')[error.line];
    if (!line)
        line = data.split('\n')[error.line - 1];
    line =
        line.slice(0, error.char) +
            chalk_1.default.bold(line.slice(error.char, error.ends || line.length - 1)) +
            line.slice(error.ends || line.length - 1, line.length) +
            '\n' +
            '\t    \t' +
            ' '.repeat(error.char) +
            chalk_1.default.redBright('^'.repeat((error.ends || line.length - 1) - error.char));
    return chalk_1.default `{blueBright ${file.replace(/^\.\//g, '')}}{grey :}{yellow ${error.line}}{grey :}{yellow ${error.char}} ${error.fatal ? chalk_1.default.ansi256(165)('FATAL ') : ''}{redBright error} {grey [}{yellowBright ${error.code}}{grey ]:} ${error.message}\n\t{grey at:} \t${line}`;
}
exports.formatError = formatError;
