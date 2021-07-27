"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_1 = require("./parse");
const runner_1 = require("./runner");
const file = process.argv[2];
const result = parse_1.parse(file);
if (result === false)
    process.exit(4);
runner_1.run(result[0], { contents: result[2], name: file });
