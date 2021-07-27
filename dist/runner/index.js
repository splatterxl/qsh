"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const parser_1 = require("../parser");
const errors_1 = require("../parser/errors");
const tokens_1 = require("../parser/tokens");
const en_json_1 = tslib_1.__importDefault(require("../parser/i18n/en.json"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
async function run(tree, fileData) {
    for (const branch of tree) {
        if (branch.type !== tokens_1.BlockTypes.Statement) {
            console.log(parser_1.formatError(new parser_1.QshSyntaxError(errors_1.SyntaxErrors.InvalidAST, 
            // @ts-ignore
            en_json_1.default[errors_1.SyntaxErrors[errors_1.SyntaxErrors.InvalidAST]], true, 0, 0, 1), fileData.contents, fileData.name));
            process.exit(4);
        }
        const command = branch.children.shift();
        const args = branch.children;
        const proc = child_process_1.default.spawn(command.value, args.map((v) => v.value).filter((v) => v), { stdio: 'inherit', argv0: command.value });
        await new Promise((res) => {
            proc.on('exit', () => {
                res();
            });
        });
    }
}
exports.run = run;