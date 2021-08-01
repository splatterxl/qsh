"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockTypes = exports.Tokens = void 0;
var Tokens;
(function (Tokens) {
    Tokens[Tokens["Statement"] = 0] = "Statement";
    Tokens[Tokens["Character"] = 1] = "Character";
    Tokens[Tokens["String"] = 2] = "String";
})(Tokens = exports.Tokens || (exports.Tokens = {}));
var BlockTypes;
(function (BlockTypes) {
    BlockTypes[BlockTypes["File"] = 0] = "File";
    BlockTypes[BlockTypes["Statement"] = 1] = "Statement";
    BlockTypes[BlockTypes["Command"] = 2] = "Command";
    BlockTypes[BlockTypes["String"] = 3] = "String";
    BlockTypes[BlockTypes["GenericVariableReference"] = 4] = "GenericVariableReference";
    BlockTypes[BlockTypes["EnvironmentVariableReference"] = 5] = "EnvironmentVariableReference";
    BlockTypes[BlockTypes["ScopedVariableReference"] = 6] = "ScopedVariableReference";
    BlockTypes[BlockTypes["Function"] = 7] = "Function";
    BlockTypes[BlockTypes["FunctionName"] = 8] = "FunctionName";
    BlockTypes[BlockTypes["FunctionBody"] = 9] = "FunctionBody";
})(BlockTypes = exports.BlockTypes || (exports.BlockTypes = {}));
