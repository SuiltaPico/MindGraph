import { canvas_root_id } from "../../Canvas";
import { NodeCanvas } from "../NodeCanvas";


export function handle_tab_key(this: NodeCanvas) {
  const focused_node_data = this.canvas.focused_node_data;
  const new_node = this.canvas.add_new_child(focused_node_data.rc!.node_id);
  this.canvas.focus_node(focused_node_data.rc!.children_rc.get(new_node.id)!);
}
export function handle_window_keydown(this: NodeCanvas, e: KeyboardEvent) {
  const focused_node_data = this.canvas.focused_node_data;
  const handler_map: Record<string, () => void> = {
    Enter: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      if (e.shiftKey || e.metaKey || e.altKey || e.ctrlKey) return;
      e.preventDefault();

      // 添加同级节点
      if (focused_node_data.rc.parent_rc.node_id === canvas_root_id) {
        this.handle_tab_key();
      } else {
        const curr_rc = focused_node_data.rc;
        const new_node = this.canvas.add_next_sibling(curr_rc);
        this.canvas.focus_node(curr_rc.parent_rc.children_rc.get(new_node.id)!);
      }
    },
    Tab: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();
      // 添加下级节点
      this.handle_tab_key();
    },
    Delete: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();
      const parent_rc = focused_node_data.rc.parent_rc;
      const parent_node = this.canvas.nodes.get(parent_rc.node_id)!;
      const node_to_delete_index = parent_node.children.indexOf(
        focused_node_data.rc.node_id
      );
      this.canvas.delete_node(focused_node_data.rc);
      // [处理聚焦]
      // 如果删除的是最后一个子节点，则聚焦到父节点，否则聚焦到下一个同级节点
      // 如果下一个同级节点不存在，则聚焦到上一个同级节点
      if (parent_node.children.length === 0) {
        this.canvas.focus_node(parent_rc);
      } else {
        const node_to_focus_id = parent_node.children[node_to_delete_index - 1] ??
          parent_node.children[node_to_delete_index];
        const next_rc = parent_rc.children_rc.get(node_to_focus_id);
        this.canvas.focus_node(next_rc);
      }
    },
    ArrowUp: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();

      const parent_rc = focused_node_data.rc.parent_rc;
      if (parent_rc.node_id === canvas_root_id) return;

      const parent_node = this.canvas.nodes.get(parent_rc.node_id)!;
      const focused_node_index = parent_node.children.indexOf(
        focused_node_data.rc.node_id
      );
      const prev_node_id = parent_node.children[focused_node_index - 1];
      if (prev_node_id) {
        this.canvas.focus_node(parent_rc.children_rc.get(prev_node_id)!);
      }
    },
    ArrowDown: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();

      const parent_rc = focused_node_data.rc.parent_rc;
      if (parent_rc.node_id === canvas_root_id) return;

      const parent_node = this.canvas.nodes.get(parent_rc.node_id)!;
      const focused_node_index = parent_node.children.indexOf(
        focused_node_data.rc.node_id
      );
      const next_node_id = parent_node.children[focused_node_index + 1];
      if (next_node_id) {
        this.canvas.focus_node(parent_rc.children_rc.get(next_node_id)!);
      }
    },
    ArrowLeft: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();
      const parent_rc = focused_node_data.rc.parent_rc;
      if (parent_rc.node_id !== canvas_root_id) {
        this.canvas.focus_node(parent_rc);
      }
    },
    ArrowRight: () => {
      if (this.canvas.editing_rc || focused_node_data.rc === undefined) return;
      e.preventDefault();
      const rc = focused_node_data.rc;
      const node = this.canvas.nodes.get(rc.node_id)!;
      if (node.children.length > 0) {
        this.canvas.focus_node(rc.children_rc.get(node.children[0])!);
      }
    },
    s: () => {
      if (this.canvas.editing_rc || !e.ctrlKey) return;
      e.preventDefault();
      this.canvas.ac.mg_save();
    },
  };
  handler_map[e.key]?.();
}
