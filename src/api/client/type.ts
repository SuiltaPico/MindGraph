export interface IClient {
  invoke(command: string, args?: any): Promise<any>;
}

/** 递归去除 client 参数 */
export type ConvertToClientApi<T> = T extends (
  client: IClient,
  ...args: infer Args
) => Promise<infer R>
  ? (...args: Args) => Promise<R>
  : T extends object
  ? { [K in keyof T]: ConvertToClientApi<T[K]> }
  : T;
