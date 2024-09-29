import { Component, onMount, Show } from "solid-js";
import { canvas_root_id, CanvasState, CanvasStateContext } from "./CanvasState";
import "./CanvasRenderer.scss";
import { MindNodeRendererElement } from "./MindNodeRenderer";

export const CanvasRenderer: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;

  onMount(() => {
    field.style.width = "200%";
    field.style.height = "200%";
    container.scrollLeft = field.clientWidth / 4;
    container.scrollTop = field.clientHeight / 4;
  });

  const root_rc = {
    id: canvas_root_id,
    parent_rc: null as any,
    dom_el: null as any,
    onresize: () => {},
    disposers: [],
  };

  function handle_canvas_click(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const node = target.closest(
      ".mind_node_renderer .__node"
    ) as MindNodeRendererElement;

    if (node) {
      const renderer = target.closest(
        ".mind_node_renderer"
      ) as MindNodeRendererElement;
      const meta = renderer._meta;
      state.focus_node(meta.id, meta.parent_id);
    } else {
      state.focus_node("", "");
    }
  }

  return (
    <CanvasStateContext.Provider value={state}>
      <div
        class="mind_node_canvas"
        ref={(it) => (container = it)}
        onMouseDown={handle_canvas_click}
      >
        <div class="__field" ref={(it) => (field = it)}>
          <Show
            when={state.root.get() !== ""}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {state.render_node(state.root.get(), root_rc, {
              onresize: (child_container) => {
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
