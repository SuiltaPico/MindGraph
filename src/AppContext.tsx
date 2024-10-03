import { createContext } from "solid-js";
import { TauriClient } from "./api/client/tauri";
import { createSignal } from "./common/signal";
import { MenuContext } from "./components/base/menu/Menu";
import { CanvasState } from "./components/pages/canvas/CanvasState";

export class AppContext {
  file = createSignal({
    uri: "mindgraph://new",
  });
  meta = createSignal({
    name: "",
  });

  client = new TauriClient();
  api = this.client.api;

  canvas = new CanvasState(this);
  menu = new MenuContext();

  async open_mg() {
    const uri = await this.api.dialog.open({
      filters: [
        {
          name: "MindGraph 文件",
          extensions: ["mg"],
        },
      ],
    });
    if (!uri) return;

    await this.api.app.mg.load(uri as string);
    this.canvas.clean_catch();

    const init_data = await this.api.app.mg.get_init_data();
    this.meta.set(init_data.meta);
    this.canvas.root.set(init_data.root_node_id);
  }

  async mg_save() {
    const file = this.file.get();
    const meta = this.meta.get();

    if (file.uri === "mindgraph://new") {
      this.mg_save_as();
    } else {
      await this.api.app.mg.save({
        ...this.canvas.get_save_data(),
        meta,
      });
      alert("保存成功");
    }
  }

  async mg_save_as() {
    const meta = this.meta.get();
    const path = await this.api.dialog.save({
      default_path: this.meta.get().name,
      filters: [
        {
          name: "MindGraph 文件",
          extensions: ["mg"],
        },
      ],
    });
    if (!path) return;

    await this.api.app.mg.save_as({
      uri: path!,
      ...this.canvas.get_save_data(),
      meta,
    });

    this.file.set({
      uri: path!,
    });
    alert("保存成功");
  }
}
export const app_context = createContext<AppContext>();
