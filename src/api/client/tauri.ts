import { invoke } from "@tauri-apps/api/core";
import { ConvertToClientApi, IClient } from "./type";
import { raw_api } from "..";
import { save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";

export class TauriClient implements IClient {
  api: IClient["api"];

  invoke(command: string, args: any): Promise<any> {
    console.log("invoke", command, args);
    return invoke(command.replaceAll("/", "__"), args);
  }

  constructor() {
    this.api = {
      ...this.wrapApi(raw_api),
      dialog: {
        save: async (options) => {
          const res = await save(options);
          if (res) {
            return "file://" + res;
          }
        },
      },
      window: {
        set_title: (title) => {
          const window = getCurrentWindow();
          window.setTitle(title);
        },
      },
    };
  }

  private wrapApi<T extends object>(obj: T): ConvertToClientApi<T> {
    const wrappedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === "function") {
          wrappedObj[key] = (...args: any) => value(this, ...args);
        } else if (typeof value === "object" && value !== null) {
          wrappedObj[key] = this.wrapApi(value as object);
        } else {
          wrappedObj[key] = value;
        }
      }
    }
    return wrappedObj as ConvertToClientApi<T>;
  }
}
