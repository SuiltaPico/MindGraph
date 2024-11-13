import { Position } from "@/common/math";
import { createSignal, WrappedSignal } from "@/common/signal";
import { onMount } from "solid-js";
import { MixEditor } from "../MixEditor";
import { Block, Inline } from "../Area";
import { PluginFactory } from "../plugin";
import { InlinesRenderer } from "../renderer/MixEditorRenderer";
import {
  BlockLoader,
  create_BlockSaveData,
  InlineSavedData,
  save_inlines,
} from "../save";
import { EventPair } from "../event";
import { CaretMoveEnterEventResult } from "../event/CaretMoveEnter";
import { ToEnd } from "../selection";
import { MixEditorMouseEvent } from "../utils/types";
import { find_ancestor_below, find_index_of_parent } from "@/common/dom";

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
  type = "paragraph" as const;
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
    if (event.event_type === "caret_move_enter") {
      const to = event.to;
      const to_left = event.direction === "left";
      if ((to_left && to === ToEnd) || (!to_left && to === 0)) {
        // 顺方向前边界进入
        return CaretMoveEnterEventResult.enter(
          to_left ? this.children_count() : 0
        );
      } else if (event.from_child) {
        // 从子区域跳入
        return CaretMoveEnterEventResult.enter(to);
      } else {
        // 从自身索引移动

        if ((to_left && to < 0) || (!to_left && to > this.children_count())) {
          // 越界则跳过
          return CaretMoveEnterEventResult.skip;
        }

        // 跳入子区域
        const actual_to = to_left ? to : to - 1;
        const child = this.get_child(actual_to);
        if (!child) return CaretMoveEnterEventResult.skip;
        return CaretMoveEnterEventResult.enter_child(actual_to);
      }
    }
  }
  constructor(public data: { inlines: WrappedSignal<TInline[]> }) {}
}

export const Paragraph = (() => {
  const loader: BlockLoader<ParagraphBlockSavedData> = async (
    block,
    editor
  ) => {
    const result = new ParagraphBlock({
      inlines: createSignal<Inline[]>([]),
    });
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
        if (index === block.children_count()) {
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

      e.mix_selection_changed = true;

      const index_in_container = find_index_of_parent(
        child_of_container,
        container!
      );

      e.preventDefault();

      console.log("collapsed_select", child_of_container, index_in_container);
      props.editor.selection.collapsed_select({
        area: block,
        child_path: index_in_container,
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
