import { DialogFilter } from "@tauri-apps/plugin-dialog";
import { raw_api } from "..";

/** 递归去除 client 参数 */
export type ConvertToClientApi<T> = T extends (
  client: IClient,
  ...args: infer Args
) => Promise<infer R>
  ? (...args: Args) => Promise<R>
  : T extends object
  ? { [K in keyof T]: ConvertToClientApi<T[K]> }
  : T;

export interface IClient {
  invoke(command: string, args?: any): Promise<any>;
  api: {
    dialog: {
      save: (options: {
        default_path?: string;
        filters?: DialogFilter[];
      }) => Promise<string | void>;
      open: (options: {
        multiple?: boolean;
        filters?: DialogFilter[];
      }) => Promise<string | string[] | void>;
    };
    window: {
      set_title: (title: string) => void;
    };
  } & ConvertToClientApi<typeof raw_api>;
}
