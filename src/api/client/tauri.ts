import { invoke } from "@tauri-apps/api/core";
import { ConvertToClientApi, IClient } from "./type";
import { raw_api } from "..";

export class TauriClient implements IClient {
  api: ConvertToClientApi<typeof raw_api>;

  invoke(command: string, args: any): Promise<any> {
    console.log("invoke", command, args);
    // throw new Error("not implemented");
    return invoke(command.replaceAll("/", "__"), args);
  }

  constructor() {
    this.api = this.wrapApi(raw_api) as ConvertToClientApi<typeof raw_api>;
  }

  private wrapApi<T extends object>(obj: T): ConvertToClientApi<T> {
    return new Proxy(obj, {
      get: (target: any, prop: string) => {
        if (typeof target[prop] === "function") {
          return (args: any) => target[prop](this, args);
        }
        if (typeof target[prop] === "object" && target[prop] !== null) {
          return this.wrapApi(target[prop] as object);
        }
        return target[prop];
      },
    }) as ConvertToClientApi<T>;
  }
}