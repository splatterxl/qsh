"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const parse_1 = require("./parse");
const runner_1 = require("./runner");
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const file = process.argv[2];
if (file) {
    const result = (0, parse_1.parse)(file);
    if (result === false)
        process.exit(4);
    const files = result[0];
    files.unshift((0, parse_1.parse)(path_1.default.join(__dirname, '..', 'lib', 'std.qsh'))[0][0]);
    (0, runner_1.run)(files, { contents: result[2], name: file });
}
else {
    console.error('Use --login for login shells.');
    process.exit(1);
}
