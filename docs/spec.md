# Qshell Specification

What's this? This is the specification for Qshell's unique syntax.

## Basic Rules

- All statements must end with `;`

## Comments

### Line comments

Line comments are denoted with `#`. These are only valid for one line (i.e. any unescaped newline must terminate it).

#### Example:

```shell
# this is commented
echo "this isn't";
```

### Block comments

Block comments are started with `##`, and ended with `;#`. These are valid until the ending token is discovered. It is better code style to prefix every line in the block comment with one (1) indenting space and a `#` character.

#### Example:

```shell
## this is commented
   this is also commented
 # and this is better style
 # but now the block ends ;#
```



## Variables

### Declaration

Variables are declared with the `var` function.

#### Example:

```shell
var foo = "bar";
```

### Reference

Variables can be referenced with either of two identifiers: `$` for *environment* variables, and `@` for normal variables.
