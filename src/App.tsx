import { invoke } from "@tauri-apps/api/core";
import { createContext, onMount, createSignal as solidCreateSignal } from "solid-js";
import { IMindNode } from "./api/types/node";
import { Canvas, CanvasState } from "./components/canvas/Canvas";
import FnBar from "./components/menu/FnBar";
import MenuObject from "./components/menu/MenuObject";

export class AppContext {}
export const context = createContext<AppContext>();

export function App() {
  const [menuVisible, setMenuVisible] = solidCreateSignal(false);
  const canvas_state = new CanvasState({
    load_node: async (id: number) => {
      const node = await invoke("load_node", { id });
      return node as IMindNode;
    },
  });

  onMount(async () => {
    canvas_state.root.set(1);
  });

  return (
    <context.Provider value={{}}>
      <div
        class="fcol"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <FnBar menuVisible={menuVisible()} setMenuVisible={setMenuVisible} />
        <Canvas state={canvas_state} />
        <div
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
        </div>
      </div>
    </context.Provider>
  );
}

export default App;
