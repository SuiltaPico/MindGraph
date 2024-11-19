import { get_caret_position_for_text } from "@/common/dom";
import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { Inline, InlineTag } from "../Area";
import { EventPair } from "../event";
import {
  CaretMoveEnterEvent,
  CaretMoveEnterEventCommand,
} from "../event/CaretMoveEnter";
import { DeleteEvent, DeleteEventCommand } from "../event/Delete";
import { InputEvent, InputEventCommand } from "../event/Input";
import { MaybeArea, MixEditor } from "../MixEditor";
import { Plugin } from "../plugin";
import { create_InlineSaveData, InlineLoader } from "../save";
import { ToEnd } from "../selection";
import { MixEditorMouseEvent } from "../utils/area";

export type TextInlineSavedData = { value: string };

export function handle_caret_move_enter(
  this: TextInline,
  event: CaretMoveEnterEvent
) {
  let to = event.to;
  if (to === ToEnd) {
    to = this.children_count();
  }
  const to_left = event.direction === "backward";

  if ((to_left && to >= this.children_count()) || (!to_left && to <= 0)) {
    // 顺方向前边界进入
    return CaretMoveEnterEventCommand.enter(
      to_left ? this.children_count() - 1 : 1
    );
  } else if (
    (to_left && to <= 0) ||
    (!to_left && to >= this.children_count())
  ) {
    // 顺方向后边界跳过
    return CaretMoveEnterEventCommand.skip;
  } else {
    return CaretMoveEnterEventCommand.enter(to);
  }
}

export function handle_delete(this: TextInline, event: DeleteEvent) {
  let to = event.to;
  if (to === ToEnd) {
    to = this.children_count();
  }

  const curr_value = this.data.value.get();

  if (event.type === "backward") {
    if (to <= 0) {
      return DeleteEventCommand.skip;
    }
    const new_value = curr_value.slice(0, to - 1) + curr_value.slice(to);

    if (new_value.length === 0) {
      return DeleteEventCommand.self_delete_required;
    }
    this.data.value.set(new_value);
    return DeleteEventCommand.done(CaretMoveEnterEventCommand.enter(to - 1));
  } else if (event.type === "forward") {
    if (to >= curr_value.length) {
      return DeleteEventCommand.skip;
    }
    const new_value = curr_value.slice(0, to) + curr_value.slice(to + 1);

    if (new_value.length === 0) {
      return DeleteEventCommand.self_delete_required;
    }
    this.data.value.set(new_value);
    return DeleteEventCommand.done(CaretMoveEnterEventCommand.enter(to));
  } else if (event.type === "specified") {
    const new_value = curr_value.slice(0, event.from) + curr_value.slice(to);

    if (new_value.length === 0) {
      return DeleteEventCommand.self_delete_required;
    }
    this.data.value.set(new_value);
    return DeleteEventCommand.done(CaretMoveEnterEventCommand.enter(to));
  }
}

export function handle_input(this: TextInline, event: InputEvent) {
  const curr_value = this.data.value.get();
  let to = event.to;
  if (to === ToEnd) {
    to = curr_value.length;
  }
  this.data.value.set(
    curr_value.slice(0, to) + event.value.text + curr_value.slice(to)
  );
  return InputEventCommand.done(to + event.value.text.length);
}

export class TextInline
  implements
    Inline<
      "text",
      { value: WrappedSignal<string>; tags: WrappedSignal<InlineTag[]> }
    >
{
  area_type = "inline" as const;
  type = "text" as const;
  data: { value: WrappedSignal<string>; tags: WrappedSignal<InlineTag[]> };
  slice(from: number, to: number) {
    return new TextInline(
      { value: this.data.value.get().slice(from, to) },
      this.editor
    ) as this;
  }
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
    const map: Partial<
      Record<EventPair["event"]["event_type"], (event: any) => any>
    > = {
      caret_move_enter: handle_caret_move_enter,
      delete: handle_delete,
      input: handle_input,
    } as const;

    return map[event.event_type]?.call(this, event);
  }

  constructor(data: { value: string }, public editor: MixEditor<any, any>) {
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
