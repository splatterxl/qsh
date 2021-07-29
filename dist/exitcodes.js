"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitCodes = void 0;
var ExitCodes;
(function (ExitCodes) {
    ExitCodes[ExitCodes["Success"] = 0] = "Success";
    ExitCodes[ExitCodes["Error"] = 1] = "Error";
    ExitCodes[ExitCodes["SyntaxError"] = 4] = "SyntaxError";
    ExitCodes[ExitCodes["FileNotFound"] = 5] = "FileNotFound";
})(ExitCodes = exports.ExitCodes || (exports.ExitCodes = {}));
