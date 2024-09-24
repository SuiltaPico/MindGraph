import "@/common/var.scss";
import { invoke } from "@tauri-apps/api/core";
import { createContext, onMount } from "solid-js";
import { IMindNode } from "./api/types/node";
import { Canvas, CanvasState } from "./components/canvas/Canvas";
import { TopBar } from "./components/menu/TopBar";
import { createSignal } from "./common/signal";
import "./App.scss";
export class AppContext {}
export const context = createContext<AppContext>();

export function App() {
  const menu_visible = createSignal(false);
  const canvas_state = new CanvasState({
    load_node: async (id: string) => {
      const node = await invoke("load_node", { id });
      return node as IMindNode;
    },
  });

  onMount(async () => {
    canvas_state.root.set(
      ((await invoke("get_first_root_node")) as IMindNode).id
    );
  });

  return (
    <context.Provider value={{}}>
      <div class="fw_container">
        <TopBar
        // menuVisible={menu_visible}
        />
        <Canvas state={canvas_state} />
        {/* <div
          style={{
            width: "100%",
            height: "100%",
            visibility: menuVisible() ? "visible" : "hidden",
            opacity: menuVisible() ? 1 : 0,
            "pointer-events": menuVisible() ? "auto" : "none",
            transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
            background: "white",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            "z-index": 10,
          }}
        >
          <MenuObject />
        </div> */}
      </div>
    </context.Provider>
  );
}

export default App;
