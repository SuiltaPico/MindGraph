import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area } from "../Area";
import { Selection, ToEnd } from "../selection";
import { find_index_in_parent_area } from "../utils/area";

export type CaretMoveEnterEventCommand =
  | {
      type: "skip";
    }
  | {
      type: "enter";
      to: number;
    }
  | {
      type: "enter_child";
      to: number;
    };

export const CaretMoveEnterEventCommand = {
  /** 不接受进入，跳过当前节点。 */
  skip: { type: "skip" } satisfies CaretMoveEnterEventCommand,
  /** 接受进入，并把光标移动到指定位置。 */
  enter: (to: number = 0) =>
    ({ type: "enter", to } satisfies CaretMoveEnterEventCommand),
  /** 接受进入，交给此节点内部的指定节点处理。 */
  enter_child: (to: number = 0) =>
    ({ type: "enter_child", to } satisfies CaretMoveEnterEventCommand),
};

/** 光标移入事件。 */
export interface CaretMoveEnterEvent extends BaseEvent {
  event_type: "caret_move_enter";
  /** 移动方向。 */
  direction: "backward" | "forward";
  /** 希望进入的目标索引。 */
  to: number;
  /** 是否从子节点进入。 */
  from_child: boolean;
  /** 是否从边界进入。 */
  from_parent: boolean;
}

export type CaretMoveEnterEventPair = {
  event: CaretMoveEnterEvent;
  result: MaybePromise<CaretMoveEnterEventCommand>;
};

export async function caret_move_enter_skip(
  selection: Selection,
  current_area: Area,
  direction: "backward" | "forward"
) {
  const context = selection.editor.get_context(current_area)!;
  const parent = context.parent;
  if (!parent) return;

  let index_in_parent = find_index_in_parent_area(current_area, parent);

  return {
    area: parent,
    result: await parent.handle_event?.<CaretMoveEnterEventPair>({
      event_type: "caret_move_enter",
      direction,
      to: index_in_parent + (direction === "backward" ? 0 : 1),
      from_child: true,
      from_parent: false,
    }),
    to: index_in_parent + (direction === "backward" ? 0 : 1),
    from_child: true,
    from_parent: false,
  };
}

export async function caret_move_enter_enter_child(
  selection: Selection,
  current_area: Area,
  direction: "backward" | "forward",
  index: number,
  to?: number
) {
  const child = current_area.get_child(index);
  if (!child) return;

  return {
    area: child,
    result: await child.handle_event?.<CaretMoveEnterEventPair>({
      event_type: "caret_move_enter",
      direction,
      to: to ?? (direction === "backward" ? ToEnd : 0),
      from_child: false,
      from_parent: true,
    }),
    to: to ?? (direction === "backward" ? ToEnd : 0),
    from_child: false,
    from_parent: true,
  };
}

export async function handle_caret_move_enter_event_command(
  selection: Selection,
  command: CaretMoveEnterEventCommand | void,
  current_area: Area,
  current_event: CaretMoveEnterEvent
) {
  while (true) {
    command = command || CaretMoveEnterEventCommand.skip;
    const direction = current_event.direction;
    let to = current_event.to;
    let from_child = current_event.from_child;
    let from_parent = current_event.from_parent;

    console.log(
      `move_${direction}`,
      current_area,
      command,
      to,
      from_child,
      from_parent
    );

    if (command.type === "skip") {
      const result = await caret_move_enter_skip(
        selection,
        current_area,
        direction
      );
      if (!result) return;
      current_area = result.area;
      command = result.result;
      to = result.to;
      from_child = result.from_child;
      from_parent = result.from_parent;
    } else if (command.type === "enter") {
      selection.collapsed_select({
        area: current_area,
        child_path: command.to,
      });
      return true;
    } else if (command.type === "enter_child") {
      const result = await caret_move_enter_enter_child(
        selection,
        current_area,
        direction,
        command.to
      );
      if (!result) return;
      current_area = result.area;
      command = result.result;
      to = result.to;
      from_child = result.from_child;
      from_parent = result.from_parent;
    }
  }
}
