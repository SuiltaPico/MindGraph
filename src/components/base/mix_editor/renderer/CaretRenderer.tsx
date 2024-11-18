import {
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { MixEditor } from "../MixEditor";
import "./CaretRenderer.css";
import {
  MixEditorRendererState,
  MixEditorRendererStateContext,
} from "./MixEditorRenderer";
import { input_to_selection } from "../event/Input";

export type CaretRendererType = (props: { editor: MixEditor<any, any> }) => any;

export const CaretRenderer: CaretRendererType = (props) => {
  let container: HTMLElement;
  let input: HTMLDivElement;
  let start_caret: HTMLElement;
  let end_caret: HTMLElement;
  const editor = props.editor;
  const selection = editor.selection;
  const selected_type = createMemo(() => selection.get()?.type);

  const renderer_state = useContext(MixEditorRendererStateContext);

  onMount(() => {
    createEffect(
      on(selection.selected.get, (selected) => {
        console.log("[光标渲染器] 选区变化。", selected);

        // setTimeout(() => {
        // input?.blur();
        input?.focus({
          preventScroll: true,
        });
        // });

        if (!selected) {
          console.log("[光标渲染器] 没有选区，光标不显示。");
          return;
        }
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

  async function handle_inputer_composition_end(e: CompositionEvent) {
    console.log("handle_inputer_composition_end", e);
    if (!e.data) return;
    await input_to_selection(selection, {
      text: e.data,
      dataTransfer: undefined,
    });
    e.preventDefault();
  }

  async function handle_inputer_input(e: InputEvent) {
    console.log("handle_inputer_input", e);
    if (!e.data || e.isComposing) return;
    await input_to_selection(selection, {
      text: e.data,
      dataTransfer: e.dataTransfer ?? undefined,
    });
    e.preventDefault();
  }

  return (
    <div
      class="__caret_layer"
      ref={(it) => (container = it)}
      style={{
        opacity: editor.mode.get() === "edit" ? "1" : "0",
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
          <div
            class="__inputer"
            contentEditable
            ref={(it) => (console.log("new inputer", it), (input = it))}
            onCompositionEnd={handle_inputer_composition_end}
            onBeforeInput={handle_inputer_input}
            onPointerDown={(e) => {
              e.preventDefault();
            }}
          />
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
