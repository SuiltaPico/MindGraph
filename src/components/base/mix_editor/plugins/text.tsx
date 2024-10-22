import { Inline } from "../MixEditor";

export type TextInline = Inline<
  "text",
  {
    value: string;
  }
>;

export const Text = () => ({
  inline_renderer: {
    text: (props: { inline: TextInline }) => {
      return <span class="__inline __text">{props.inline.data.value}</span>;
    },
  },
});
