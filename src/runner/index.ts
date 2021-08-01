import {
  AbstractSyntaxTree,
  formatError,
  QshSyntaxError,
  parse,
  Block,
  Token,
} from '../parser';
import { SyntaxErrors } from '../parser/errors';
import { BlockTypes } from '../parser/tokens';
import i18n from '../parser/i18n/en.json';
import child_process from 'child_process';

const functions = new Map<string, AbstractSyntaxTree>();
const vars = new Map<string, string>();

export async function run(
  files: AbstractSyntaxTree,
  fileData: { contents: string; name: string }
) {
  for (const file of files) {
    for (const branch of <Block[]>file.children) {
      // idk
      if (branch instanceof Token) continue;
      if (branch.type !== BlockTypes.Statement) {
        console.log(
          formatError(
            new QshSyntaxError(
              SyntaxErrors.InvalidAST,
              // @ts-ignore
              i18n[SyntaxErrors[SyntaxErrors.InvalidAST]],
              true,
              0,
              0,
              1
            ),
            fileData.contents,
            fileData.name
          )
        );
        process.exit(4);
      }
      await runCommand(branch);
    }
  }
}

async function runCommand(branch: Block) {
  const command = branch.children.shift();
  // idk
  if (!command) return;
  let args = branch.children.map((v) =>
    v.type === BlockTypes.EnvironmentVariableReference
      ? { ...v, value: process.env[v.value] }
      : v
  );

  vars.set('@', args.map((v) => v.value).join(' '));

  args = args.map((v) =>
    v.type === BlockTypes.ScopedVariableReference
      ? { ...v, value: vars.get(v.value) }
      : v
  );

  if (command.value === '%') {
    eval(args[0].value);
  } else if (command.value === 'fn') {
    functions.set(args.shift().value, parse(args[0].value)[0]);
  } else if (functions.has(command.value)) {
    const file = functions.get(command.value)[0];
    for (const statement of file.children) {
      runCommand(<Block>statement);
      vars.delete('@');
    }
  } else {
    try {
      const proc = child_process.spawn(
        command.value,
        args.map((v) => v.value).filter((v) => v),
        { stdio: 'inherit', argv0: command.value }
      );
      await new Promise<void>((res) => {
        proc.on('exit', () => {
          res();
        });
      });
    } catch (e) {
      if (e.code === 'ENOENT')
        console.error(command.value + ': command not found');
    }
  }
}
