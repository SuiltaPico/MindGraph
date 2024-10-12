import { Component, onCleanup, onMount, Show } from "solid-js";
import { canvas_root_id, CanvasState, CanvasStateContext } from "./CanvasState";
import { RendererContext } from "./RendererContext";
import "./CanvasRenderer.scss";
import { MindNodeRendererElement } from "./MindNodeRenderer";
import { createSignal } from "@/common/signal";

export const CanvasRenderer: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;
  let moving = false;
  let focused_node_data = props.state.focused_node_data;

  const dragging_rects = createSignal<
    {
      x: number;
      y: number;
      width: number;
      height: number;
    }[]
  >([]);

  let initialized = false;

  function update_dragging_rects() {
    const canvas_width = field.offsetWidth;
    const canvas_height = field.offsetHeight;

    const render_root_rc = root_rc.children_rc.get(state.root.get())!;

    // 从根节点开始计算
    // * 对于父节点是首分支的所有首分支，矩形都起始于 y = 0 处
    // * 对于父节点是末分支的所有末分支，矩形都结束于 y = canvas_height 处
    // * 对于根节点，矩形都起始于 x = 0 处
    // * 对于所有的最末端节点，矩形都结束于 x = canvas_width 处
  }

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

  // function handle_wheel(e: WheelEvent) {
  //   if (e.ctrlKey) {
  //     let scale = parseFloat(field.style.scale) || 1;
  //     const zoomFactor = 1.09;
  //     const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
  //     const newScale = scale * delta;

  //     const field_rect = field.getBoundingClientRect();
  //     // 计算 mouse 相对于 field 的位置
  //     const mfdx = e.clientX - field_rect.left;
  //     const mfdy = e.clientY - field_rect.top;

  //     // 计算 field 当前的中心点
  //     const fcx = field_rect.left + field_rect.width / 2
  //     const fcy = field_rect.top + field_rect.height / 2

  //     // 计算 field 缩放后的 x,y 坐标
  //     const scaled_fx = fcx - field_rect.width / 2 * scale

  //     // 计算缩放前后的差值
  //     const scaleChange = newScale - scale;
  //     const moveX = (mfdx * scaleChange) / newScale;
  //     const moveY = (mfdy * scaleChange) / newScale;
  //     console.log(moveX, moveY);

  //     // 应用新的缩放比例，这里仅相对 field 缩放
  //     field.style.zoom = newScale.toString();

  //     // 调整滚动位置以保持鼠标位置不变
  //     // container.scrollLeft = mfdx * delta;
  //     // container.scrollTop += moveY / 8;
  //   }
  // }

  function handle_wheel(e: WheelEvent) {
    if (e.ctrlKey) {
      let scale = parseFloat(field.style.zoom);
      if (Number.isNaN(scale)) {
        console.log(field.style.zoom);
        scale = 1;
      }
      const zoomFactor = 1.09;
      const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
      const newScale = scale * delta;

      // 计算鼠标相对于 field 的位置
      const rect = field.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 计算缩放前后的差值
      const scaleChange = newScale - scale;
      const moveX = (mouseX * scaleChange) / newScale;
      const moveY = (mouseY * scaleChange) / newScale;

      // 应用新的缩放比例
      state.scaling = true;
      field.style.zoom = newScale.toString();

      place_render_root_node()

      // 调整滚动位置以保持鼠标位置不变
      // container.scrollLeft += moveX;
      // container.scrollTop += moveY;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handle_keydown);
    window.addEventListener("wheel", handle_wheel);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handle_keydown);
    window.removeEventListener("wheel", handle_wheel);
  });

  const root_rc = new RendererContext(canvas_root_id, null as any, () => {});

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

  function place_render_root_node() {
    let scale = parseFloat(field.style.zoom);
    if (Number.isNaN(scale)) {
      console.log(field.style.zoom);
      scale = 1;
    }

    const child_container = root_rc.children_rc.get(
      root_rc.children_rc.keys().next()!.value!
    )!.dom_el;

    field.style.width = `calc(200% + ${child_container.clientWidth * scale}px)`;
    field.style.height = `calc(200% + ${child_container.clientHeight * scale}px)`;

    if (!initialized) {
      setTimeout(() => {
        initialized = true;
      }, 100);
      container.scrollLeft =
        field.clientWidth / 4 + child_container.clientWidth * scale / 4;
      container.scrollTop =
        field.clientHeight / 4 + child_container.clientHeight * scale / 4;
    }

    child_container.style.left = `${
      field.offsetWidth / 2 - child_container.clientWidth * scale / 2
    }px`;
    child_container.style.top = `${
      field.offsetHeight / 2 - child_container.clientHeight * scale / 1.5
    }px`;
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
              onresize: place_render_root_node,
            })}
          </Show>
          <Show when={state.dragging_node_data.get() !== undefined}>
            <div class="__dragging_layer">
              {dragging_rects.get().map((rect) => (
                <div
                  class="__rect"
                  style={{ left: `${rect.x}px`, top: `${rect.y}px` }}
                ></div>
              ))}
            </div>
          </Show>
        </div>
      </div>
    </CanvasStateContext.Provider>
  );
};
