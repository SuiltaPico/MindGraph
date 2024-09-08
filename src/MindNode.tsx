import { createMemo, For, mapArray, onMount, useContext } from "solid-js";
import { NodeWithRoot } from "./api/types/node";
import { context, resize_obs, resize_obs_map } from "./App";
import { createSignal } from "./common/signal";

export function MindNode(props: {
  it: NodeWithRoot;
  // ref?: (el: HTMLDivElement) => void;
  onResize?: (container: HTMLDivElement, node_rect: DOMRect) => void;
}) {
  const node = props.it;
  const ctx = useContext(context);

  let container: HTMLDivElement;
  let node_el: HTMLDivElement;
  let svg_el = createSignal<SVGElement | undefined>(undefined);

  const children_len = props.it.children.length;
  const main_line_el = createMemo(
    () => svg_el.get()?.childNodes[children_len] as SVGPathElement,
    undefined
  );

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

    // 节点中心
    const x1 = node_rect.width / 2;
    const y1 = container_rect.height / 2;
    const x2 = node_rect.width + 16;
    const y2 = y1;
    main_line_el()?.setAttribute?.("d", `M ${x1} ${y1} L ${x2} ${y2}`);
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
      class="tree_container frow relative top-0 left-0"
      ref={(it) => {
        container = it;
        // props.ref?.(it);
      }}
    >
      <svg
        class="edge_canvas absolute top-0 left-0 w-full h-full -z-1"
        ref={(it) => svg_el.set(it)}
      >
        {/* 分流线 */}
        <For each={props.it.children}>
          {() => <path stroke="#868686" stroke-width="1" fill="none"></path>}
        </For>
        {/* 主线 */}
        <path stroke="#868686" stroke-width="1" fill="none"></path>
      </svg>
      <div
        class="bg-[#eee] self-center p-1 rounded mr-[32px]"
        contenteditable
        ref={(it) => (node_el = it)}
      >
        {node.content.value}
      </div>
      <div class="fcol gap-y-4">
        <For each={props.it.children}>
          {(it, i) => {
            return (
              <MindNode
                it={ctx!.map[it]}
                onResize={(child_container, child_node_rect) => {
                  const x1 = node_rect.width + 16;
                  const y1 = container_rect.height / 2;
                  const x2 = node_rect.width + 32;
                  const y2 =
                    child_container.offsetTop +
                    child_container.clientHeight / 2;

                  (
                    svg_el.get()?.childNodes[i()] as SVGLineElement
                  ).setAttribute(
                    "d",
                    `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1) * 1} ${
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
