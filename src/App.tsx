import {
  createContext,
  For,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { createSignal } from "./common/signal";
import { NodeWithRoot } from "./api/types/node";

interface AppContext {
  map: Record<number, NodeWithRoot>;
}

const context = createContext<AppContext>();

export function App() {
  const nodes = createSignal<NodeWithRoot[]>([]);
  const map: Record<number, NodeWithRoot> = {};

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
      }}
    >
      <div class="canvas">
        <div class="node_canvas">
          <Show when={nodes.get().length > 0}>
            <MindNode it={nodes.get()[0]}></MindNode>
          </Show>
        </div>
        <div class="edge_canvas">
          <svg></svg>
        </div>
      </div>
    </context.Provider>
  );
}

export function MindNode(props: { it: NodeWithRoot }) {
  const node = props.it;
  const ctx = useContext(context);

  return (
    <div class="frow gap-2">
      <div class="bg-[#eee] self-center p-1 rounded" contenteditable>
        {node.content.value}
      </div>
      <div class="fcol gap-2">
        <For each={props.it.children}>
          {(it) => <MindNode it={ctx!.map[it]}></MindNode>}
        </For>
      </div>
    </div>
  );
}

export default App;
