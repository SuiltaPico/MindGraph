import { WrappedSignal } from "@/common/signal";
import { For, onCleanup, onMount } from "solid-js";
import { Block, Inline } from "../Area";
import { AreaContext } from "../AreaContext";
import { MixEditor } from "../MixEditor";
import { CaretRenderer } from "./CaretRenderer";
import { MixEditorMouseEvent } from "../utils/types";

export const MixEditorRenderer = <
  TBlock extends Block,
  TInline extends Inline
>(props: {
  editor: MixEditor<TBlock, TInline>;
}) => {
  let container: HTMLDivElement | undefined;
  const editor = props.editor;

  function handle_keydown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      editor.selection.move_left();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      editor.selection.move_right();
    }
  }

  function handle_pointer_down(e: MixEditorMouseEvent) {
    if (!(e.target instanceof Element)) return;
    
    // 点击编辑器外失焦
    if (!container?.contains(e.target)) {
      editor.selection.clear();
      return;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handle_keydown);
    window.addEventListener("pointerdown", handle_pointer_down);
    editor.root_area.get_child_position = (index) => {
      const rect = container?.children[index].getBoundingClientRect();
      if (!rect) return undefined;
      return {
        x: rect.left,
        y: rect.top,
      };
    };
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handle_keydown);
    window.removeEventListener("pointerdown", handle_pointer_down);
  });

  return (
    <div
      class="_m_mix_editor"
      ref={container}
    >
      <BlocksRenderer editor={editor} blocks={editor.blocks} />
      <CaretRenderer editor={editor} />
    </div>
  );
};

export const BlocksRenderer = <
  TBlock extends Block,
  TInline extends Inline
>(props: {
  editor: MixEditor<TBlock, TInline>;
  blocks: WrappedSignal<TBlock[]>;
}) => {
  const editor = props.editor;
  const blocks = props.blocks;
  return (
    <For each={blocks.get()}>
      {(block, index) => {
        return editor.get_block_renderer(block.type)({
          editor: editor as MixEditor<any, any>,
          block,
        });
      }}
    </For>
  );
};

export const InlinesRenderer = <TInline extends Inline<any, any>>(props: {
  editor: MixEditor<any, TInline>;
  inlines: WrappedSignal<TInline[]>;
}) => {
  const editor = props.editor;
  const inlines = props.inlines;
  return (
    <For each={inlines.get()}>
      {(inline, index) => {
        return editor.get_inline_renderer(inline.type)({
          editor,
          inline,
        });
      }}
    </For>
  );
};

export const UnknownBlockRenderer = (props: { block: Block<any, any> }) => {
  return <div>未知的块类型：{props.block.type}</div>;
};

export const UnknownInlineRenderer = (props: { inline: Inline<any, any> }) => {
  return <div>未知的行内类型：{props.inline.type}</div>;
};
