export enum Tokens {
  Statement,
  Character,
  String,
}

export enum BlockTypes {
  File, // haha yes I am stupid
  Statement,
  Command,
  String,

  GenericVariableReference,
  EnvironmentVariableReference,
  ScopedVariableReference,
}
