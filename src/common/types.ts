export type GetMapValue<T extends Map<string, any>> = T extends Map<
  string,
  infer V
>
  ? V
  : never;
