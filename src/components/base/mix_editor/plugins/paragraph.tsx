import { WrappedSignal } from "@/common/signal";
import { Block, Inline, MixEditor } from "../MixEditor";
import { InlinesRenderer } from "../renderer/MixEditorRenderer";

export type ParagraphBlock<TInline extends Inline<any, any>> = Block<
  "paragraph",
  {
    inlines: WrappedSignal<TInline[]>;
  }
>;

export const Paragraph = () => ({
  block_renderer: {
    paragraph: <TInline extends Inline<any, any>>(props: {
      editor: MixEditor<any, TInline>;
      block: ParagraphBlock<TInline>;
    }) => {
      const editor = props.editor;
      const block = props.block;

      return (
        <p class="__block __paragraph">
          <InlinesRenderer
            editor={editor}
            inlines={block.data.inlines}
          />
        </p>
      );
    },
  },
});
