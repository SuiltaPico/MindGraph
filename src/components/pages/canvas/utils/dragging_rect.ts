import { Canvas } from "../Canvas";
import { RendererContext } from "./RendererContext";

export interface DraggingRectElement extends HTMLElement {
  _rect: DraggingRect;
}

export type DraggingRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rc: RendererContext;
} & {
  type?: "right_span";
};

/** 精确更新拖拽矩形。 */
export function calc_dragging_rects(
  state: Canvas,
  field: HTMLElement,
  root_rc: RendererContext,
  offset_x: number,
  offset_y: number
) {
  const field_rect = field.getBoundingClientRect();

  const rects: DraggingRect[] = [];

  const render_root_rc = root_rc.children_rc.get(state.root.get())!;

  // 从根节点开始计算
  // * 对于父节点是首分支的所有首分支，矩形都起始于 y = 0 处
  // * 对于父节点是末分支的所有末分支，矩形都结束于 y = canvas_height 处
  // * 对于所有的最末端节点，矩形都结束于 x = canvas_width 处

  function calc_rect(
    rc: RendererContext,
    still_first_branch: boolean,
    still_last_branch: boolean
  ) {
    const rc_container_rect = rc.container_el.getBoundingClientRect();
    const rc_node_rect =
      rc.container_el.querySelector(":scope > .__node")?.getBoundingClientRect() ??
      rc_container_rect;

    let x = rc_container_rect.left - field_rect.left - offset_x;
    let y = rc_container_rect.top - field_rect.top;
    let width = rc_node_rect.width + offset_x;
    let height = rc_container_rect.height + offset_y;

    if (still_first_branch && still_last_branch) {
      y = 0;
      height = field_rect.height;
    } else if (still_first_branch) {
      y = 0;
      height =
        rc_container_rect.top +
        rc_container_rect.height -
        field_rect.top +
        offset_y;
    } else if (still_last_branch) {
      height = field_rect.bottom - rc_container_rect.top;
    }

    const node = state.nodes.get(rc.node_id)!;
    if (node.children.length > 0) {
      for (let index = 0; index < node.children.length; index++) {
        const child_id = node.children[index];
        const child_rc = rc.children_rc.get(child_id);
        if (child_rc) {
          calc_rect(
            child_rc,
            still_first_branch && index === 0,
            still_last_branch && index === node.children.length - 1
          );
        }
      }
    } else {
      rects.push({
        type: "right_span",
        x: rc_container_rect.right - field_rect.left - offset_x,
        y: y,
        width:
          field_rect.width -
          (rc_container_rect.right - field_rect.left) +
          offset_x,
        height: height,
        rc,
      });
    }

    rects.push({
      x,
      y,
      width,
      height,
      rc,
    });
  }

  // 添加根节点左侧的矩形
  // rects.push({
  //   x: 0,
  //   y: 0,
  //   width: render_root_rect.left - field_rect.left - offset_x,
  //   height: field_rect.height,
  // });
  calc_rect(render_root_rc, true, true);

  return rects;
}
