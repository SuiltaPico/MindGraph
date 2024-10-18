import { WrappedSignal } from "@/common/signal";
import { Accessor } from "solid-js";
import { Canvas } from "../../Canvas";
import { MindNodeHelper } from "../../utils/Helper";
import { IChildData } from "./Content";
import { MindNodeRendererElement } from "./Node";

export class RedrawHelper {
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
    if (!this.folded.get() &&
      children_data.length > 1 &&
      (first_child_container = this.it.rc.children_rc.get(
        children_data[0].id
      )?.container_el) &&
      (last_child_container = this.it.rc.children_rc.get(
        children_data[children_data.length - 1].id
      )?.container_el)) {
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
    console.log(`重绘“${this.it.node.content.value}”`);
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
      const child_container = this.it.rc.children_rc.get(
        child_container_data.id
      )?.container_el;
      if (!child_container) continue;

      const ccy = child_container.offsetTop +
        child_container_data.node_y_offset +
        child_container.offsetHeight / 2;

      const x_diff = cx - ccx;
      const y_diff = cy - ccy;

      const children_streamline = this.children_streamline_group.childNodes[i] as SVGLineElement;

      if (y_diff !== 0) {
        const ell_start_x = cx;
        const ell_start_y = cy -
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
    if (this.last_container_height !== this.container.offsetHeight ||
      prev_node_y_offset !== this.node_y_offset) {
      this.it.rc.onresize?.(this.node_y_offset);
      this.last_container_height = this.container.offsetHeight;
    }
  }

  /** 在下一帧绘制子节点流线。 */
  full_redraw_next_tick() {
    // console.log("full_redraw_next_tick", this.it.node.content.value);
    if (this.full_redraw_required === false) {
      this.full_redraw_required = true;
      queueMicrotask(() => {
        this.full_redraw();
      });
    }
  }

  /** 处理子节点容器大小变化。子节点容器大小变化时，父节点需要重新绘制。 */
  handle_children_resize(node_y_offset: number, index: number) {
    console.log(
      `[父节点：${this.ctx.nodes.get(this.it.rc.parent_rc.node_id)?.content.value ??
      this.it.rc.parent_rc.node_id}] 子节点 “${this.ctx.nodes.get(this.it.node.children[index])?.content.value ?? index}” 容器大小变化，需要重绘“${this.it.node.content.value}”`
    );
    const children_container_data = this.children_data_map()[index];
    children_container_data.node_y_offset = node_y_offset;
    this.full_redraw_next_tick();
  }

  constructor(
    public ctx: Canvas,
    public it: MindNodeHelper,
    public children_data_map: Accessor<IChildData[]>,
    public folded: WrappedSignal<boolean>
  ) { }
}
