import {
  CaretMoveEnterEvent,
  CaretMoveEnterEventResult,
} from "./event/CaretMoveEnter";
import { AreaContext } from "./AreaContext";
import { Block } from "./Area";
import { MixEditor } from "./MixEditor";
import { Position } from "@/common/math";
import { DeleteEventResult } from "./event/Delete";
import { MixEditorEvent } from "./event";
import { ToEnd } from "./selection";

/** 根区域。是无界的块区域。 */
export class RootArea implements Block<"root", {}> {
  type = "root" as const;
  data = {};
  save() {
    return {
      type: "root",
      data: {},
    };
  }
  children_count() {
    return this.editor.blocks.get().length;
  }
  get_child(index: number) {
    return this.editor.blocks.get()[index];
  }
  get_child_position(index: number) {
    return undefined as Position | undefined;
  }
  handle_event(event: MixEditorEvent) {
    if (event.event_type === "caret_move_enter") {
      const to = event.to;
      const to_left = event.direction === "left";
      if (event.from_child) {
        if (
          (to_left && to === 0) ||
          (!to_left && to >= this.children_count())
        ) {
          // 顺方向越后边界，则跳过
          return CaretMoveEnterEventResult.skip;
        }
        // 否则进入下一个子区域
        return CaretMoveEnterEventResult.enter_child(to_left ? to - 1 : to);
      } else {
        throw new Error(
          "根区域顶层索引约定为无界，所以不可能从根区域顶层索引进入。这可能是插件直接设置了选区导致的错误选择了根区域的索引。"
        );
      }
    } else if (event.event_type === "delete") {
      // 如果子区域请求根区域负责删除，则尝试合并子区域
      const to = event.to;
      const to_backward = event.type === "backward";

      // 跳过越界删除
      if (
        (to_backward && to === 0) ||
        (!to_backward && to >= this.children_count())
      ) {
        return DeleteEventResult.skip;
      }

      // 尝试合并前后两个子区域
      let prev_child: Block | undefined;
      let child: Block | undefined;
      if (to_backward) {
        prev_child = this.get_child(to - 1);
        child = this.get_child(to);
      } else {
        prev_child = this.get_child(to);
        child = this.get_child(to + 1);
      }

      this.editor.selection.combine_areas(
        child,
        prev_child,
        to_backward ? ToEnd : 0
      );
    }
  }
  constructor(public editor: MixEditor) {}
}
