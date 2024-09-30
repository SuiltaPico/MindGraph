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
      defaultPath: this.meta.get().name,
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
