"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const parser_1 = require("./parser");
const util_1 = tslib_1.__importDefault(require("util"));
function parse(file) {
    const result = parser_1.parseFile(file);
    if (result[1].length !== 0) {
        for (const err of result[1]) {
            console.log(parser_1.formatError(err, result[2], file));
        }
        console.log('\n' +
            chalk_1.default `{yellow ${result[1].length}} error${result[1].length > 1 ? 's' : ''} found.`);
        return false;
    }
    else
        return result;
}
exports.parse = parse;
// debugging
if (require.main.id === module.id) {
    const result = parse(process.argv[2]);
    if (result === false)
        process.exit(4);
    console.log(util_1.default.inspect(result, { depth: 69, colors: true, sorted: true }));
}
