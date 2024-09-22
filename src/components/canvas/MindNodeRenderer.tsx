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
import { debounce } from "throttle-debounce";
import "./MindNodeRenderer.scss";
import { createSignal } from "@/common/signal";

export const MindNodePendingRenderer: Component<{
  id: number;
}> = (props) => {
  let container: HTMLDivElement;
  const ctx = useContext(CanvasStateContext)!;

  onMount(() => {
    ctx.get_render_info(props.id).onresize?.(container);
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
    ctx.get_render_info(props.id).onresize?.(container);
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

  let node_rect = new DOMRect();
  let container_rect = new DOMRect();

  onMount(() => {
    node._id = it.node.id;
    it.render_info.handle_obs_resize = () => {
      console.log("on_resize");

      redraw_subnode_streamline();
      it.render_info.onresize?.(container);
    };
    ctx.resize_obs.observe(node);
    handle_redraw_main_line();

    last_container_height = container.offsetHeight;
  });

  function handle_redraw_main_line() {
    const node_right = node.offsetWidth;

    const center_x = node.offsetWidth + 16;
    const center_y = container_rect.height / 2;

    main_streamline?.setAttribute?.(
      "d",
      `M ${node_right} ${center_y} L ${center_x} ${center_y}`
    );

    folding_points.setAttribute("cx", center_x + "");
    folding_points.setAttribute("cy", center_y + "");
  }

  const container_map = mapArray(
    () => props.it.get_prop("children"),
    () => {
      return {} as {
        container?: HTMLElement;
      };
    }
  );

  let need_redraw_subnode_streamline = false;
  let last_container_height: number;
  function redraw_subnode_streamline() {
    node_rect = node.getBoundingClientRect();
    container_rect = container.getBoundingClientRect();

    const len = props.it.get_prop("children").length;
    for (let i = 0; i < len; i++) {
      const child_container = container_map()[i].container;
      if (!child_container) continue;

      const x1 = node.offsetWidth + 16;
      const y1 = container_rect.height / 2;
      const x2 = node.offsetWidth + 32;
      const y2 = child_container.offsetTop + child_container.clientHeight / 2;
      (streamline_group.childNodes[i] as SVGLineElement).setAttribute(
        "d",
        `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1) * 1} ${
          x2 + (x1 - x2)
        } ${y1 + (y2 - y1)} ${x2} ${y2}`
      );
    }

    handle_redraw_main_line();

    need_redraw_subnode_streamline = false;
    if (last_container_height !== container.offsetHeight) {
      it.render_info.onresize?.(container);
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

  function handle_children_resize(child_container: HTMLElement, index: number) {
    container_map()[index].container = child_container;
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
                onresize: (child_container) =>
                  handle_children_resize(child_container, i()),
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
