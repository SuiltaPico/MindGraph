import { Inline, MixEditor } from "../MixEditor";
import { TextInline } from "./text";

export type BoldInline = Inline<"bold", { value: TextInline }>;

export const Bold = () => ({
  inline_renderer: {
    bold: (props: { editor: MixEditor<any, any>; inline: BoldInline }) => {
      const { editor, inline } = props;
      return (
        <b class="__inline __bold">
          {editor.get_inline_renderer(inline.type)({
            editor,
            inline: inline.data.value,
          })}
        </b>
      );
    },
  },
});
