import {
  batch,
  Component,
  createEffect,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import {
  canvas_root_id,
  CanvasState,
  CanvasStateContext,
  set_node_prop,
} from "./CanvasState";
import { RendererContext } from "./utils/RendererContext";
import "./CanvasRenderer.css";
import { MindNodeRendererElement } from "./mind_node/Renderer";
import { createSignal } from "@/common/signal";
import { MenuElement } from "@/components/base/menu/Menu";
import { get_dot_distance } from "@/common/math";
import { DraggingRect, calc_dragging_rects } from "./utils/dragging_rect";

const offset_x = 32;
const offset_y = 8;

interface DraggingRectElement extends HTMLElement {
  _rect: DraggingRect;
}

export const CanvasRenderer: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;

  let right_click_start_x = 0;
  let right_click_start_y = 0;

  let focused_node_data = props.state.focused_node_data;

  const dragging_rects = createSignal<DraggingRect[]>([]);

  let initialized = false;

  createEffect(
    on(state.dragging_node_data.get, (dragging_node_data) => {
      if (dragging_node_data?.type === "dragging") {
        dragging_rects.set(
          calc_dragging_rects(state, field, root_rc, offset_x, offset_y)
        );
      }
    })
  );

  function handle_tab_key() {
    const new_node = state.add_new_child(focused_node_data.rc!.node_id);
    state.focus_node(focused_node_data.rc!.children_rc.get(new_node.id)!);
  }

  function handle_window_keydown(e: KeyboardEvent) {
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

  function handle_window_wheel(e: WheelEvent) {
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

      place_render_root_node();

      // 调整滚动位置以保持鼠标位置不变
      // container.scrollLeft += moveX;
      // container.scrollTop += moveY;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handle_window_keydown);
    container.addEventListener("wheel", handle_window_wheel);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handle_window_keydown);
    container.removeEventListener("wheel", handle_window_wheel);
  });

  const root_rc = new RendererContext(canvas_root_id, null as any, () => {});

  function handle_canvas_mousedown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const node = target.closest(
      "._m_mind_node .__node, ._m_mind_node .__diversion"
    ) as MindNodeRendererElement;

    if (node) {
      const renderer = target.closest(
        "._m_mind_node"
      ) as MindNodeRendererElement;
      const meta = renderer._meta;
      state.focus_node(meta.rc);

      if (e.buttons & 0b1) {
        e.preventDefault();
        state.dragging_node_data.set({
          type: "pending",
          x: e.clientX,
          y: e.clientY,
          rc: meta.rc,
        });
      }
    } else {
      state.focus_node(undefined);
    }

    if (e.buttons & 0b10) {
      right_click_start_x = e.clientX;
      right_click_start_y = e.clientY;
    }
  }

  function handle_canvas_mousemove(e: MouseEvent) {
    const dragging_node_data = state.dragging_node_data.get();
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
      state.dragging_node_data.set({
        type: "dragging",
        rc: dragging_node_data.rc,
      });
    }

    if (e.buttons & 0b10) {
      container.scrollBy(-e.movementX, -e.movementY);
      state.ac.menu.hide();
    }
  }

  function handle_canvas_mouseup(e: MouseEvent) {
    const dragging_node_data = state.dragging_node_data.get();
    if (dragging_node_data?.type === "dragging") {
      const dragging_rc = dragging_node_data.rc;
      const dragging_node = state.nodes.get(dragging_rc.node_id)!;
      const dragging_nc = state.get_node_context(dragging_rc.node_id)!;

      const dragging_parent_rc = dragging_node_data.rc.parent_rc;
      const dragging_parent_node = state.nodes.get(dragging_parent_rc.node_id)!;
      const dragging_parent_nc = state.get_node_context(
        dragging_parent_rc.node_id
      )!;

      const target = e.target as HTMLElement;
      if (target.classList.contains("__rect")) {
        const target_rc = (target as DraggingRectElement)._rect.rc;
        const target_nc = state.get_node_context(target_rc.node_id)!;
        const target_node = state.nodes.get(target_rc.node_id)!;

        console.log(
          `销毁父节点为 “${dragging_parent_node.content.value}” 的节点 “${dragging_node.content.value}”`
        );
        dragging_rc.dispose();

        // 去除 dragging_rc 当前的父节点记录
        dragging_node.parents.splice(
          dragging_node.parents.indexOf(dragging_parent_rc.node_id),
          1
        );

        // 将 dragging_rc 的父节点记录设置为 target_rc
        dragging_node.parents.push(target_rc.node_id);
        state.mark_modified(dragging_node.id);

        // 去除 dragging_parent_node 当前的子节点记录
        dragging_parent_node.children.splice(
          dragging_parent_node.children.indexOf(dragging_node_data.rc.node_id),
          1
        );
        state.mark_modified(dragging_parent_node.id);

        // 将 dragging_rc 添加到 target_rc 的子节点中
        state.mark_modified(target_node.id);

        batch(() => {
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
          set_node_prop(target_node, target_nc, "children", [
            dragging_node_data.rc.node_id,
          ]);
        });
      }
    }
    state.dragging_node_data.set(undefined);
  }

  function handle_canvas_contextmenu(e: MouseEvent) {
    // 如果移动距离大于 4px，则不弹出右键菜单
    if (
      get_dot_distance(
        e.clientX,
        e.clientY,
        right_click_start_x,
        right_click_start_y
      ) > 2
    ) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    state.ac.menu.show(right_click_menu_items, {
      el: {
        getBoundingClientRect() {
          return {
            x: e.clientX,
            y: e.clientY,
            width: 0,
            height: 0,
            top: e.clientY,
            left: e.clientX,
            right: 0,
            bottom: 0,
          };
        },
      },
      placement: "bottom-start",
      offset: { mainAxis: 4 },
    });
  }

  function place_render_root_node() {
    let scale = parseFloat(field.style.zoom);
    if (Number.isNaN(scale)) {
      scale = 1;
    }

    const child_container = root_rc.children_rc.get(
      root_rc.children_rc.keys().next()!.value!
    )!.dom_el;

    field.style.width = `calc(200% + ${child_container.clientWidth * scale}px)`;
    field.style.height = `calc(200% + ${
      child_container.clientHeight * scale
    }px)`;

    if (!initialized) {
      setTimeout(() => {
        initialized = true;
      }, 100);
      container.scrollLeft =
        field.clientWidth / 4 + (child_container.clientWidth * scale) / 4;
      container.scrollTop =
        field.clientHeight / 4 + (child_container.clientHeight * scale) / 4;
    }

    child_container.style.left = `${
      field.offsetWidth / 2 - (child_container.clientWidth * scale) / 2
    }px`;
    child_container.style.top = `${
      field.offsetHeight / 2 - (child_container.clientHeight * scale) / 1.5
    }px`;
  }

  const right_click_menu_items: MenuElement[] = [
    {
      name: "复制",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "粘贴",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      type: "divider",
    },
    {
      name: "折叠此节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "展开此节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "以当前节点为根节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "插入分支",
      onclick: () => {
        alert("还没做");
      },
    },
  ];

  return (
    <CanvasStateContext.Provider value={state}>
      <div
        class="_m_mind_node_canvas"
        ref={(it) => (container = it)}
        onMouseDown={handle_canvas_mousedown}
        onMouseMove={handle_canvas_mousemove}
        onMouseUp={handle_canvas_mouseup}
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
          <Show when={state.dragging_node_data.get()?.type === "dragging"}>
            <div class="__dragging_layer">
              <For each={dragging_rects.get()}>
                {(rect) => {
                  const result = (
                    <div
                      class="__rect"
                      style={{
                        left: `${rect.x}px`,
                        top: `${rect.y}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                      }}
                    ></div>
                  ) as DraggingRectElement;
                  result._rect = rect;
                  return result;
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </CanvasStateContext.Provider>
  );
};
