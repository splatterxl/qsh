"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const parse_1 = require("./parse");
const runner_1 = require("./runner");
const path_1 = tslib_1.__importDefault(require("path"));
const file = process.argv[2];
const result = parse_1.parse(file);
if (result === false)
    process.exit(4);
const files = result[0];
files.unshift(parse_1.parse(path_1.default.join(__dirname, '..', 'lib', 'std.qsh'))[0][0]);
runner_1.run(files, { contents: result[2], name: file });
