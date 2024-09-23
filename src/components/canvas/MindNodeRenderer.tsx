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

  /** 是否已折叠。 */
  const folded = createSignal(false);

  let container: HTMLDivElement;
  let node: HTMLDivElement & { _id?: number };

  let children_streamline_group: SVGGElement;
  let main_streamline: SVGPathElement;
  let folding_points: SVGCircleElement;

  onMount(() => {
    node._id = it.node.id;
    it.render_info.handle_obs_resize = () => {
      full_redraw();
      it.render_info.onresize?.(container, node_y_offset);
    };
    ctx.resize_obs.observe(node);
    redraw_center_related_objects();

    last_container_height = container.offsetHeight;
  });

  /** 节点相对于容器中心的偏移量 */
  let node_y_offset = 0;
  /**
   * 重新绘制与中心相关的对象。包含主流线、折叠点、节点等。
   * 该函数会计算 node_y_offset 
   */
  function redraw_center_related_objects() {
    const node_right = node.offsetWidth;

    const children_containers = children_container_map();
    let offseted_center_y;

    const container_center_x = node.offsetWidth + 16;
    const container_center_y = container.offsetHeight / 2;

    // 计算中心位置
    if (
      !folded.get() &&
      children_containers.length > 1 &&
      children_containers[0].container
    ) {
      const first_child_container = children_containers[0].container!;
      const last_child_container =
        children_containers[children_containers.length - 1].container!;
      const ft = first_child_container.offsetTop;
      const fh = first_child_container.offsetHeight;
      const lt = last_child_container.offsetTop;
      const lh = last_child_container.offsetHeight;

      offseted_center_y = ft + fh / 2 + (lt + lh / 2 - (ft + fh / 2)) / 2;
      node_y_offset = offseted_center_y - container_center_y;
    } else {
      offseted_center_y = container_center_y;
      node_y_offset = 0;
    }

    // 绘制主流线
    main_streamline?.setAttribute?.(
      "d",
      `M ${node_right} ${offseted_center_y} L ${container_center_x} ${offseted_center_y}`
    );

    // 绘制折叠点
    folding_points.setAttribute("cx", container_center_x + "");
    folding_points.setAttribute("cy", offseted_center_y + "");

    // 设置节点位置
    node.style.setProperty("top", node_y_offset + "px");
  }

  /** 子节点容器数据。会随着子节点增删而自动变化。 */
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

  let need_full_redraw = false;
  let last_container_height: number;
  function full_redraw() {
    const len = props.it.get_prop("children").length;
    for (let i = 0; i < len; i++) {
      const child_container_data = children_container_map()[i];
      const child_container = child_container_data.container;
      if (!child_container) continue;

      const x1 = node.offsetWidth + 16;
      const y1 = container.offsetHeight / 2;
      const x2 = node.offsetWidth + 32;
      const y2 =
        child_container.offsetTop +
        child_container_data.node_y_offset +
        child_container.offsetHeight / 2;
      (children_streamline_group.childNodes[i] as SVGLineElement).setAttribute(
        "d",
        `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1) * 1} ${
          x2 + (x1 - x2)
        } ${y1 + (y2 - y1)} ${x2} ${y2}`
      );
    }

    let prev_node_y_offset = node_y_offset;
    redraw_center_related_objects();

    need_full_redraw = false;
    if (
      last_container_height !== container.offsetHeight ||
      prev_node_y_offset !== node_y_offset
    ) {
      it.render_info.onresize?.(container, node_y_offset);
      last_container_height = container.offsetHeight;
    }
  }

  /** 在下一帧绘制子节点流线。 */
  function full_redraw_next_tick() {
    if (need_full_redraw === false) {
      need_full_redraw = true;
      queueMicrotask(() => {
        full_redraw();
      });
    }
  }

  /** 处理子节点容器大小变化。 */
  function handle_children_resize(
    child_container: HTMLElement,
    node_y_offset: number,
    index: number
  ) {
    const children_container_data = children_container_map()[index];
    children_container_data.container = child_container;
    children_container_data.node_y_offset = node_y_offset;
    full_redraw_next_tick();
  }

  /** 处理折叠点点击。 */
  function handle_folding_points_click() {
    folded.set(!folded.get());
    redraw_center_related_objects();
  }

  return (
    <div
      class="mind_node_renderer"
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
          ref={(it) => (children_streamline_group = it)}
        >
          <For each={props.it.get_prop("children")}>{() => <path></path>}</For>
        </g>
        <path ref={(it) => (main_streamline = it)}></path>
        <circle
          class="__folding_point"
          r={6}
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
