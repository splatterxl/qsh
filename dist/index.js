"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const parse_1 = require("./parse");
const runner_1 = require("./runner");
const path_1 = tslib_1.__importDefault(require("path"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const file = process.argv[2];
if (file) {
    const result = parse_1.parse(file);
    if (result === false)
        process.exit(4);
    const files = result[0];
    files.unshift(parse_1.parse(path_1.default.join(__dirname, '..', 'lib', 'std.qsh'))[0][0]);
    runner_1.run(files, { contents: result[2], name: file });
}
else {
    const proc = child_process_1.default.spawn('node', [path_1.default.join(__dirname, 'login'), '--login'], {
        stdio: 'inherit',
        cwd: process.cwd(),
    });
    proc.on('exit', process.exit);
}
