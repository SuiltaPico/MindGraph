import { clear_dom_selection, get_caret_position_for_text } from "@/common/dom";
import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { Inline, InlineTag } from "../Area";
import { EventPair } from "../event";
import { CaretMoveEnterEventResult } from "../event/CaretMoveEnter";
import { MaybeArea, MixEditor } from "../MixEditor";
import { Plugin } from "../plugin";
import { create_InlineSaveData, InlineLoader } from "../save";
import { ToEnd } from "../selection";
import { MixEditorMouseEvent } from "../utils/area";
import { InputEventResult } from "../event/Input";
import { DeleteEventResult } from "../event/Delete";

export type TextInlineSavedData = { value: string };

export class TextInline
  implements
    Inline<
      "text",
      { value: WrappedSignal<string>; tags: WrappedSignal<InlineTag[]> }
    >
{
  type = "text" as const;
  data: { value: WrappedSignal<string>; tags: WrappedSignal<InlineTag[]> };
  async save() {
    return create_InlineSaveData(
      this.type,
      {
        value: this.data.value.get(),
      },
      await Promise.all(this.data.tags.get().map((it) => it.save()))
    );
  }
  children_count() {
    return this.data.value.get().length;
  }
  get_child(index: number): MaybeArea {
    return undefined;
  }
  get_child_position(index: number): Position | void {}

  handle_event<TEventPair extends EventPair>(
    event: TEventPair["event"]
  ): TEventPair["result"] | void {
    if (event.event_type === "caret_move_enter") {
      const to = event.to;
      const to_left = event.direction === "left";

      if ((to_left && to >= this.children_count()) || (!to_left && to <= 0)) {
        // 顺方向前边界进入
        return CaretMoveEnterEventResult.enter(
          to_left ? this.children_count() - 1 : 1
        );
      } else if (
        (to_left && to <= 0) ||
        (!to_left && to >= this.children_count())
      ) {
        // 顺方向后边界跳过
        return CaretMoveEnterEventResult.skip;
      } else {
        return CaretMoveEnterEventResult.enter(to);
      }
    } else if (event.event_type === "input") {
      const curr_value = this.data.value.get();
      this.data.value.set(
        curr_value.slice(0, event.to) + event.value + curr_value.slice(event.to)
      );
      return InputEventResult.done(event.to + event.value.length);
    } else if (event.event_type === "delete") {
      const curr_value = this.data.value.get();
      let to = event.to;
      if (to === ToEnd) {
        to = curr_value.length;
      }
      if (event.type === "backward") {
        const new_value = curr_value.slice(0, to - 1) + curr_value.slice(to);

        if (new_value.length === 0) {
          return DeleteEventResult.self_delete_required;
        }
        this.data.value.set(new_value);
        return DeleteEventResult.done(to - 1);
      } else if (event.type === "forward") {
        const new_value = curr_value.slice(0, to) + curr_value.slice(to + 1);

        if (new_value.length === 0) {
          return DeleteEventResult.self_delete_required;
        }
        this.data.value.set(new_value);
        return DeleteEventResult.done(to);
      } else if (event.type === "specified") {
        const new_value =
          curr_value.slice(0, event.from) + curr_value.slice(to);

        if (new_value.length === 0) {
          return DeleteEventResult.self_delete_required;
        }
        this.data.value.set(new_value);
        return DeleteEventResult.done(to);
      }
    }
  }

  constructor(data: { value: string }, private editor: MixEditor) {
    this.data = {
      value: createSignal(data.value),
      tags: createSignal<InlineTag[]>([]),
    };
  }
}

export const Text = () => {
  const loader: InlineLoader<TextInlineSavedData> = async (data, editor) => {
    const result = new TextInline(data.data, editor);
    const inline_tags = await editor.saver.load_areas(
      "inline_tag",
      data.tags,
      result
    );
    result.data.tags.set(inline_tags);
    return result;
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

    function handle_pointer_down(e: MixEditorMouseEvent) {
      if (e.mix_selection_changed) return;

      const { offset } = get_caret_position_for_text(e);
      if (offset === null || offset === 0 || offset >= inline.children_count())
        return;

      e.mix_selection_changed = true;
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
    }

    return (
      <span
        class="__inline __text"
        ref={(it) => (container = it)}
        onPointerDown={handle_pointer_down}
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
8;
