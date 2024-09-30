import "@/common/var.scss";
import { createContext, createEffect, on, onMount } from "solid-js";
import "./App.scss";
import { TauriClient } from "./api/client/tauri";
import { CanvasState } from "./components/canvas/CanvasState";
import { CanvasRenderer } from "./components/canvas/CanvasRenderer";
import { createSignal } from "./common/signal";
import { MenuContext } from "./components/base/menu/Menu";
import { Framework } from "./components/framework/Framework";

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

export function App() {
  const ac = new AppContext();
  console.log("AppContext", ac);

  ac.menu.list.set([
    {
      name: "新建",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "打开",
      onclick: () => {
        alert("还没做");
      },
    },
    { name: "保存", onclick: () => ac.mg_save() },
    { name: "另存为", onclick: () => ac.mg_save_as() },
  ]);

  createEffect(
    on(ac.meta.get, () => {
      ac.api.window.set_title(ac.meta.get().name + " | MindGraph");
    })
  );

  onMount(async () => {
    await ac.api.app.mg.load(ac.file.get().uri);

    const init_data = await ac.api.app.mg.get_init_data();
    ac.meta.set(init_data.meta);
    ac.canvas.root.set(init_data.root_node_id);
  });

  return (
    <app_context.Provider value={ac}>
      <Framework>
        <CanvasRenderer state={ac.canvas} />
      </Framework>
    </app_context.Provider>
  );
}

export default App;
