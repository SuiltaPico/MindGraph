import { MixEditor } from "../MixEditor";
import { Inline } from "../Area";
import { TextInline } from "./text";

export class BoldPlugin implements Inline<"bold", { }> {}

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
