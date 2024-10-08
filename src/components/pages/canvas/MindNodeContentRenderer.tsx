import { createSignal, WrappedSignal } from "@/common/signal";
import clsx from "clsx";
import {
  Accessor,
  createEffect,
  createMemo,
  For,
  mapArray,
  on,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { CanvasState, CanvasStateContext, MindNodeHelper } from "./CanvasState";
import { MindNodeRendererElement } from "./MindNodeRenderer";

class RedrawHelper {
  /** 节点相对于容器中心的偏移量。
   * * 计算公式：去除子项高度去除头尾一半后，再除以2的位置。
   * * 存在原因：为了让父节点的展示位置相对子节点在视觉上更加居中。
   * * 影响：让当前节点的中心位置产生偏移。
   */
  node_y_offset = 0;
  /** 全量重绘是否会在下一 tick 执行。 */
  full_redraw_required = false;
  /** 容器高度。 */
  last_container_height: number = 0;

  container: MindNodeRendererElement = undefined as any;
  node: HTMLDivElement = undefined as any;
  children_streamline_group: SVGGElement = undefined as any;
  main_streamline: SVGPathElement = undefined as any;
  folding_points: SVGCircleElement = undefined as any;

  onmount(
    container: MindNodeRendererElement,
    node: HTMLDivElement,
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

    const children_data = this.children_data_map();

    let offseted_center_y;

    const container_center_x = this.node.offsetWidth + 16;
    const container_center_y = this.container.offsetHeight / 2;

    let first_child_container;
    let last_child_container;

    // 计算中心位置
    if (
      !this.folded.get() &&
      children_data.length > 1 &&
      (first_child_container = this.ctx.get_render_context(
        children_data[0].id,
        this.it.id
      )?.dom_el) &&
      (last_child_container = this.ctx.get_render_context(
        children_data[children_data.length - 1].id,
        this.it.id
      )?.dom_el)
    ) {
      console.log(first_child_container, last_child_container);
      const ft = first_child_container.offsetTop;
      const fh = first_child_container.offsetHeight;
      const lt = last_child_container.offsetTop;
      const lh = last_child_container.offsetHeight;

      offseted_center_y = ft + fh / 2 + (lt + lh / 2 - (ft + fh / 2)) / 2;
      this.node_y_offset = offseted_center_y - container_center_y;

      console.log(
        "new node_y_offset",
        this.it.node.content.value,
        this.node_y_offset,
        {
          container_center_y,
          offseted_center_y,
          ft,
          fh,
          lt,
          lh,
        }
      );
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
    let prev_node_y_offset = this.node_y_offset;
    // 绘制子节点流线依赖最新的 node_y_offset，redraw_center_related_objects 会更新该值，所以必须先调用该函数。
    this.redraw_center_related_objects();

    // 绘制子节点流线
    const len = this.it.get_prop("children").length;

    const rx = 8;
    const ry = 8;

    const cx = this.node.offsetWidth + 16;
    const ccx = this.node.offsetWidth + 32;
    const cy = this.container.offsetHeight / 2 + this.node_y_offset;

    for (let i = 0; i < len; i++) {
      const child_container_data = this.children_data_map()[i];
      const child_container = this.ctx.get_render_context(
        child_container_data.id,
        this.it.id
      )?.dom_el;
      if (!child_container) continue;

      const ccy =
        child_container.offsetTop +
        child_container_data.node_y_offset +
        child_container.offsetHeight / 2;

      const x_diff = cx - ccx;
      const y_diff = cy - ccy;

      const children_streamline = this.children_streamline_group.childNodes[
        i
      ] as SVGLineElement;

      if (y_diff !== 0) {
        const ell_start_x = cx;
        const ell_start_y =
          cy -
          y_diff +
          (y_diff > 0 ? Math.min(y_diff, ry) : Math.max(y_diff, -ry));

        const ell_end_x = ccx + x_diff - (x_diff > 0 ? rx : -rx);
        const ell_end_y = ccy;

        children_streamline.setAttribute(
          "d",
          `
          M ${cx} ${cy} L ${ell_start_x} ${ell_start_y}
          A ${rx} ${ry} 0 0 ${y_diff > 0 ? 1 : 0} ${ell_end_x} ${ell_end_y}
          M ${ell_end_x} ${ell_end_y} L ${ccx} ${ccy}
        `
        );
      } else {
        children_streamline.setAttribute("d", `M ${cx} ${cy} L ${ccx} ${ccy}`);
      }
    }

    this.full_redraw_required = false;
    if (
      this.last_container_height !== this.container.offsetHeight ||
      prev_node_y_offset !== this.node_y_offset
    ) {
      this.it.rc.onresize?.(this.node_y_offset);
      this.last_container_height = this.container.offsetHeight;
    }
  }

  /** 在下一帧绘制子节点流线。 */
  async full_redraw_next_tick() {
    if (this.full_redraw_required === false) {
      this.full_redraw_required = true;
      queueMicrotask(() => {
        this.full_redraw();
      });
    }
  }

  /** 处理子节点容器大小变化。 */
  handle_children_resize(node_y_offset: number, index: number) {
    const children_container_data = this.children_data_map()[index];
    // children_container_data.container = child_container;
    children_container_data.node_y_offset = node_y_offset;
    this.full_redraw_next_tick();
  }

  constructor(
    public ctx: CanvasState,
    public it: MindNodeHelper,
    public children_data_map: Accessor<
      {
        id: string;
        node_y_offset: number;
      }[]
    >,
    public folded: WrappedSignal<boolean>
  ) {}
}

export const MindNodeContentRenderer = (props: { it: MindNodeHelper }) => {
  const it = props.it;
  const ctx = useContext(CanvasStateContext)!;

  const focused = createMemo(() => it.ri.focused.get() === it.rc.parent_rc.id);
  const editing = createSignal(false);
  /** 是否已折叠。 */
  const folded = createSignal(false);

  createEffect(
    on(focused, (focused) => {
      if (!focused) {
        editing.set(false);
      }
    })
  );

  let container: MindNodeRendererElement;
  let node: HTMLDivElement;
  let children_streamline_group: SVGGElement;
  let main_streamline: SVGPathElement;
  let folding_points: SVGCircleElement;

  /** 子节点容器数据。会随着子节点增删而自动变化。 */
  const children_data_map = mapArray(
    () => props.it.get_prop("children"),
    (id) => {
      return {
        id: id,
        node_y_offset: 0,
      } as {
        id: string;
        container?: HTMLElement;
        node_y_offset: number;
      };
    }
  );

  const redraw_helper = new RedrawHelper(
    ctx,
    props.it,
    children_data_map,
    folded
  );

  onMount(() => {
    ctx.get_render_context(it.node.id, it.parent_id)!.dom_el = container;
    console.log(props.it.node.content.value, "onmount");

    redraw_helper.onmount(
      container,
      node,
      children_streamline_group,
      main_streamline,
      folding_points
    );
    it.rc.handle_obs_resize = () => {
      redraw_helper.full_redraw();
      it.rc.onresize?.(redraw_helper.node_y_offset);
    };
    ctx.resize_obs.observe(node);
    redraw_helper.redraw_center_related_objects();
    redraw_helper.last_container_height = container.offsetHeight;
    it.rc.disposers.push(() => ctx.resize_obs.unobserve(node));

    createEffect(
      on(focused, () => {
        // console.log(it.node.content, "聚焦了", container);
        node.focus();
      })
    );
  });

  /** 处理折叠点点击。 */
  function handle_folding_points_click() {
    folded.set(!folded.get());
    redraw_helper.redraw_center_related_objects();
  }

  function handle_node_dblclick() {
    if (!editing.get()) {
      editing.set(true);
      const selection = window.getSelection();
      node.focus();
      if (selection) {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.setStart(node, node.childNodes.length);
        selection.addRange(range);
      }
    }
  }

  function handle_node_input(e: InputEvent & { target: Element }) {
    it.set_prop("content", { value: e.target.textContent });
    ctx.mark_modified(it.node.id);
  }

  return (
    <div
      class={clsx("mind_node_renderer", focused() && "__focused__")}
      ref={(el) => {
        container = el as MindNodeRendererElement;
        container._meta = {
          state: "ready",
          id: it.node.id,
          parent_id: it.parent_id,
          rc: it.rc,
        };
      }}
    >
      <div
        class={"__node"}
        contenteditable={editing.get()}
        draggable={!editing.get()}
        onDblClick={handle_node_dblclick}
        onInput={handle_node_input}
        ref={(el) => {
          node = el as MindNodeRendererElement;
        }}
      >
        {it.node.content.value}
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
              props.it.get_prop("children").length > 0 && focused()
                ? "block"
                : "none",
          }}
          onMouseDown={handle_folding_points_click}
        ></circle>
      </svg>
      <Show when={!folded.get()}>
        <div class="__children">
          <For each={props.it.get_prop("children")}>
            {(child, i) =>
              ctx.render_node(child, it.rc, {
                onresize: (node_y_offset) =>
                  redraw_helper.handle_children_resize(node_y_offset, i()),
              })
            }
          </For>
        </div>
      </Show>
    </div>
  );
};
