import path from 'path';
import { parseFlags } from './flagParser';
import { AbstractSyntaxTree, formatError, parse } from './parser';
import { run } from './runner';
import { parse as parseFile } from './parse';

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
} as const;

const usage = (type: 1 | 2, flag: string) =>
  `
${type === 1 ? 'invalid flag' : 'unrecognised flag'}: ${flag}

Qshell: a syntactically strict shell language.
Copyright (C) 2021 Splatterxl; some code by Vendicated.

usage: 
- qsh [--login]
- qsh file [args...]
- qsh -c code...
`.trim();

const [flags, invalid, unrecognised, rest] = parseFlags(
  process.argv.slice(2).join(' '),
  schema
);

console.log(process.argv);

if (unrecognised.length || Object.keys(invalid).length) {
  const flag = unrecognised[0] || Object.keys(invalid)[0];
  const type = flag in invalid ? 1 : 2;
  console.error(usage(type, flag));
  process.exit(1);
}

if (!flags.login) {
  import('.');
} else {
  if (!flags.nologo)
    console.log(
      'Qshell\nCopyright (C) 2021 Splatterxl. Some code by Vendicated.\n'
    );
  run(
    (<AbstractSyntaxTree[]>(
      (<unknown>parseFile(path.join(__dirname, '..', 'lib', 'std.qsh')))
    ))[0],
    { name: 'stdlib', contents: '' }
  );

  const prompt = () => process.stdout.write('& ');
  prompt();
  process.stdin.on('data', async (data: string) => {
    data = 'o' + data.toString();
    const result = parse(data);
    if (result[1].length) {
      for (const err of result[1]) {
        console.log(formatError(err, data, 'input'));
      }
    }

    if (!result[3])
      await run(result[0], { name: 'input', contents: result[2] });

    prompt();
  });
}

export {};
