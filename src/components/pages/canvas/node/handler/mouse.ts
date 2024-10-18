import { get_dot_distance } from "@/common/math";
import { batch } from "solid-js";
import { DraggingDraggingNodeData, set_node_prop } from "../../Canvas";
import { NodeCanvas } from "../NodeCanvas";
import { MindNodeRendererElement } from "../renderer/Node";
import { DraggingRectElement } from "../../utils/dragging_rect";

export function handle_canvas_mousedown(this: NodeCanvas, e: MouseEvent) {
  const target = e.target as HTMLElement;
  const node = target.closest(
    "._m_mind_node .__node, ._m_mind_node .__diversion"
  ) as MindNodeRendererElement;

  if (node) {
    const renderer = target.closest("._m_mind_node") as MindNodeRendererElement;
    const meta = renderer._meta;
    this.canvas.focus_node(meta.rc);

    if (e.buttons & 0b1) {
      e.preventDefault();
      this.canvas.dragging_node_data.set({
        type: "pending",
        x: e.clientX,
        y: e.clientY,
        rc: meta.rc,
      });
    }
  } else {
    this.canvas.focus_node(undefined);
  }

  if (e.buttons & 0b10) {
    this.right_click_start_x = e.clientX;
    this.right_click_start_y = e.clientY;
  }
}
export function handle_canvas_mousemove(
  this: NodeCanvas,
  e: MouseEvent,
  container: HTMLElement
) {
  const dragging_node_data = this.canvas.dragging_node_data.get();
  if (
    e.buttons & 0b1 &&
    dragging_node_data?.type === "pending" &&
    get_dot_distance(
      e.clientX,
      e.clientY,
      dragging_node_data.x,
      dragging_node_data.y
    ) > 2
  ) {
    this.canvas.dragging_node_data.set({
      type: "dragging",
      rc: dragging_node_data.rc,
    });
  }

  if (e.buttons & 0b10) {
    container.scrollBy(-e.movementX, -e.movementY);
    this.canvas.ac.menu.hide();
  }
}

function handle_drop_to_dragging_rect(this: NodeCanvas, e: MouseEvent) {
  const canvas = this.canvas;
  const target = e.target as HTMLElement;
  const dragging_node_data =
    canvas.dragging_node_data.get() as DraggingDraggingNodeData;

  const dragging_rc = dragging_node_data.rc;
  const [dragging_node, dragging_nc] = canvas.get_node_context_and_node(
    dragging_rc.node_id
  );

  const dragging_parent_rc = dragging_node_data.rc.parent_rc;
  const [dragging_parent_node, dragging_parent_nc] =
    canvas.get_node_context_and_node(dragging_parent_rc.node_id)!;

  const rect = (target as DraggingRectElement)._rect;
  const target_rc = rect.rc;
  const [target_node, target_nc] = canvas.get_node_context_and_node(
    target_rc.node_id
  )!;

  function remove_dragging_old_relation() {
    // 去除 dragging_rc 当前的父节点记录
    dragging_node.parents.splice(
      dragging_node.parents.indexOf(dragging_parent_rc.node_id),
      1
    );
    canvas.mark_modified(dragging_node.id);

    // 去除 dragging_parent_node 当前的子节点记录
    dragging_parent_node.children.splice(
      dragging_parent_node.children.indexOf(dragging_node_data.rc.node_id),
      1
    );
    canvas.mark_modified(dragging_parent_node.id);

    return () => {
      set_node_prop(
        dragging_node,
        dragging_nc,
        "parents",
        dragging_node.parents
      );
      set_node_prop(
        dragging_parent_node,
        dragging_parent_nc,
        "children",
        dragging_parent_node.children
      );
    };
  }

  function insert_as_child() {
    const update_dragging_relation = remove_dragging_old_relation();

    dragging_rc.dispose();

    // 将 dragging_rc 添加到 target_rc 的子节点中
    canvas.mark_modified(target_node.id);
    // 将 dragging_rc 的父节点记录设置为 target_rc
    dragging_node.parents.push(target_rc.node_id);

    batch(() => {
      update_dragging_relation();
      set_node_prop(target_node, target_nc, "children", [
        dragging_node_data.rc.node_id,
      ]);
    });
  }

  function insert_as_sibling() {
    // 计算鼠标在目标节点中的位置
    const target_rect = target_rc.node_el.getBoundingClientRect();
    const mouse_y = e.clientY;

    const target_parent_rc = target_rc.parent_rc;
    const [target_parent_node, target_parent_nc] =
      canvas.get_node_context_and_node(target_parent_rc.node_id)!;
    const target_index = target_parent_node.children.indexOf(target_rc.node_id);

    if (mouse_y < target_rect.top) {
      // 作为临近节点，插入到目标节点上方
      const update_dragging_relation = remove_dragging_old_relation();
      dragging_rc.dispose();

      target_parent_node.children.splice(
        target_index,
        0,
        dragging_node_data.rc.node_id
      );
      canvas.mark_modified(target_parent_node.id);
      batch(() => {
        update_dragging_relation();
        set_node_prop(
          target_parent_node,
          target_parent_nc,
          "children",
          target_parent_node.children
        );
      });
    } else if (mouse_y > target_rect.bottom) {
      // 作为临近节点，插入到目标节点下方
      const update_dragging_relation = remove_dragging_old_relation();
      dragging_rc.dispose();

      target_parent_node.children.splice(
        target_index + 1,
        0,
        dragging_node_data.rc.node_id
      );
      canvas.mark_modified(target_parent_node.id);
      batch(() => {
        update_dragging_relation();
        set_node_prop(
          target_parent_node,
          target_parent_nc,
          "children",
          target_parent_node.children
        );
      });
    }
  }

  // 如果拖拽到右空白区域，视为作为目标节点的子节点插入
  if (rect.type === "right_span") {
    insert_as_child();
  } else {
    if (rect.rc === this.root_rc) {
      // 如果拖拽到根节点，视为作为根节点的子节点插入
    } else {
      // 如果拖拽到其他节点，视为作为目标节点的临近节点插入
      insert_as_sibling();
    }
  }
}

export function handle_canvas_mouseup(this: NodeCanvas, e: MouseEvent) {
  const canvas = this.canvas;
  const dragging_node_data = canvas.dragging_node_data.get();
  if (dragging_node_data?.type === "dragging") {
    const target = e.target as HTMLElement;
    if (target.classList.contains("__rect")) {
      handle_drop_to_dragging_rect.call(this, e);
    }
  }
  canvas.dragging_node_data.set(undefined);
}
export function handle_window_wheel(
  this: NodeCanvas,
  e: WheelEvent,
  field: HTMLElement
) {
  if (e.ctrlKey) {
    let scale = parseFloat(field.style.scale);
    if (Number.isNaN(scale)) {
      scale = 1;
    }
    const zoomFactor = 1.09;
    const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
    const newScale = scale * delta;

    // 应用新的缩放比例
    this.canvas.scaling = true;
    field.style.scale = newScale.toString();
  }
}
