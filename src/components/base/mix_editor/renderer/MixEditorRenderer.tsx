import { Component, For } from "solid-js";
import { Block, Inline, MixEditor } from "../MixEditor";
import { WrappedSignal } from "@/common/signal";
import { Plugin } from "../plugin";

export const MixEditorRenderer = <
  TBlock extends Block<any, any>,
  TInline extends Inline<any, any>
>(props: {
  editor: MixEditor<TBlock, TInline>;
}) => {
  const editor = props.editor;
  return (
    <div class="_m_mix_editor">
      <BlocksRenderer
        editor={editor}
        blocks={editor.data}
      />
    </div>
  );
};


export const BlocksRenderer = <
  TBlock extends Block<any, any>,
  TInline extends Inline<any, any>
>(props: {
  editor: MixEditor<TBlock, TInline>;
  blocks: WrappedSignal<TBlock[]>;
}) => {
  const editor = props.editor;
  const blocks = props.blocks;
  return (
    <For each={blocks.get()}>
      {(block) =>
        editor.get_block_renderer(block.type)({ editor, block })
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
        editor.get_inline_renderer(inline.type)({ editor, inline })
      }
    </For>
  );
};
