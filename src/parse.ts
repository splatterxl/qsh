import chalk from "chalk";
import { formatError, parseFile } from "./parser";

export function parse(file: string) {
  const result = parseFile(file);

  if (result[1].length !== 0) {
    for (const err of result[1]) {
      console.log(formatError(err, result[2], file));
    }
    console.log(
      "\n" +
        chalk`{yellow ${result[1].length}} error${
          result[1].length > 1 ? "s" : ""
        } found.`
    );
    return false;
  } else return result[0];
}

// debugging
if (require.main.id === module.id) {
  const result = parse(process.argv[2]);
  if (result === false) process.exit(4);
}
