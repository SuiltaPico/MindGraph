import "@/common/var.scss";
import { createContext, createEffect, on, onMount } from "solid-js";
import "./App.scss";
import { TauriClient } from "./api/client/tauri";
import { CanvasState } from "./components/canvas/CanvasState";
import { CanvasRenderer } from "./components/canvas/CanvasRenderer";
import { TopBar } from "./components/menu/TopBar";
import { createSignal } from "./common/signal";

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

  async save_mg() {
    const file = this.file.get();
    const meta = this.meta.get();

    if (file.uri === "mindgraph://new") {
      const path = await this.api.dialog.save({
        defaultPath: meta.name,
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
    } else {
      await this.api.app.mg.save({
        ...this.canvas.get_save_data(),
        meta,
      });
    }
  }
}
export const app_context = createContext<AppContext>();

export function App() {
  const ac = new AppContext();
  console.log("AppContext", ac);

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
      <div class="fw_container">
        <TopBar />
        <CanvasRenderer state={ac.canvas} />
      </div>
    </app_context.Provider>
  );
}

export default App;
