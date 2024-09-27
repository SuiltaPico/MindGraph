import "@/common/var.scss";
import { createContext, onMount } from "solid-js";
import "./App.scss";
import { TauriClient } from "./api/client/tauri";
import { CanvasState } from "./components/canvas/CanvasState";
import { CanvasRenderer } from "./components/canvas/CanvasRenderer";
import { TopBar } from "./components/menu/TopBar";

export class AppContext {
  file = {
    url: "mindgraph://new",
    name: "新建知识库",
  };
  client = new TauriClient();
  api = this.client.api;
  canvas = new CanvasState({
    load_node: this.api.mg.node.load_node,
  });
}
export const context = createContext<AppContext>();

export function App() {
  const ac = new AppContext();
  console.log("AppContext", ac);
  
  onMount(async () => {
    await ac.api.app.load_mg(ac.file.url);
    ac.canvas.root.set(await ac.api.mg.node.get_first_root_node());
  });

  return (
    <context.Provider value={ac}>
      <div class="fw_container">
        <TopBar />
        <CanvasRenderer state={ac.canvas} />
      </div>
    </context.Provider>
  );
}

export default App;
