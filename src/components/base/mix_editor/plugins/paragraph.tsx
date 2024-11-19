import { find_ancestor_below, find_index_of_parent } from "@/common/dom";
import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { Block, Inline } from "../Area";
import { EventPair } from "../event";
import {
  CaretMoveEnterEvent,
  CaretMoveEnterEventCommand,
} from "../event/CaretMoveEnter";
import { CombineEvent, CombineEventCommand } from "../event/Combine";
import { DeleteEvent, DeleteEventCommand } from "../event/Delete";
import { InputEvent, InputEventCommand } from "../event/Input";
import { MixEditor } from "../MixEditor";
import { PluginFactory } from "../plugin";
import { InlinesRenderer } from "../renderer/MixEditorRenderer";
import {
  BlockLoader,
  create_BlockSaveData,
  InlineSavedData,
  save_inlines,
} from "../save";
import { ToEnd } from "../selection";
import { for_each_area_children, MixEditorMouseEvent } from "../utils/area";
import { TextInline } from "./text";
import "./Paragraph.css";

export function handle_caret_move_enter(
  this: ParagraphBlock<any>,
  event: CaretMoveEnterEvent
) {
  const to = event.to;
  const to_backward = event.direction === "backward";
  if ((to_backward && to > this.children_count()) || (!to_backward && to < 0)) {
    // 进入，但是超出该方向的首边界时，跳转至首边界
    return CaretMoveEnterEventCommand.enter(
      to_backward ? this.children_count() : 0
    );
  } else if (event.from_child) {
    // 从子区域跳入，跳转至指定索引
    return CaretMoveEnterEventCommand.enter(to);
  } else if (event.from_parent) {
    // 从父区域跳入
    if (
      (to_backward && to < 0) ||
      (!to_backward && to > this.children_count())
    ) {
      // 超出该方向的尾边界，则跳过
      return CaretMoveEnterEventCommand.skip;
    }
    return CaretMoveEnterEventCommand.enter(to);
  } else {
    // 从自身索引移动，跳入子区域
    if (
      (to_backward && to < 0) ||
      (!to_backward && to > this.children_count())
    ) {
      // 超出该方向的尾边界，则跳过
      return CaretMoveEnterEventCommand.skip;
    }

    // 跳入子区域
    const actual_to = to_backward ? to : to - 1;
    return CaretMoveEnterEventCommand.enter_child(actual_to);
  }
}

export function handle_delete(this: ParagraphBlock<any>, event: DeleteEvent) {
  let to = event.to;
  if (to === ToEnd) {
    to = this.children_count();
  }

  if (event.type === "backward") {
    if (to === 0) {
      return DeleteEventCommand.skip;
    }
    return DeleteEventCommand.enter_child(to - 1);
  } else if (event.type === "forward") {
    if (to >= this.children_count()) {
      return DeleteEventCommand.skip;
    }
    return DeleteEventCommand.enter_child(to);
  } else if (event.type === "specified") {
    // 删除指定范围的子区域
    const from = event.from;
    const curr_children = this.data.inlines.get();
    curr_children.splice(from, to - from);
    const new_children = curr_children;
    console.log("handle_delete", from, to, new_children);
    this.data.inlines.set(new_children);
    return DeleteEventCommand.done(CaretMoveEnterEventCommand.enter(from));
  }
}

export async function handle_combine(
  this: ParagraphBlock<any>,
  event: CombineEvent
) {
  let to = event.to;
  if (to === ToEnd) {
    to = this.children_count();
  }
  const new_inlines: Inline[] = this.data.inlines.get().slice();
  for_each_area_children(event.area, (child) => {
    if (!child || child.area_type !== "inline") return;
    const child_context = this.editor.get_context(child)!;
    child_context.parent = this;
    new_inlines.push(child);
  });
  this.data.inlines.set(new_inlines);
  return CombineEventCommand.done(to);
}

export function handle_input(this: ParagraphBlock<any>, event: InputEvent) {
  const children_count = this.children_count();
  let to = event.to;
  if (to > children_count) {
    to = this.children_count();
  }

  if (to <= 0) {
    // 尝试让第一个元素接受输入
    if (children_count === 0) {
      const new_child = new TextInline(
        {
          value: "",
        },
        this.editor
      );
      this.editor.area_context.set(new_child, {
        area: new_child,
        parent: this,
      });
      this.data.inlines.set([new_child]);
      return InputEventCommand.enter_child(0, 0);
    }
    return InputEventCommand.enter_child(0, 0);
  }
  return InputEventCommand.enter_child(to - 1, ToEnd);
}

