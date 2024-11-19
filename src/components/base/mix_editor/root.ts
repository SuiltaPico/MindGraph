import { Position } from "@/common/math";
import { Block } from "./Area";
import { MixEditorEvent } from "./event";
import {
  CaretMoveEnterEvent,
  CaretMoveEnterEventCommand,
} from "./event/CaretMoveEnter";
import {
  DeleteEvent,
  DeleteEventCommand,
  handle_delete_event_command,
} from "./event/Delete";
import { MixEditor } from "./MixEditor";
import { ToEnd } from "./selection";
import { combine_areas } from "./event/Combine";

export function handle_caret_move_enter(
  this: RootArea,
  event: CaretMoveEnterEvent
) {
  let to = event.to;
  if (to > this.children_count()) {
    to = this.children_count();
  }

  const to_left = event.direction === "backward";
  if (event.from_child) {
    if ((to_left && to === 0) || (!to_left && to >= this.children_count())) {
      // 顺方向越后边界，则跳过
      return CaretMoveEnterEventCommand.skip;
    }
    // 否则进入下一个子区域
    return CaretMoveEnterEventCommand.enter_child(to_left ? to - 1 : to);
  } else {
    throw new Error(
      "根区域顶层索引约定为无界，所以不可能从根区域顶层索引进入。这可能是插件直接设置了选区导致的错误选择了根区域的索引。"
    );
  }
}

export async function handle_delete(this: RootArea, event: DeleteEvent) {
  let to = event.to;
  if (to > this.children_count()) {
    to = this.children_count();
  }

  // 如果子区域请求根区域负责删除，则尝试合并子区域
  if (event.type === "specified") {
    const children = this.editor.blocks.get();
    children.splice(event.from, to - event.from);
    this.editor.blocks.set(children);
    return DeleteEventCommand.done(
      CaretMoveEnterEventCommand.enter(event.from)
    );
  } else {
    const to_backward = event.type === "backward";

    // 跳过越界删除
    if (
      (to_backward && to === 0) ||
      (!to_backward && to >= this.children_count())
    ) {
      return DeleteEventCommand.skip;
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

    const result = await combine_areas(
      this.editor.selection,
      child,
      prev_child,
      to_backward ? ToEnd : 0
    );

    if (result) {
      // 如果合并了子区域，则需要删除在后面的子区域
      await handle_delete_event_command(
        this.editor.selection,
        DeleteEventCommand.self_delete_required,
        child,
        "backward",
        false
      );
      return DeleteEventCommand.done();
    } else {
      return DeleteEventCommand.enter_child(to_backward ? to - 1 : to);
    }
  }
}

/** 根区域。是无界的块区域。 */
export class RootArea implements Block<"root", {}> {
  area_type = "block" as const;
  type = "root" as const;
  data = {};
  slice(from: number, to: number): this {
    throw new Error("根区域的切割未实现。");
  }
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
  async handle_event(event: MixEditorEvent) {
    const map: Partial<
      Record<MixEditorEvent["event_type"], (event: any) => any>
    > = {
      caret_move_enter: handle_caret_move_enter,
      delete: handle_delete,
    } as const;
    return await map[event.event_type]?.call(this, event);
  }
  constructor(public editor: MixEditor) {}
}
