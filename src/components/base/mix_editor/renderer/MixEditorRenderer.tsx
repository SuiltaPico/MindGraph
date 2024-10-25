import { WrappedSignal } from "@/common/signal";
import { For } from "solid-js";
import { Block, Inline, MixEditor } from "../MixEditor";
import { CaretRenderer } from "./CaretRenderer";
import { AreaContext } from "../AreaContext";
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

  return (
    <div class="_m_mix_editor" ref={container} onKeyDown={handle_keydown}>
      <BlocksRenderer
        editor={editor}
        blocks={editor.blocks}
        parent={editor.root_context}
      />
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
  parent: AreaContext;
}) => {
  const editor = props.editor;
  const blocks = props.blocks;
  return (
    <For each={blocks.get()}>
      {(block, index) => {
        const context = new AreaContext(block, props.parent, index());
        return editor.get_block_renderer(block.type)({
          editor: editor as MixEditor<any, any>,
          block,
          context,
        });
      }}
    </For>
  );
};

export const InlinesRenderer = <TInline extends Inline<any, any>>(props: {
  editor: MixEditor<any, TInline>;
  inlines: WrappedSignal<TInline[]>;
  parent: AreaContext;
}) => {
  const editor = props.editor;
  const inlines = props.inlines;
  return (
    <For each={inlines.get()}>
      {(inline, index) => {
        const context = new AreaContext(inline, props.parent, index());
        return editor.get_inline_renderer(inline.type)({
          editor,
          inline,
          context,
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
