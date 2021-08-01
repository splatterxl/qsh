"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const parser_1 = require("../parser");
const errors_1 = require("../parser/errors");
const tokens_1 = require("../parser/tokens");
const en_json_1 = tslib_1.__importDefault(require("../parser/i18n/en.json"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const functions = new Map();
const vars = new Map();
async function run(files, fileData) {
    for (const file of files) {
        for (const branch of file.children) {
            // idk
            if (branch instanceof parser_1.Token)
                continue;
            if (branch.type !== tokens_1.BlockTypes.Statement) {
                console.log(parser_1.formatError(new parser_1.QshSyntaxError(errors_1.SyntaxErrors.InvalidAST, 
                // @ts-ignore
                en_json_1.default[errors_1.SyntaxErrors[errors_1.SyntaxErrors.InvalidAST]], true, 0, 0, 1), fileData.contents, fileData.name));
                process.exit(4);
            }
            await runCommand(branch);
        }
    }
}
exports.run = run;
async function runCommand(branch) {
    const command = branch.children.shift();
    // idk
    if (!command)
        return;
    let args;
    function setArgs() {
        return (branch.children.map((v) => v.type === tokens_1.BlockTypes.EnvironmentVariableReference
            ? { ...v, value: process.env[v.value] }
            : v.type === tokens_1.BlockTypes.ScopedVariableReference
                ? { ...v, value: vars.get(v.value) }
                : v));
    }
    let old = vars.get('@') || '';
    args = setArgs();
    vars.set('@', args.map((v) => v.value).join(' ') || old);
    process.env['@'] = vars.get('@');
    args = setArgs();
    if (command.value === '%') {
        try {
            eval(args[0].value);
        }
        catch (e) {
            console.error('[Embedded JS]', e.toString(), chalk_1.default `\n\t{grey at:}\t`, args[0].value);
        }
    }
    else if (command.value === 'fn') {
        functions.set(args.shift().value, parser_1.parse(args[0].value)[0]);
    }
    else if (functions.has(command.value)) {
        const file = functions.get(command.value)[0];
        for (const statement of file.children) {
            runCommand(statement);
            vars.set('@', old);
        }
    }
    else {
        try {
            const proc = child_process_1.default.spawn(command.value, args.map((v) => v.value).filter((v) => v), { stdio: 'inherit', argv0: command.value });
            await new Promise((res, rej) => {
                proc.on('exit', () => {
                    res();
                });
                proc.on('error', (e) => {
                    proc.kill('SIGTERM');
                    rej(e);
                });
            });
        }
        catch (e) {
            if (e.code === 'ENOENT')
                console.error(command.value + ': command not found');
        }
    }
}
