# Qshell specifications

All statements must end with `;`.

## Comments

- Comment lines start with `#`.
<!--- Comment blocks start with `##` and end with `&##`.-->

### Examples

```sh
# I am a commented line
echo "I'm not!";
```

## Values

Values supported by Qsh are: strings, both notated by quotes and not. <!--, and null-->

### Examples

```sh
var unquoted = a string;
var word = "another string";
var char = 'a';
```

## Variables

<!-- Normal variables are declared with the `var` command. They can be accessed through `@var_name`. -->

Environment variables are declared with the `env` command. They can be accessed through `$VAR_NAME`.

<!--### Scoped variables-->
<!--Use the `--scoped` or `-s` flag with `var` to specify a scoped variable.-->

<!--### Mutable values-->
<!--Although variables are mutable by default, you can explicitly specify it with `%name`. Example: `var %str = "Hello, World!";`. References are still `@var_name`.-->

<!--### Immutable values-->
<!--Immutable variables are specified with the `--const` flag. Example: `var --const a_variable = "test";`-->
