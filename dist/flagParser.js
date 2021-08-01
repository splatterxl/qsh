"use strict";
// TODO: optimise
/*
 *  Taken from Splatsh, a Node.js-based shell.
 *  Copyright (C) 2021 nearlySplat and Vendicated
 *
 *  splatsh is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  splatsh is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with splatsh.  If not, see <https://www.gnu.org/licenses/>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlags = void 0;
/**
 * @returns [ParsedFlags, InvalidFlagParameter, UnrecognisedFlags, rest]
 */
function parseFlags(raw, schema) {
    const result = {};
    const unrecognisedFlags = [];
    const invalidFlags = {};
    let rest = '';
    let resolvingShortFlag = false;
    let resolvingLongFlag = false;
    let resolvingValue = false;
    let insideSingleQuotes = false;
    let insideDoubleQuotes = false;
    let escapeNext = false;
    let currentFlag = '';
    let currentValue = '';
    function putChar(char) {
        if (resolvingValue)
            currentValue += char;
        else if (resolvingLongFlag)
            currentFlag += char;
        else if (resolvingShortFlag)
            saveFlag(char);
        else
            rest += char;
    }
    function saveFlag(char, lastSave = false) {
        let name = char || currentFlag;
        let flag = null;
        if (Object.prototype.hasOwnProperty.call(schema, name)) {
            flag = schema[name];
        }
        else {
            for (const [key, value] of Object.entries(schema)) {
                if (value.aliases?.includes(name)) {
                    name = key;
                    flag = value;
                }
            }
        }
        if (!flag)
            unrecognisedFlags.push(`-${resolvingLongFlag ? '-' : ''}${name}`);
        else if (flag.type === 'switch')
            result[name] = true;
        else if (currentValue) {
            if ((flag.validate && !flag.validate(currentValue)) ||
                flag.choices?.indexOf(currentValue) === -1)
                invalidFlags[name] = currentValue;
            else if (flag.transform)
                result[name] = flag.transform(currentValue);
            else
                result[name] = currentValue;
        }
        else {
            if (!lastSave && !resolvingValue)
                return void (resolvingValue = true);
            else if (flag.optional) {
                result[name] = true;
            }
            else
                invalidFlags[name] = null;
        }
        currentFlag = '';
    }
    loop: for (let i = 0; i < raw.length; i++) {
        const char = raw[i];
        if (escapeNext) {
            escapeNext = false;
            putChar(char);
            continue;
        }
        switch (char) {
            case '-':
                if (resolvingShortFlag) {
                    if (raw[i - 1] === '-') {
                        resolvingShortFlag = false;
                        resolvingLongFlag = true;
                    }
                    else {
                        putChar('-');
                    }
                }
                else if (resolvingLongFlag) {
                    currentFlag += '-';
                }
                else {
                    resolvingShortFlag = true;
                }
                break;
            case ' ':
                if (resolvingValue) {
                    if (insideDoubleQuotes || insideSingleQuotes)
                        currentValue += ' ';
                    else {
                        saveFlag();
                        resolvingValue = false;
                        currentValue = '';
                    }
                }
                else if (resolvingLongFlag) {
                    if (!currentFlag) {
                        resolvingLongFlag = false;
                        rest += raw.slice(i);
                        break loop;
                    }
                    saveFlag();
                    resolvingLongFlag = false;
                }
                else if (resolvingShortFlag) {
                    resolvingShortFlag = false;
                }
                else
                    putChar(' ');
                break;
            case `"`:
                insideDoubleQuotes = !insideDoubleQuotes;
                putChar(`"`);
                break;
            case `'`:
                insideSingleQuotes = !insideSingleQuotes;
                putChar(`"`);
                break;
            default:
                putChar(char);
        }
    }
    if (resolvingLongFlag || resolvingValue)
        saveFlag(void 0, true);
    return [
        result,
        invalidFlags,
        unrecognisedFlags,
        rest.trim(),
    ];
}
exports.parseFlags = parseFlags;
function isArgFlag(flag) {
    return Object.prototype.hasOwnProperty.call(flag, 'argument');
}
