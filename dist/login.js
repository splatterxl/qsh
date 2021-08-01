"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const flagParser_1 = require("./flagParser");
const parser_1 = require("./parser");
const runner_1 = require("./runner");
const parse_1 = require("./parse");
// const { version } = JSON.parse(
//   fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
// );
const schema = {
    login: {
        aliases: ['l'],
        type: 'switch',
    },
    nologo: {
        aliases: ['n'],
        type: 'switch',
    },
};
const usage = (type, flag) => `
${type === 1 ? 'invalid flag' : 'unrecognised flag'}: ${flag}

Qshell: a syntactically strict shell language.
Copyright (C) 2021 Splatterxl; some code by Vendicated.

usage: 
- qsh [--login]
- qsh file [args...]
- qsh -c code...
`.trim();
const [flags, invalid, unrecognised, rest] = flagParser_1.parseFlags(process.argv
    .slice(2)
    .map((v) => `${v}`)
    .join(' '), schema);
if (unrecognised.length || Object.keys(invalid).length) {
    const flag = unrecognised[0] || Object.keys(invalid)[0];
    const type = flag in invalid ? 1 : 2;
    console.error(usage(type, flag));
    process.exit(1);
}
if (!flags.login) {
    Promise.resolve().then(() => tslib_1.__importStar(require('.')));
}
else {
    if (rest) {
        console.error('Login shell cannot have trailing arguments. (', rest, ')');
        process.exit(1);
    }
    if (!flags.nologo)
        console.log('Qshell\nCopyright (C) 2021 Splatterxl. Some code by Vendicated.\n');
    runner_1.run(parse_1.parse(path_1.default.join(__dirname, '..', 'lib', 'std.qsh'))[0], { name: 'stdlib', contents: '' });
    const prompt = () => process.stdout.write('& ');
    prompt();
    process.stdin.on('data', async (data) => {
        data = 'o' + data.toString();
        const result = parser_1.parse(data);
        if (result[1].length) {
            for (const err of result[1]) {
                console.log(parser_1.formatError(err, data, 'input'));
            }
        }
        if (!result[3])
            await runner_1.run(result[0], { name: 'input', contents: result[2] });
        prompt();
    });
}
