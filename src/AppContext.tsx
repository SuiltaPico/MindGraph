import { createContext } from "solid-js";
import { TauriClient } from "./api/client/tauri";
import { createSignal } from "./common/signal";
import { MenuState } from "./components/base/menu/Menu";
import { Canvas } from "./components/pages/canvas/Canvas";

export class AppContext {
  file = createSignal({
    uri: "mindgraph://new",
    meta_modified: false,
  });
  meta = createSignal({
    name: "",
  });

  client = new TauriClient();
  api = this.client.api;

  canvas = new Canvas(this);
  menu = new MenuState();

  is_modified() {
    return this.canvas.is_modified() || this.file.get().meta_modified;
  }

  async load_init_data() {
    const init_data = await this.api.app.mg.get_init_data();
    this.meta.set(init_data.meta);
    this.canvas.root.set(init_data.root_node_id);
  }

  async handle_mg_if_modified() {
    if (this.is_modified()) {
      const save_file = await this.api.dialog.confirm({
        message: "是否先保存当前文件？",
        confirm_label: "保存",
        cancel_label: "不保存",
        title: "当前文件已修改",
      });
      if (save_file) {
        const not_canceled = await this.mg_save();
        if (not_canceled === false) return false;
      }
    }
  }

  async open_mg() {
    const not_canceled = await this.handle_mg_if_modified();
    if (not_canceled === false) return false;

    const uri = await this.api.dialog.open({
      filters: [
        {
          name: "MindGraph 文件",
          extensions: ["mg"],
        },
      ],
    });
    if (!uri) return false;

    await this.api.app.mg.load(uri as string);
    this.canvas.clean_catch();

    await this.load_init_data();
  }

  async mg_new() {
    const not_canceled = await this.handle_mg_if_modified();
    if (not_canceled === false) return false;

    await this.api.app.mg.new_mg();
    this.canvas.clean_catch();

    await this.load_init_data();
  }

  async mg_save() {
    const file = this.file.get();
    const meta = this.meta.get();

    if (file.uri === "mindgraph://new") {
      const res = await this.mg_save_as();
      if (res === false) return false;
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
    if (!path) return false;

    await this.api.app.mg.save_as({
      uri: path!,
      ...this.canvas.get_save_data(),
      meta,
    });

    this.file.set({
      uri: path!,
      meta_modified: false,
    });
    alert("保存成功");
  }
}
export const app_context = createContext<AppContext>();
