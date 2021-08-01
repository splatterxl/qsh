<div align=center>
  
  <h1>qsh</h1>

  <img src="https://img.shields.io/github/checks-status/nearlySplat/qsh/trunk?label=CI&logo=github" /> <img src="https://img.shields.io/github/package-json/v/nearlySplat/qsh" /> <img src="https://david-dm.org/nearlysplat/qsh.svg" />
  
</div>

Qshell is a strict shell language, that isn't _necessarily_ POSIX compliant.

----

  <b>NOTICE</b> <br />
  Qshell cannot currently be used as a login shell.
  
----

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Installation](#installation)
  - [Building the Source](#building-the-source)
  - [Release](#release)
  - [Through NPM](#through-npm)
- [Syntax](#syntax)

## Overview

Qshell is an interpreted shell language (not compiled to bytecode, but executed with child processes) originally made as a rewrite of [splatsh], but with the most notable change being that the whole of the file is parsed into an [AST (Abstract Syntax Tree)][ast] instead of handled very clumsily with [RegExp]. <!-- forgive me if I'm wrong; I'm too scared to look at the actual code for splatsh -->

## Installation

Qshell can be installed in many ways, including:

- [building the source](#building-the-source) yourself
- using an [executable file](#release), or
- [through npm](#through-npm).

### Building the Source

Building from source is not currently supported.

### Release

Coming soon:tm:

### Through NPM

You can install the npm package, or install from the [built code](built).

- From the npm registry: `npm install -g @splatterxl/qsh@dev`
- From the built code on GitHub: `npm install -g nearlySplat/qsh#build`

## Syntax

Qshell's syntax may vary from that of other shells such as Bash or Fish. The specification is available on the linked page: [Click me!][spec]

[ast]: https://en.wikipedia.org/wiki/Abstract_syntax_tree
[built]: https://github.com/nearlySplat/qsh/tree/build
[regexp]: https://en.wikipedia.org/wiki/Regular_expression
[spec]: ./docs/spec.md
[splatsh]: https://github.com/nearlysplat/splatsh
