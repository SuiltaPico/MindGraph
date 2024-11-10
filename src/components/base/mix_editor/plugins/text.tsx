import { get_caret_position } from "@/common/dom";
import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { Inline, InlineTag } from "../Area";
import { AreaContext } from "../AreaContext";
import { EventPair } from "../event";
import { CaretMoveEnterEventResult } from "../event/CaretMoveEnter";
import { MaybeArea, MixEditor, NotArea } from "../MixEditor";
import { Plugin } from "../plugin";
import { create_InlineSaveData, InlineLoader, load_inline_tags } from "../save";
import { MixEditorMouseEvent } from "../utils/types";

export type TextInlineSavedData = { value: string };

export class TextInline
  implements Inline<"text", { value: WrappedSignal<string> }>
{
  type = "text" as const;
  data: { value: WrappedSignal<string> };
  async save() {
    return create_InlineSaveData(
      this.type,
      {
        value: this.data.value.get(),
      },
      await Promise.all(this.tags.map((it) => it.save()))
    );
  }
  children_count() {
    return this.data.value.get().length;
  }
  get_child(index: number): MaybeArea {
    return NotArea;
  }
  get_child_position(index: number): Position | void {}

  handle_event<TEventPair extends EventPair>(
    event: TEventPair["event"]
  ): TEventPair["result"] | void {
    if (event.event_type === "caret_move_enter") {
      return CaretMoveEnterEventResult.enter();
    }
  }

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

  const renderer = (props: { inline: TextInline; editor: MixEditor }) => {
    const inline = props.inline;
    const context = props.editor.get_context(inline)!;

    let container: HTMLElement;
    onMount(() => {
      inline.get_child_position = (index) => {
        var range = document.createRange();
        range.setStart(container.firstChild!, index);
        range.setEnd(container.firstChild!, inline.data.value.get().length);
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

          const { offset } = get_caret_position(e);
          if (offset === null) return;

          e.preventDefault();

          props.editor.selection.collapsed_select({
            area: context.area,
            child_path: offset,
          });
          const container_rects = Array.from(container.getClientRects());

          // TODO：需要考虑多行文本的情况，计算当前位于的行，然后取该行的高度
          props.editor.selection.caret_height.set(
            Math.max(...container_rects.map((it) => it.height))
          );
        }}
      >
        {inline.data.value.get()}
      </span>
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
        text: renderer,
      },
    },
  } satisfies Plugin;
};