export type ParagraphBlockSavedData = {
  inlines: InlineSavedData[];
};

export class ParagraphBlock<TInline extends Inline<any, any>>
  implements
    Block<
      "paragraph",
      {
        inlines: WrappedSignal<TInline[]>;
      }
    >
{
  area_type = "block" as const;
  type = "paragraph" as const;
  slice(from: number, to: number): this {
    return new ParagraphBlock(
      {
        inlines: createSignal(this.data.inlines.get().slice(from, to), {
          equals: false,
        }),
      },
      this.editor
    ) as this;
  }
  async save() {
    return create_BlockSaveData(this.type, {
      inlines: await save_inlines(this.data.inlines.get()),
    } satisfies ParagraphBlockSavedData);
  }
  get_child(index: number) {
    return this.data.inlines.get()[index];
  }
  get_child_position(index: number): Position | void {}
  children_count() {
    return this.data.inlines.get().length;
  }
  handle_event<TEventPair extends EventPair>(
    event: TEventPair["event"]
  ): TEventPair["result"] | void {
    const map: Partial<
      Record<EventPair["event"]["event_type"], (event: any) => any>
    > = {
      caret_move_enter: handle_caret_move_enter,
      delete: handle_delete,
      input: handle_input,
      combine: handle_combine,
    } as const;

    return map[event.event_type]?.call(this, event);
  }
  constructor(
    public data: { inlines: WrappedSignal<TInline[]> },
    public editor: MixEditor<any, any>
  ) {}
}
// @ts-ignore
ParagraphBlock.prototype.area_type = "block";

export const Paragraph = (() => {
  const loader: BlockLoader<ParagraphBlockSavedData> = async (
    block,
    editor
  ) => {
    const result = new ParagraphBlock(
      {
        inlines: createSignal<Inline[]>([], { equals: false }),
      },
      editor
    );
    console.log(result.area_type);

    const inlines = await editor.saver.load_areas(
      "inline",
      block.data.inlines,
      result
    );
    result.data.inlines.set(inlines);
    return result;
  };

  const renderer = (props: {
    editor: MixEditor<any, any>;
    block: ParagraphBlock<any>;
  }) => {
    let container: HTMLElement | undefined;
    const editor = props.editor;
    const block = props.block;

    onMount(() => {
      block.get_child_position = (index) => {
        const children_count = block.children_count();
        if (index === 0) {
          const rect = container!.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top,
          };
        }
        if (index === children_count) {
          const rect = container?.children[index - 1].getBoundingClientRect();
          if (!rect) return undefined;
          return {
            x: rect.right,
            y: rect.top,
          };
        }
        const rect = container?.children[index].getBoundingClientRect();
        if (!rect) return undefined;
        return {
          x: rect.left,
          y: rect.top,
        };
      };
    });

    function handle_pointer_down(e: MixEditorMouseEvent) {
      if (e.mix_selection_changed) return;
      if (!(e.target instanceof Element)) return;

      const child_of_container = find_ancestor_below(e.target, container!);
      if (!child_of_container) return;

      const child_of_container_rect =
        child_of_container.getBoundingClientRect();

      let caret_before = true;
      if (
        e.x >
        child_of_container_rect.left + child_of_container_rect.width / 2
      ) {
        caret_before = false;
      }

      e.mix_selection_changed = true;

      const index_in_container = find_index_of_parent(
        child_of_container,
        container!
      );

      e.preventDefault();

      props.editor.selection.collapsed_select({
        area: block,
        child_path: index_in_container + (caret_before ? 0 : 1),
      });

      // TODO：需要考虑多行文本的情况，计算当前位于的行，然后取该行的高度
      props.editor.selection.caret_height.set(
        container!.getBoundingClientRect().height
      );
    }

    return (
      <p
        class="__block __paragraph"
        onPointerDown={handle_pointer_down}
        ref={(it) => (container = it)}
      >
        <InlinesRenderer editor={editor} inlines={block.data.inlines} />
      </p>
    );
  };

  return {
    loader: {
      block: {
        paragraph: loader,
      },
    },
    renderer: {
      block: {
        paragraph: renderer,
      },
    },
  };
}) satisfies PluginFactory;
