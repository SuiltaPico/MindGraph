import { Component, onCleanup, onMount, Show } from "solid-js";
import {
  canvas_root_id,
  CanvasState,
  CanvasStateContext,
  RenderContext,
} from "./CanvasState";
import "./CanvasRenderer.scss";
import { MindNodeRendererElement } from "./MindNodeRenderer";

export const CanvasRenderer: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;
  let moving = false;
  let focused_node_data = props.state.focused_node_data;

  function handle_tab_key() {
    const new_node = state.add_new_child(focused_node_data.rc!.node_id);
    state.focus_node(focused_node_data.rc!.children_rc.get(new_node.id)!);
  }

  function handle_keydown(e: KeyboardEvent) {
    const handler_map: Record<string, () => void> = {
      Enter: () => {
        if (focused_node_data.rc === undefined) return;
        if (e.shiftKey || e.metaKey || e.altKey || e.ctrlKey) return;
        e.preventDefault();

        // 添加同级节点
        if (focused_node_data.rc.parent_rc.node_id === canvas_root_id) {
          handle_tab_key();
        } else {
          const curr_rc = focused_node_data.rc;
          const new_node = state.add_next_sibling(curr_rc);
          state.focus_node(curr_rc.parent_rc.children_rc.get(new_node.id)!);
        }
      },
      Tab: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;
        // 添加下级节点
        handle_tab_key();
      },
      Delete: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;
        const parent_rc = focused_node_data.rc.parent_rc;
        const parent_node = state.nodes.get(parent_rc.node_id)!;
        const node_to_delete_index = parent_node.children.indexOf(
          focused_node_data.rc.node_id
        );
        state.delete_node(focused_node_data.rc);
        // [处理聚焦]
        // 如果删除的是最后一个子节点，则聚焦到父节点，否则聚焦到下一个同级节点
        // 如果下一个同级节点不存在，则聚焦到上一个同级节点
        if (parent_node.children.length === 0) {
          state.focus_node(parent_rc);
        } else {
          const node_to_focus_id =
            parent_node.children[node_to_delete_index - 1] ??
            parent_node.children[node_to_delete_index];
          const next_rc = parent_rc.children_rc.get(node_to_focus_id);
          state.focus_node(next_rc);
        }
      },
      ArrowUp: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;

        const parent_rc = focused_node_data.rc.parent_rc;
        if (parent_rc.node_id === canvas_root_id) return;

        const parent_node = state.nodes.get(parent_rc.node_id)!;
        const focused_node_index = parent_node.children.indexOf(
          focused_node_data.rc.node_id
        );
        const prev_node_id = parent_node.children[focused_node_index - 1];
        if (prev_node_id) {
          state.focus_node(parent_rc.children_rc.get(prev_node_id)!);
        }
      },
      ArrowDown: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;

        const parent_rc = focused_node_data.rc.parent_rc;
        if (parent_rc.node_id === canvas_root_id) return;

        const parent_node = state.nodes.get(parent_rc.node_id)!;
        const focused_node_index = parent_node.children.indexOf(
          focused_node_data.rc.node_id
        );
        const next_node_id = parent_node.children[focused_node_index + 1];
        if (next_node_id) {
          state.focus_node(parent_rc.children_rc.get(next_node_id)!);
        }
      },
      ArrowLeft: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;
        const parent_rc = focused_node_data.rc.parent_rc;
        if (parent_rc.node_id !== canvas_root_id) {
          state.focus_node(parent_rc);
        }
      },
      ArrowRight: () => {
        e.preventDefault();
        if (focused_node_data.rc === undefined) return;
        const rc = focused_node_data.rc;
        const node = state.nodes.get(rc.node_id)!;
        if (node.children.length > 0) {
          state.focus_node(rc.children_rc.get(node.children[0])!);
        }
      },
      s: () => {
        e.preventDefault();
        if (!e.ctrlKey) return;
        state.ac.mg_save();
      },
    };
    handler_map[e.key]?.();
  }

  onMount(() => {
    field.style.width = "200vw";
    field.style.height = "200vh";
    container.scrollLeft = field.clientWidth / 4;
    container.scrollTop = field.clientHeight / 4;

    window.addEventListener("keydown", handle_keydown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handle_keydown);
  });

  const root_rc: RenderContext = {
    node_id: canvas_root_id,
    parent_rc: null as any,
    children_rc: new Map(),
    dom_el: null as any,
    onresize: () => {},
    disposers: [],
  };

  function handle_canvas_mousedown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const node = target.closest(
      ".mind_node_renderer .__node, .mind_node_renderer .__diversion"
    ) as MindNodeRendererElement;

    if (node) {
      const renderer = target.closest(
        ".mind_node_renderer"
      ) as MindNodeRendererElement;
      const meta = renderer._meta;
      state.focus_node(meta.rc);
    } else {
      state.focus_node(undefined);
    }
  }

  function handle_canvas_mousemove(e: MouseEvent) {
    if (e.buttons & 0b10) {
      moving = true;
      container.scrollBy(-e.movementX, -e.movementY);
    }
  }

  function handle_canvas_contextmenu(e: MouseEvent) {
    if (moving) {
      moving = false;
      e.preventDefault();
      return;
    }
  }

  return (
    <CanvasStateContext.Provider value={state}>
      <div
        class="mind_node_canvas"
        ref={(it) => (container = it)}
        onMouseDown={handle_canvas_mousedown}
        onMouseMove={handle_canvas_mousemove}
        onContextMenu={handle_canvas_contextmenu}
      >
        <div class="__field" ref={(it) => (field = it)}>
          <Show
            when={state.root.get() !== ""}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {state.render_node(state.root.get(), root_rc, {
              onresize: () => {
                const child_container = root_rc.children_rc.get(
                  root_rc.children_rc.keys().next().value
                )!.dom_el;

                child_container.style.left = `${
                  field.clientWidth / 2 - child_container.clientWidth / 2
                }px`;
                child_container.style.top = `${
                  field.clientHeight / 2 - child_container.clientHeight / 1.5
                }px`;
              },
            })}
          </Show>
        </div>
      </div>
    </CanvasStateContext.Provider>
  );
};
