import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { Block, Inline, MixEditor } from "../MixEditor";
import { PluginFactory } from "../plugin";
import { InlinesRenderer } from "../renderer/MixEditorRenderer";
import {
  BlockLoader,
  create_BlockSaveData,
  InlineSavedData,
  load_inlines,
  save_inlines,
} from "../save";
import { AreaContext } from "../AreaContext";

export type ParagraphBlockSavedData = {
  inlines: InlineSavedData[];
};

export class ParagraphBlock<TInline extends Inline<any, any>>
  implements
    Block<
      "paragraph",
      {
        inlines: WrappedSignal<TInline[]>;
      }
    >
{
  type = "paragraph" as const;
  async save() {
    return create_BlockSaveData(this.type, {
      inlines: await save_inlines(this.data.inlines.get()),
    } satisfies ParagraphBlockSavedData);
  }
  get_child(index: number) {
    return this.data.inlines.get()[index];
  }
  get_child_position(index: number): Position | void {}
  constructor(public data: { inlines: WrappedSignal<TInline[]> }) {}
}

export const Paragraph = (() => {
  const loader: BlockLoader<ParagraphBlockSavedData> = async (
    block,
    parser_map
  ) => {
    return new ParagraphBlock({
      inlines: createSignal(await load_inlines(block.data.inlines, parser_map)),
    });
  };

  const renderer = (props: {
    editor: MixEditor<any, any>;
    block: ParagraphBlock<any>;
    context: AreaContext;
  }) => {
    let container: HTMLElement | undefined;
    const editor = props.editor;
    const block = props.block;

    onMount(() => {
      block.get_child_position = (index) => {
        const rect = container?.children[index].getBoundingClientRect();
        if (!rect) return undefined;
        return {
          x: rect.left,
          y: rect.top,
        };
      };
    });

    return (
      <p class="__block __paragraph" ref={(it) => (container = it)}>
        <InlinesRenderer
          editor={editor}
          inlines={block.data.inlines}
          parent={props.context}
        />
      </p>
    );
  };

  return {
    loader: {
      block: {
        paragraph: loader,
      },
    },
    renderer: {
      block: {
        paragraph: renderer,
      },
    },
  };
}) satisfies PluginFactory;
