import { parse } from './parse';
import { run } from './runner';

const file = process.argv[2];

const result = parse(file);
if (result === false) process.exit(4);

run(result[0], { contents: result[2], name: file });
