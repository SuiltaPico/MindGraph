import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area } from "../Area";
import {
  CaretMoveEnterEventCommand,
  handle_caret_move_enter_event_command,
} from "./CaretMoveEnter";
import { find_index_in_parent_area } from "../utils/area";
import { Selection, ToEnd } from "../selection";

export type DeleteEventCommand =
  | {
      type: "done";
      /** 输入的结束位置。 */
      move_command?: CaretMoveEnterEventCommand;
    }
  | {
      type: "skip";
    }
  | {
      type: "enter_child";
      /** 进入的子区域索引。 */
      to: number;
    }
  | {
      type: "self_delete_required";
    };

export const DeleteEventCommand = {
  /** 删除成功，结束删除流程。 */
  done: (move_command?: CaretMoveEnterEventCommand) =>
    ({ type: "done", move_command } satisfies DeleteEventCommand),
  /** 跳过当前节点，让父节点处理。 */
  skip: { type: "skip" } satisfies DeleteEventCommand,
  /** 进入子区域，让子区域处理。 */
  enter_child: (to: number) =>
    ({
      type: "enter_child",
      to,
    } satisfies DeleteEventCommand),
  /** 需要父节点删除自己。 */
  self_delete_required: {
    type: "self_delete_required",
  } satisfies DeleteEventCommand,
};

/** 定向删除事件。通常由键盘的退格键和删除键触发。 */
export interface DirectionalDeleteEvent extends BaseEvent {
  event_type: "delete";
  /** 删除的方向。 */
  type: "forward" | "backward";
  /** 删除的位置。 */
  to: number;
  /** 是否从子区域跳入。
   *
   * 如果是，父元素可能要处理好子元素的邻接问题，例如：
   * - 根节点需要让当前锻炼和上一个段落邻接。 */
  from_child: boolean;
}

/** 指定删除事件。指定删除范围，约定为是左闭右开。 */
export interface SpecifiedDeleteEvent extends BaseEvent {
  event_type: "delete";
  type: "specified";
  from: number;
  to: number;
}

export type DeleteEvent = DirectionalDeleteEvent | SpecifiedDeleteEvent;

export type DeleteEventPair = {
  event: DeleteEvent;
  result: MaybePromise<DeleteEventCommand>;
};

export async function delete_self_delete_required(
  selection: Selection,
  current_area: Area,
  direction: "backward" | "forward"
) {
  const context = selection.editor.get_context(current_area)!;
  const parent = context.parent;
  if (!parent) return;

  let index = find_index_in_parent_area(current_area, parent);
  if (direction === "forward") {
    index -= 1;
  }

  let command = await parent.handle_event?.<DeleteEventPair>({
    event_type: "delete",
    type: "specified",
    from: index,
    to: index + 1,
  });

  return { area: parent, command };
}

export async function delete_enter_child(
  selection: Selection,
  current_area: Area,
  direction: "backward" | "forward",
  index: number,
  to?: number
) {
  const child = current_area.get_child(index);
  if (!child) return;

  current_area = child;
  const command = await current_area.handle_event?.<DeleteEventPair>({
    event_type: "delete",
    type: direction,
    to: to ?? (direction === "backward" ? ToEnd : 0),
    from_child: false,
  });

  return {
    area: child,
    command,
  };
}

export async function delete_skip(
  selection: Selection,
  current_area: Area,
  direction: "backward" | "forward"
) {
  const context = selection.editor.get_context(current_area)!;
  const child = current_area;
  const parent = context.parent;
  if (!parent) return;

  const command = await parent.handle_event?.<DeleteEventPair>({
    event_type: "delete",
    type: direction,
    to: find_index_in_parent_area(child, parent),
    from_child: true,
  });

  return {
    area: parent,
    command,
  };
}

export async function handle_delete_event_command(
  selection: Selection,
  command: DeleteEventCommand | void,
  current_area: Area,
  direction: "backward" | "forward",
  handle_caret: boolean = true
) {
  while (true) {
    command ??= DeleteEventCommand.done();

    console.log(`delete_${direction}`, current_area, command);

    if (command.type === "done") {
      if (command.move_command && handle_caret) {
        await handle_caret_move_enter_event_command(
          selection,
          command.move_command,
          current_area,
          {
            event_type: "caret_move_enter",
            direction,
            to: -1,
            from_child: false,
            from_parent: false,
          }
        );
      }
      return true;
    } else if (command.type === "self_delete_required") {
      const processed = await delete_self_delete_required(
        selection,
        current_area,
        direction
      );
      if (!processed) return;
      command = processed.command;
      current_area = processed.area;
    } else if (command.type === "enter_child") {
      const processed = await delete_enter_child(
        selection,
        current_area,
        direction,
        command.to
      );
      if (!processed) return;
      command = processed.command;
      current_area = processed.area;
    } else if (command.type === "skip") {
      const processed = await delete_skip(selection, current_area, direction);
      if (!processed) return;
      command = processed.command;
      current_area = processed.area;
    }
  }
}
