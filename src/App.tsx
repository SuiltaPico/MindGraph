import {
  createContext,
  For,
  mapArray,
  onMount,
  Setter,
  Show,
  useContext,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { createSignal, WrappedSignal } from "./common/signal";
import { NodeWithRoot } from "./api/types/node";

interface AppContext {
  map: Record<number, NodeWithRoot>;
  meta_map: WrappedSignal<Record<number, NodeMeta>>;
}

interface NodeMeta {
  center_x: number;
  center_y: number;
}

const context = createContext<AppContext>();

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

const resize_obs_map = new Map<any, (entry: ResizeObserverEntry) => void>();
const resize_obs = new ResizeObserver((entries) => {
  for (const entry of entries) {
    resize_obs_map.get(entry.target)?.(entry);
  }
});

export function MindNode(props: {
  it: NodeWithRoot;
  // ref?: (el: HTMLDivElement) => void;
  onResize?: (container: HTMLDivElement, node_rect: DOMRect) => void;
}) {
  const node = props.it;
  const ctx = useContext(context);

  let container: HTMLDivElement;
  let node_el: HTMLDivElement;
  let svg_el: SVGElement;

  let container_rect: DOMRect;
  let node_rect: DOMRect;
  function calc_container_rect() {
    container_rect = container.getBoundingClientRect();
    node_rect = node_el.getBoundingClientRect();
  }
  onMount(() => {
    resize_obs_map.set(container, () => {
      calc_container_rect();
      props.onResize?.(container, node_rect);
    });
    resize_obs.observe(container);

    calc_container_rect();
    props.onResize?.(container, node_rect);
  });

  const mapped = mapArray(
    () => props.it.children,
    () => ({
      x: 0,
      y: 0,
    })
  );

  return (
    <div
      class="tree_container frow gap-4 relative"
      ref={(it) => {
        container = it;
        // props.ref?.(it);
      }}
    >
      <svg
        class="edge_canvas absolute top-0 left-0 w-full h-full -z-1"
        ref={(it) => (svg_el = it)}
      >
        <For each={props.it.children}>
          {(it) => <path stroke="#868686" stroke-width="1" fill="none"></path>}
        </For>
      </svg>
      <div
        class="bg-[#eee] self-center p-1 rounded"
        contenteditable
        ref={(it) => (node_el = it)}
      >
        {node.content.value}
      </div>
      <div class="fcol gap-4">
        <For each={props.it.children}>
          {(it, i) => {
            return (
              <MindNode
                it={ctx!.map[it]}
                onResize={(child_container, child_node_rect) => {
                  console.log(child_container.clientHeight);

                  const x1 = node_rect.width / 2;
                  const y1 = container_rect.height / 2;
                  const x2 = node_rect.width + child_node_rect.width / 2;
                  const y2 =
                    child_container.offsetTop +
                    child_container.clientHeight / 2;

                  (svg_el.childNodes[i()] as SVGLineElement).setAttribute(
                    "d",
                    `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1)*1} ${
                      x2 + (x1 - x2)
                    } ${y1 + (y2 - y1)} ${x2} ${y2}`
                  );
                }}
              ></MindNode>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export default App;
