import { WrappedSignal } from "@/common/signal";
import { For } from "solid-js";
import { Block, Inline, MixEditor } from "../MixEditor";
import { CaretRenderer } from "./CaretRenderer";

export const MixEditorRenderer = <
  TBlock extends Block<any, any>,
  TInline extends Inline<any, any>
>(props: {
  editor: MixEditor<TBlock, TInline>;
}) => {
  const editor = props.editor;
  return (
    <div class="_m_mix_editor">
      <BlocksRenderer editor={editor} blocks={editor.data} />
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
      {(block) =>
        editor.get_block_renderer(block.type)({
          editor: editor as MixEditor<any, any>,
          block,
        })
      }
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
      {(inline) =>
        editor.get_inline_renderer(inline.type)({
          editor,
          inline,
        })
      }
    </For>
  );
};

export const UnknownBlockRenderer = (props: { block: Block<any, any> }) => {
  return <div>未知的块类型：{props.block.type}</div>;
};

export const UnknownInlineRenderer = (props: { inline: Inline<any, any> }) => {
  return <div>未知的行内类型：{props.inline.type}</div>;
};
