import { parse } from './parse';
import { run } from './runner';
import path from 'path';
import { AbstractSyntaxTree } from './parser';
import child_process from 'child_process';

const file = process.argv[2];

if (file) {
  const result = parse(file);
  if (result === false) process.exit(4);

  const files = result[0];

  files.unshift(
    (<AbstractSyntaxTree[]>(
      (<unknown>parse(path.join(__dirname, '..', 'lib', 'std.qsh')))
    ))[0][0]
  );

  run(files, { contents: result[2], name: file });
} else {
  console.error('Use --login for login shells.');
  process.exit(1);
}
