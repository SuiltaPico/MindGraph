import { createSignal, WrappedSignal } from "@/common/signal";
import { useContext, onMount, mapArray, For, Show, Accessor } from "solid-js";
import { MindNodeHelper, CanvasStateContext } from "./Canvas";
import clsx from "clsx";

class RedrawHelper {
  node_y_offset = 0;
  need_full_redraw = false;
  last_container_height: number = 0;

  container: HTMLDivElement = undefined as any;
  node: HTMLDivElement & { _id?: string } = undefined as any;
  children_streamline_group: SVGGElement = undefined as any;
  main_streamline: SVGPathElement = undefined as any;
  folding_points: SVGCircleElement = undefined as any;

  onmount(
    container: HTMLDivElement,
    node: HTMLDivElement & { _id?: string },
    children_streamline_group: SVGGElement,
    main_streamline: SVGPathElement,
    folding_points: SVGCircleElement
  ) {
    this.container = container;
    this.node = node;
    this.children_streamline_group = children_streamline_group;
    this.main_streamline = main_streamline;
    this.folding_points = folding_points;
  }

  /**
   * 重新绘制与中心相关的对象。包含主流线、折叠点、节点等。
   * 该函数会计算 node_y_offset
   */
  redraw_center_related_objects() {
    const node_right = this.node.offsetWidth;

    const children_containers = this.children_data_map();
    let offseted_center_y;

    const container_center_x = this.node.offsetWidth + 16;
    const container_center_y = this.container.offsetHeight / 2;

    // 计算中心位置
    if (
      !this.folded.get() &&
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
      this.node_y_offset = offseted_center_y - container_center_y;
    } else {
      offseted_center_y = container_center_y;
      this.node_y_offset = 0;
    }

    // 绘制主流线
    this.main_streamline.setAttribute?.(
      "d",
      `M ${node_right} ${offseted_center_y} L ${container_center_x} ${offseted_center_y}`
    );

    // 绘制折叠点
    this.folding_points.setAttribute("cx", container_center_x + "");
    this.folding_points.setAttribute("cy", offseted_center_y + "");

    // 设置节点位置
    this.node.style.setProperty("top", this.node_y_offset + "px");
  }

  full_redraw() {
    const len = this.it.get_prop("children").length;
    for (let i = 0; i < len; i++) {
      const child_container_data = this.children_data_map()[i];
      const child_container = child_container_data.container;
      if (!child_container) continue;

      const x1 = this.node.offsetWidth + 16;
      const y1 = this.container.offsetHeight / 2;
      const x2 = this.node.offsetWidth + 32;
      const y2 =
        child_container.offsetTop +
        child_container_data.node_y_offset +
        child_container.offsetHeight / 2;
      (
        this.children_streamline_group.childNodes[i] as SVGLineElement
      ).setAttribute(
        "d",
        `M ${x1} ${y1} C ${x2 + (x1 - x2)} ${y1 + (y2 - y1) * 1} ${
          x2 + (x1 - x2)
        } ${y1 + (y2 - y1)} ${x2} ${y2}`
      );
    }

    let prev_node_y_offset = this.node_y_offset;
    this.redraw_center_related_objects();

    this.need_full_redraw = false;
    if (
      this.last_container_height !== this.container.offsetHeight ||
      prev_node_y_offset !== this.node_y_offset
    ) {
      this.it.render_info.onresize?.(this.container, this.node_y_offset);
      this.last_container_height = this.container.offsetHeight;
    }
  }

  /** 在下一帧绘制子节点流线。 */
  async full_redraw_next_tick() {
    if (this.need_full_redraw === false) {
      this.need_full_redraw = true;
      queueMicrotask(() => {
        this.full_redraw();
      });
    }
  }

  /** 处理子节点容器大小变化。 */
  handle_children_resize(
    child_container: HTMLElement,
    node_y_offset: number,
    index: number
  ) {
    const children_container_data = this.children_data_map()[index];
    children_container_data.container = child_container;
    children_container_data.node_y_offset = node_y_offset;
    this.full_redraw_next_tick();
  }

  constructor(
    public it: MindNodeHelper,
    public children_data_map: Accessor<
      {
        container?: HTMLElement;
        node_y_offset: number;
      }[]
    >,
    public folded: WrappedSignal<boolean>
  ) {}
}

export const MindNodeContentRenderer = (props: { it: MindNodeHelper }) => {
  const it = props.it;
  const ctx = useContext(CanvasStateContext)!;

  /** 是否已折叠。 */
  const folded = createSignal(false);

  let container: HTMLDivElement;
  let node: HTMLDivElement & { _id?: string };
  let children_streamline_group: SVGGElement;
  let main_streamline: SVGPathElement;
  let folding_points: SVGCircleElement;

  /** 子节点容器数据。会随着子节点增删而自动变化。 */
  const children_data_map = mapArray(
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

  const redraw_helper = new RedrawHelper(props.it, children_data_map, folded);

  onMount(() => {
    node._id = it.node.id;
    redraw_helper.onmount(
      container,
      node,
      children_streamline_group,
      main_streamline,
      folding_points
    );

    it.render_info.handle_obs_resize = () => {
      redraw_helper.full_redraw();
      it.render_info.onresize?.(container, redraw_helper.node_y_offset);
    };
    ctx.resize_obs.observe(node);
    redraw_helper.redraw_center_related_objects();
    redraw_helper.last_container_height = container.offsetHeight;
  });

  /** 处理折叠点点击。 */
  function handle_folding_points_click() {
    folded.set(!folded.get());
    redraw_helper.redraw_center_related_objects();
  }

  function handle_node_click() {
    ctx.focus_node(it.node.id);
  }

  return (
    <div
      class="mind_node_renderer"
      ref={(it) => {
        container = it;
      }}
    >
      <div
        class={clsx("__node", it.render_info.focused.get() && "__focused")}
        contenteditable
        onClick={handle_node_click}
        ref={(it) => (node = it)}
      >
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
        <path
          style={{
            display:
              props.it.get_prop("children").length > 0 ? "block" : "none",
          }}
          ref={(it) => (main_streamline = it)}
        ></path>
        <circle
          class="__folding_point"
          r={6}
          ref={(it) => (folding_points = it)}
          style={{
            display:
              props.it.get_prop("children").length > 0 &&
              it.render_info.focused.get()
                ? "block"
                : "none",
          }}
          onClick={handle_folding_points_click}
        ></circle>
      </svg>
      <Show when={!folded.get()}>
        <div class="__children">
          <For each={props.it.get_prop("children")}>
            {(it, i) =>
              ctx.render_node(it, {
                onresize: (child_container, node_y_offset) =>
                  redraw_helper.handle_children_resize(
                    child_container,
                    node_y_offset,
                    i()
                  ),
              })
            }
          </For>
        </div>
      </Show>
    </div>
  );
};
