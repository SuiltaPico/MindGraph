import {
  createContext,
  onMount,
  Setter,
  Show,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { createSignal, WrappedSignal } from "./common/signal";
import { NodeWithRoot } from "./api/types/node";
import { MindNode } from "./MindNode";

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
  );
}

export const resize_obs_map = new Map<any, (entry: ResizeObserverEntry) => void>();
export const resize_obs = new ResizeObserver((entries) => {
  for (const entry of entries) {
    resize_obs_map.get(entry.target)?.(entry);
  }
});

export default App;
