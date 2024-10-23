import { onMount } from "solid-js/types/server/reactive.js";
import { Inline, InlineTag, MaybeArea, NotArea } from "../MixEditor";
import { Plugin } from "../plugin";
import {
  create_InlineSaveData,
  InlineLoader,
  InlineSavedData,
  load_inline_tags,
} from "../save";

export type TextInlineSavedData = { value: string };

export class TextInline implements Inline<"text", TextInlineSavedData> {
  type = "text" as const;
  save() {
    return create_InlineSaveData(this.type, this.data, this.tags);
  }
  get_child(index: number): MaybeArea {
    return NotArea;
  }
  get_child_position(index: number) {}
  constructor(public data: { value: string }, public tags: InlineTag[]) {}
}

export const Text = () => {
  const loader: InlineLoader<TextInlineSavedData> = async (
    data,
    parser_map
  ) => {
    return new TextInline(
      data.data,
      await load_inline_tags(data.tags, parser_map)
    );
  };
  return {
    loader: {
      inline: {
        text: loader,
      },
    },
    renderer: {
      inline: {
        text: (props: { inline: TextInline }) => {
          onMount(() => {});
          return <span class="__inline __text">{props.inline.data.value}</span>;
        },
      },
    },
  } satisfies Plugin;
};
