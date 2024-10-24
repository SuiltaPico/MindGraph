import { onMount } from "solid-js";
import { Inline, InlineTag, MaybeArea, NotArea } from "../MixEditor";
import { Plugin } from "../plugin";
import {
  create_InlineSaveData,
  InlineLoader,
  InlineSavedData,
  load_inline_tags,
} from "../save";
import { Position } from "@/common/math";
import { get_caret_position } from "@/common/dom";

export type TextInlineSavedData = { value: string };

export class TextInline implements Inline<"text", TextInlineSavedData> {
  type = "text" as const;
  save() {
    return create_InlineSaveData(this.type, this.data, this.tags);
  }
  get_child(index: number): MaybeArea {
    return NotArea;
  }
  get_child_position(index: number): Position | void {}
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
          let container: HTMLElement;
          onMount(() => {
            props.inline.get_child_position = (index) => {
              var range = document.createRange();
              range.setStart(container, index);
              range.setEnd(container, index);
              const rects = range.getClientRects();
              const rect = rects[rects.length - 1];
              return {
                x: rect.left,
                y: rect.top,
              };
            };
          });
          return (
            <span
              class="__inline __text"
              ref={(it) => (container = it)}
              onMouseDown={(e) => {
                e.preventDefault();
                const { offset } = get_caret_position(e);
              }}
            >
              {props.inline.data.value}
            </span>
          );
        },
      },
    },
  } satisfies Plugin;
};
