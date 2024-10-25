import { onMount } from "solid-js";
import { Inline, InlineTag, MaybeArea, MixEditor, NotArea } from "../MixEditor";
import { Plugin } from "../plugin";
import {
  create_InlineSaveData,
  InlineLoader,
  InlineSavedData,
  load_inline_tags,
} from "../save";
import { Position } from "@/common/math";
import { get_caret_position } from "@/common/dom";
import { AreaContext } from "../AreaContext";
import { createSignal, WrappedSignal } from "@/common/signal";
import { MixEditorMouseEvent } from "../utils/types";

export type TextInlineSavedData = { value: string };

export class TextInline
  implements Inline<"text", { value: WrappedSignal<string> }>
{
  type = "text" as const;
  data: { value: WrappedSignal<string> };
  save() {
    return create_InlineSaveData(
      this.type,
      {
        value: this.data.value.get(),
      },
      this.tags
    );
  }
  get_child(index: number): MaybeArea {
    return NotArea;
  }
  get_child_position(index: number): Position | void {}
  constructor(data: { value: string }, public tags: InlineTag[]) {
    this.data = { value: createSignal(data.value) };
  }
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
        text: (props: {
          inline: TextInline;
          context: AreaContext;
          editor: MixEditor;
        }) => {
          const inline = props.inline;
          const context = props.context;

          let container: HTMLElement;
          onMount(() => {
            inline.get_child_position = (index) => {
              var range = document.createRange();
              range.setStart(container.firstChild!, index);
              range.setEnd(
                container.firstChild!,
                inline.data.value.get().length
              );
              const rects = range.getClientRects();
              const rect = rects[0];
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
              onMouseDown={(e: MixEditorMouseEvent) => {
                if (e.mix_selection_changed) return;
                e.mix_selection_changed = true;

                e.preventDefault();
                const { offset } = get_caret_position(e);
                if (offset === null) return;

                props.editor.selection.collapsed_select(
                  context.get_path().concat(offset)
                );
                props.editor.selection.caret_height.set(container.offsetHeight);
              }}
            >
              {inline.data.value.get()}
            </span>
          );
        },
      },
    },
  } satisfies Plugin;
};
