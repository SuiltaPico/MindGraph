import { createContext, onMount, Setter, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { createSignal, WrappedSignal } from "./common/signal";
import { createSignal as solidCreateSignal } from "solid-js";
import { NodeWithRoot } from "./api/types/node";
import { MindNode } from "./MindNode";
import FnBar from "./FnBar";
import MenuObject from "./MenuObject";

interface AppContext {
  map: Record<number, NodeWithRoot>;
  meta_map: WrappedSignal<Record<number, NodeMeta>>;
}

interface NodeMeta {
  center_x: number;
  center_y: number;
}

export const context = createContext<AppContext>();

export function App() {
  const nodes = createSignal<NodeWithRoot[]>([]);
  const map: Record<number, NodeWithRoot> = {};
  const meta_map: WrappedSignal<Record<number, NodeMeta>> = createSignal({});
  const [menuVisible, setMenuVisible] = solidCreateSignal(false);

  onMount(async () => {
    const new_nodes: NodeWithRoot[] = await invoke("get_top_nodes", {
      deep: 5,
    });
    console.log(new_nodes);

    for (const node of new_nodes) {
      map[node.id] = node;
    }
    nodes.set(new_nodes);
  });

  return (
    <div
      class="fcol"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <FnBar menuVisible={menuVisible()} setMenuVisible={setMenuVisible} />
      <context.Provider
        value={{
          map,
          meta_map,
        }}
      >
        <div class="node_canvas">
          <Show when={nodes.get().length > 0}>
            <MindNode it={nodes.get()[0]}></MindNode>
          </Show>
        </div>
      </context.Provider>
      <div
        style={{
          width: "100%",
          height: "100%",
          visibility: menuVisible() ? "visible" : "hidden",
          opacity: menuVisible() ? 1 : 0,
          "pointer-events": menuVisible() ? "auto" : "none",
          transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
          background: "white",
          position: "fixed",
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
  );
}

export const resize_obs_map = new Map<
  any,
  (entry: ResizeObserverEntry) => void
>();
export const resize_obs = new ResizeObserver((entries) => {
  for (const entry of entries) {
    resize_obs_map.get(entry.target)?.(entry);
  }
});

export default App;
