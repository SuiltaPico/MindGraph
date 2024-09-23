import { createSignal } from "@/common/signal";
import {
  Component,
  createResource,
  For,
  mapArray,
  Match,
  onMount,
  Show,
  Switch,
  useContext,
} from "solid-js";
import { Accordion, AccordionRenderer } from "../base/Accordion";
import { CanvasStateContext, MindNodeHelper } from "./Canvas";
import "./MindNodeRenderer.scss";

export const MindNodePendingRenderer: Component<{
  id: number;
}> = (props) => {
  let container: HTMLDivElement;
  const ctx = useContext(CanvasStateContext)!;

  onMount(() => {
    ctx.get_render_info(props.id).onresize?.(container, 0);
  });

  return (
    <div
      class="mind_node_pending"
      ref={(it) => {
        container = it;
      }}
    >
      加载中...
    </div>
  );
};

export const MindNodeErrorRenderer: Component<{
  error: any;
  retry: () => void;
  id: number;
}> = (props) => {
  let container: HTMLDivElement;
  const ctx = useContext(CanvasStateContext)!;

  onMount(() => {
    ctx.get_render_info(props.id).onresize?.(container, 0);
  });

  const accordion = new Accordion();
  return (
    <div
      class="mind_node_error"
      ref={(it) => {
        container = it;
      }}
    >
      节点加载失败。
      <AccordionRenderer
        class="__accordion"
        state={accordion}
        _title={<div>错误信息</div>}
        _content={<div>{String(props.error)}</div>}
      ></AccordionRenderer>
      <button onClick={props.retry}>重试</button>
    </div>
  );
};

export const MindNodeContentRenderer = (props: { it: MindNodeHelper }) => {
  const it = props.it;
  const ctx = useContext(CanvasStateContext)!;

  const folded = createSignal(false);

  let container: HTMLDivElement;
  let node: HTMLDivElement & { _id?: number };
  let streamline_group: SVGGElement;
  let main_streamline: SVGPathElement;
  let folding_points: SVGCircleElement;

  let container_rect = new DOMRect();

  onMount(() => {
    node._id = it.node.id;
    it.render_info.handle_obs_resize = () => {
      console.log("on_resize");

      redraw_subnode_streamline();
      it.render_info.onresize?.(container, node_y_offset);
    };
    ctx.resize_obs.observe(node);
    handle_redraw_main_line();

    last_container_height = container.offsetHeight;
  });

  let node_y_offset = 0;
  function handle_redraw_main_line() {
    const node_right = node.offsetWidth;

    const children_containers = children_container_map();
    let center_x, center_y;

    center_x = node.offsetWidth + 16;
    const container_center_y = container_rect.height / 2;

    if (children_containers.length > 1 && children_containers[0].container) {
      const first_child_container = children_containers[0].container!;
      const last_child_container =
        children_containers[children_containers.length - 1].container!;
      const ft = first_child_container.offsetTop;
      const fh = first_child_container.offsetHeight;
      const lt = last_child_container.offsetTop;
      const lh = last_child_container.offsetHeight;

      center_y = ft + fh / 2 + (lt + lh / 2 - (ft + fh / 2)) / 2;
      node_y_offset = center_y - container_center_y;
    } else {
      center_y = container_center_y;
      node_y_offset = 0;
    }

    main_streamline?.setAttribute?.(
      "d",
      `M ${node_right} ${center_y} L ${center_x} ${center_y}`
    );

    folding_points.setAttribute("cx", center_x + "");
    folding_points.setAttribute("cy", center_y + "");

    node.style.setProperty("top", node_y_offset + "px");
  }

  const children_container_map = mapArray(
    () => props.it.get_prop("children"),
    () => {
      return {
        node_y_offset: 0,
      } as {
        container?: HTMLElement;
        node_y_offset: number;
      };
    }
  );

  let need_redraw_subnode_streamline = false;
  let last_container_height: number;
  function redraw_subnode_streamline() {
    container_rect = container.getBoundingClientRect();

    const len = props.it.get_prop("children").length;
    for (let i = 0; i < len; i++) {
      const child_container_data = children_container_map()[i];
      const child_container = child_container_data.container;
      if (!child_container) continue;

      const x1 = node.offsetWidth + 16;
      const y1 = container_rect.height / 2;
      const x2 = node.offsetWidth + 32;
      const y2 =
        child_container.offsetTop +
        child_container_data.node_y_offset +
        child_container.clientHeight / 2;
      (streamline_group.childNodes[i] as SVGLineElement).setAttribute(
        "d",
        `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1) * 1} ${
          x2 + (x1 - x2)
        } ${y1 + (y2 - y1)} ${x2} ${y2}`
      );
    }

    let prev_node_y_offset = node_y_offset;
    handle_redraw_main_line();

    need_redraw_subnode_streamline = false;
    if (
      last_container_height !== container.offsetHeight ||
      prev_node_y_offset !== node_y_offset
    ) {
      it.render_info.onresize?.(container, node_y_offset);
      last_container_height = container.offsetHeight;
    }
  }
  function redraw_subnode_streamline_next_tick() {
    if (need_redraw_subnode_streamline === false) {
      need_redraw_subnode_streamline = true;
      queueMicrotask(() => {
        redraw_subnode_streamline();
      });
    }
  }

  function handle_children_resize(
    child_container: HTMLElement,
    node_y_offset: number,
    index: number
  ) {
    const children_container_data = children_container_map()[index];
    children_container_data.container = child_container;
    children_container_data.node_y_offset = node_y_offset;
    redraw_subnode_streamline_next_tick();
  }

  function handle_folding_points_click() {
    folded.set(!folded.get());
  }

  return (
    <div
      class="mind_node"
      ref={(it) => {
        container = it;
      }}
    >
      <div class="__node" contenteditable ref={(it) => (node = it)}>
        {it.get_prop("content").value}
      </div>
      <svg class="__diversion">
        <g
          style={{
            display: folded.get() ? "none" : "block",
          }}
          ref={(it) => (streamline_group = it)}
        >
          {/* 分流线 */}
          <For each={props.it.get_prop("children")}>
            {() => <path stroke="#868686" stroke-width="1" fill="none"></path>}
          </For>
        </g>
        {/* 主线 */}
        <path
          stroke="#868686"
          stroke-width="1"
          fill="none"
          ref={(it) => (main_streamline = it)}
        ></path>
        {/* 折叠点 */}
        <circle
          class="cursor-pointer"
          r={6}
          fill="#868686"
          ref={(it) => (folding_points = it)}
          onClick={handle_folding_points_click}
        ></circle>
      </svg>
      <Show when={!folded.get()}>
        <div class="__children">
          <For each={props.it.get_prop("children")}>
            {(it, i) =>
              ctx.render_node(it, {
                onresize: (child_container, node_y_offset) =>
                  handle_children_resize(child_container, node_y_offset, i()),
              })
            }
          </For>
        </div>
      </Show>
    </div>
  );
};

export function MindNodeRenderer(props: { id: number }) {
  const node_id = props.id;
  const ctx = useContext(CanvasStateContext);

  const [node, { refetch }] = createResource(() => ctx!.get_node(node_id));

  return (
    <Switch>
      <Match when={node.state === "pending" || node.state === "refreshing"}>
        <MindNodePendingRenderer id={node_id} />
      </Match>
      <Match when={node.state === "ready"}>
        <MindNodeContentRenderer it={node()!} />
      </Match>
      <Match when={node.state === "errored"}>
        <MindNodeErrorRenderer
          error={node.error}
          retry={refetch}
          id={node_id}
        />
      </Match>
    </Switch>
  );
}
