import { createEffect, createMemo, on, onMount, Show } from "solid-js";
import { CaretRendererType } from "../selection";
import "./CaretRenderer.css";

export const CaretRenderer: CaretRendererType = (props) => {
  let container: HTMLElement;
  let input: HTMLInputElement;
  let start_caret: HTMLElement;
  let end_caret: HTMLElement;
  const editor = props.editor;
  const selection = editor.selection;
  const selected_type = createMemo(() => selection.get()?.type);

  onMount(() => {
    createEffect(
      on(selection.selected.get, (selected) => {
        input?.focus({
          preventScroll: true,
        });

        if (!selected) {
          console.log("[光标渲染器] 没有选区，光标不显示。");
          return
        };
        if (selected.type === "collapsed") {
          const container_rect = container?.getBoundingClientRect();
          const position = selected.start.area.get_child_position(
            selected.start.child_path
          )!;
          if (!position) {
            console.log("[光标渲染器] 获取光标位置失败，光标不显示。");
            return;
          }
          start_caret.style.left = `${position.x - container_rect!.left}px`;
          start_caret.style.top = `${position.y - container_rect!.top}px`;

          // 重置动画
          start_caret.style.animation = "none";
          start_caret.style.opacity = "1";
          requestAnimationFrame(() => {
            start_caret.style.animation = "";
            start_caret.style.opacity = "";
          });
        }
      })
    );
  });

  return (
    <div
      class="__caret_layer"
      ref={(it) => (container = it)}
      style={{
        visibility: editor.mode.get() === "edit" ? "visible" : "hidden",
      }}
    >
      <Show
        when={selected_type() === "collapsed" || selected_type() === "extended"}
      >
        <div
          class="__start_caret"
          ref={(it) => (start_caret = it)}
          style={{
            height: `${selection.caret_height.get()}px`,
          }}
        >
          <input ref={(it) => (input = it)} />
        </div>
      </Show>
      <Show when={selected_type() === "extended"}>
        <div
          class="__end_caret"
          ref={(it) => (end_caret = it)}
          style={{
            height: `${selection.caret_height.get()}px`,
          }}
        ></div>
      </Show>
    </div>
  );
};
