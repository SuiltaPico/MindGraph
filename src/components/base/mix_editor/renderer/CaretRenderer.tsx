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
      on(selection.caret_height.get, (height) => {
        if (start_caret) {
          start_caret.style.height = `${height}px`;
        }
        if (end_caret) {
          end_caret.style.height = `${height}px`;
        }
      })
    );
    createEffect(
      on(selection.selected.get, (selected) => {
        input?.focus();

        if (!selected) return;
        if (selected.type === "collapsed") {
          const container_rect = container?.getBoundingClientRect();
          const position = editor.get_position_of_path(selected.start_path);
          if (!position) return;
          start_caret.style.left = `${position?.x - container_rect!.left}px`;
          start_caret.style.top = `${position?.y - container_rect!.top}px`;

          // 重置动画
          start_caret.style.animation = "none";
          start_caret.style.opacity = "1";
          setTimeout(() => {
            start_caret.style.animation = "";
            start_caret.style.opacity = "";
          });
        }
      })
    );
  });

  return (
    <div class="__caret_layer" ref={(it) => (container = it)}>
      <Show
        when={selected_type() === "collapsed" || selected_type() === "extended"}
      >
        <div class="__start_caret" ref={(it) => (start_caret = it)}>
          <input ref={(it) => (input = it)} />
        </div>
      </Show>
      <Show when={selected_type() === "extended"}>
        <div class="__end_caret" ref={(it) => (end_caret = it)}></div>
      </Show>
    </div>
  );
};
