import { get_dot_distance } from "@/common/math";
import { Component, onCleanup, onMount, Show } from "solid-js";
import { Canvas, CanvasStateContext } from "../Canvas";
import { DraggingRectHelper, DraggingRectLayer } from "./DraggingRectHelper";
import { NodeCanvas, NodeCanvasContext } from "./NodeCanvas";
import "./NodeCanvas.css";

export const NodeCanvasRenderer: Component<{
  canvas: Canvas;
  node_canvas: NodeCanvas;
}> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { canvas, node_canvas } = props;

  const dragging_rect_helper = new DraggingRectHelper(canvas, node_canvas);
  let initialized = false;

  const handle_window_keydown = (e: KeyboardEvent) =>
    node_canvas.handle_window_keydown(e);
  const handle_window_wheel = (e: WheelEvent) =>
    node_canvas.handle_window_wheel(e, field);

  onMount(() => {
    dragging_rect_helper.init(field);
    window.addEventListener("keydown", handle_window_keydown);
    container.addEventListener("wheel", handle_window_wheel);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handle_window_keydown);
    container.removeEventListener("wheel", handle_window_wheel);
  });

  function handle_canvas_contextmenu(e: MouseEvent) {
    // 如果移动距离大于 2px，则不弹出右键菜单
    if (
      get_dot_distance(
        e.clientX,
        e.clientY,
        node_canvas.right_click_start_x,
        node_canvas.right_click_start_y
      ) > 2
    ) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    canvas.ac.menu.show(node_canvas.right_click_menu_items, {
      el: {
        getBoundingClientRect() {
          return {
            x: node_canvas.right_click_start_x,
            y: node_canvas.right_click_start_y,
            width: 0,
            height: 0,
            top: node_canvas.right_click_start_y,
            left: node_canvas.right_click_start_x,
            right: 0,
            bottom: 0,
          };
        },
      },
      placement: "bottom-start",
      offset: { mainAxis: 4 },
    });
  }

  return (
    <NodeCanvasContext.Provider value={node_canvas}>
      <div
        class="_m_mindgraph_node_canvas"
        ref={(it) => (container = it)}
        onPointerDown={(e) => node_canvas.handle_canvas_pointerdown(e)}
        onPointerMove={(e) => node_canvas.handle_canvas_pointermove(e, container)}
        onPointerUp={(e) => node_canvas.handle_canvas_pointerup(e)}
        onContextMenu={handle_canvas_contextmenu}
      >
        <div class="__field" ref={(it) => (field = it)}>
          <Show
            when={canvas.root.get() !== ""}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {canvas.render_node(canvas.root.get(), node_canvas.root_rc, {
              onresize: () =>
                node_canvas.place_render_root_node(
                  container,
                  field,
                  initialized
                ),
            })}
          </Show>
          <Show when={canvas.dragging_node_data.get()?.type === "dragging"}>
            <div class="__dragging_layer">
              <DraggingRectLayer
                dragging_rects={dragging_rect_helper.dragging_rects}
              />
            </div>
          </Show>
        </div>
      </div>
    </NodeCanvasContext.Provider>
  );
};
