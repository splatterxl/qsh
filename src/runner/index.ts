import { AbstractSyntaxTree, formatError, QshSyntaxError } from '../parser';
import { SyntaxErrors } from '../parser/errors';
import { BlockTypes } from '../parser/tokens';
import i18n from '../parser/i18n/en.json';
import child_process from 'child_process';

export async function run(
  tree: AbstractSyntaxTree,
  fileData: { contents: string; name: string }
) {
  for (const branch of tree) {
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
    const command = branch.children.shift();
    const args = branch.children;
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
  }
}
