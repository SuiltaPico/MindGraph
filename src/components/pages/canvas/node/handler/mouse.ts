import { get_dot_distance } from "@/common/math";
import { batch } from "solid-js";
import { DraggingDraggingNodeData, set_node_prop } from "../../Canvas";
import { NodeCanvas } from "../NodeCanvas";
import { MindNodeRendererElement } from "../renderer/Node";
import { DraggingRectElement } from "../../utils/dragging_rect";
import { RendererContext } from "../../utils/RendererContext";
import { IMindNode } from "@/domain/MindNode";

export function handle_canvas_mousedown(this: NodeCanvas, e: MouseEvent) {
  const canvas = this.canvas;
  const root_rc = this.root_rc;
  const target = e.target as HTMLElement;
  const node = target.closest(
    "._m_mind_node .__node, ._m_mind_node .__diversion"
  ) as MindNodeRendererElement;

  function prepare_dragging_node_data(rc: RendererContext) {
    e.preventDefault();
    if (rc.parent_rc === root_rc) {
      // 阻止渲染根节点被拖拽
      return;
    }
    // 设置拖拽节点数据
    canvas.dragging_node_data.set({
      type: "pending",
      x: e.clientX,
      y: e.clientY,
      rc: rc,
    });
  }

  if (node) {
    const renderer = target.closest("._m_mind_node") as MindNodeRendererElement;
    const meta = renderer._meta;
    const rc = meta.rc;
    canvas.focus_node(rc);

    if (e.buttons & 0b1) {
      prepare_dragging_node_data(rc);
    }
  } else {
    canvas.focus_node(undefined);
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

async function handle_drop_to_dragging_rect(this: NodeCanvas, e: MouseEvent) {
  const root_rc = this.root_rc;
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

  // 禁止拖拽节点和目标节点相同
  if (dragging_parent_rc.node_id === target_rc.node_id) {
    return;
  }

  // const nodes =
  //   await canvas.ac.api.app.mg.node.load_related({
  //     id: target_rc.node_id,
  //     type: "parents",
  //   });

  // // 禁止目标节点拖拽节点是的后代节点。最新的关系在 nodes 中，因此需要加载
  // if (target_is_desc_of_src) {
  //   return;
  // }

  /** 删除拖拽节点和其父节点的关系。 */
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
  }

  function update_dragging_old_relation() {
    set_node_prop(dragging_node, dragging_nc, "parents", dragging_node.parents);
    set_node_prop(
      dragging_parent_node,
      dragging_parent_nc,
      "children",
      dragging_parent_node.children
    );
  }

  function insert_as_child() {
    remove_dragging_old_relation();
    dragging_rc.dispose();

    // 将 dragging_rc 添加到 target_rc 的子节点中
    target_node.children.push(dragging_node_data.rc.node_id);
    canvas.mark_modified(target_node.id);
    // 将 dragging_rc 的父节点记录设置为 target_rc
    dragging_node.parents.push(target_rc.node_id);

    batch(() => {
      update_dragging_old_relation();
      set_node_prop(target_node, target_nc, "children", target_node.children);
    });
  }

  function insert_dragging_to_target_parent_children(
    target_parent_node: IMindNode,
    target_index: number,
    before: boolean
  ) {
    target_parent_node.children.splice(
      target_index + (before ? 0 : 1),
      0,
      dragging_node_data.rc.node_id
    );
  }

  function insert(
    target_parent_rc: RendererContext,
    target_index: number,
    before: boolean
  ) {
    const [target_parent_node, target_parent_nc] =
      canvas.get_node_context_and_node(target_parent_rc.node_id)!;

    // 作为临近节点，插入到目标节点下方
    // 如果拖拽的节点和目标节点在同一个父节点下，则不销毁拖拽的节点，只是更新目标节点的临近节点。
    if (dragging_parent_rc === target_parent_rc) {
      // 仅更新 target_parent_rc 的 children 属性
      console.log(
        `[拖拽] “${dragging_node.content.value}”拖拽到目标节点“${
          target_node.content.value
        }”${before ? "上" : "下"}方，其父节点共同为“${
          target_parent_node.content.value
        }”。`
      );

      // 删除原有位置的拖拽节点
      const dragging_index = target_parent_node.children.indexOf(
        dragging_node_data.rc.node_id
      );
      target_parent_node.children.splice(dragging_index, 1);
      // 插入到目标节点下方
      insert_dragging_to_target_parent_children(
        target_parent_node,
        target_index,
        before
      );
      canvas.mark_modified(target_parent_node.id);

      set_node_prop(
        target_parent_node,
        target_parent_nc,
        "children",
        target_parent_node.children
      );
    } else {
      console.log(
        `[拖拽] “${dragging_node.content.value}”拖拽到目标节点“${
          target_node.content.value
        }”${before ? "上" : "下"}方。`
      );
      remove_dragging_old_relation();
      dragging_rc.dispose();
      insert_dragging_to_target_parent_children(
        target_parent_node,
        target_index,
        before
      );
      canvas.mark_modified(target_parent_node.id);
      batch(() => {
        update_dragging_old_relation();
        set_node_prop(
          target_parent_node,
          target_parent_nc,
          "children",
          target_parent_node.children
        );
      });
    }
  }

  function insert_as_sibling() {
    // 计算鼠标在目标节点中的位置
    const target_rect = target_rc.node_el.getBoundingClientRect();
    const mouse_x = e.clientX;
    const mouse_y = e.clientY;

    const target_parent_rc = target_rc.parent_rc;
    const [target_parent_node] = canvas.get_node_context_and_node(
      target_parent_rc.node_id
    )!;
    const target_index = target_parent_node.children.indexOf(target_rc.node_id);

    const middle_y = target_rect.top + target_rect.height / 2;

    if (mouse_x < target_rect.left) {
      if (mouse_y < middle_y) {
        insert(target_parent_rc, target_index, true);
      } else {
        insert(target_parent_rc, target_index, false);
      }
    } else {
      // 如果 mouse_x 在目标节点内，则根据 mouse_y 的位置决定插入到目标节点之上、之下或者作为子节点插入
      if (mouse_y < target_rect.top) {
        insert(target_parent_rc, target_index, true);
      } else if (mouse_y > target_rect.bottom) {
        insert(target_parent_rc, target_index, false);
      } else {
        insert_as_child();
      }
    }
  }

  function insert_to_root() {
    const mouse_y = e.clientY;

    let at_top_of_index = -1;

    // 查找 mouse_y 在哪个子节点之下
    for (let i = 0; i < target_node.children.length; i++) {
      const child_id = target_node.children[i];
      const child_rc = target_rc.children_rc.get(child_id)!;
      const child_rect = child_rc.node_el.getBoundingClientRect();
      if (mouse_y < child_rect.top) {
        at_top_of_index = i;
        break;
      }
    }

    if (at_top_of_index === -1) {
      // 如果 mouse_y 在所有子节点之下，则插入到最后一个子节点之下
      insert(rect.rc, target_node.children.length - 1, false);
    } else {
      // 如果 mouse_y 在某个子节点之上，则插入到该子节点之上
      insert(rect.rc, at_top_of_index, true);
    }
  }

  // 如果拖拽到右空白区域，视为作为目标节点的子节点插入
  if (rect.type === "right_span") {
    console.log(
      `[拖拽] “${dragging_node.content.value}”拖拽到右空白区域，视为作为目标节点“${target_node.content.value}”的子节点插入`
    );
    insert_as_child();
  } else {
    if (rect.rc.parent_rc === root_rc) {
      // 如果拖拽到渲染根节点，视为作为根节点的子节点插入
      console.log(
        `[拖拽] “${dragging_node.content.value}”拖拽到根节点，视为作为根节点的子节点插入。`
      );
      insert_to_root();
    } else {
      // 如果拖拽到其他节点，视为作为目标节点的临近节点插入
      insert_as_sibling();
    }
  }
}

export async function handle_canvas_mouseup(this: NodeCanvas, e: MouseEvent) {
  const canvas = this.canvas;
  const dragging_node_data = canvas.dragging_node_data.get();
  if (dragging_node_data?.type === "dragging") {
    const target = e.target as HTMLElement;
    if (target.classList.contains("__rect")) {
      await handle_drop_to_dragging_rect.call(this, e);
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
