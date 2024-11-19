import { MaybePromise } from "@/common/async";
import { Area } from "../Area";
import { BaseEvent } from "../event";
import { Selection } from "../selection";
import { find_index_in_parent_area } from "../utils/area";

export type BreakLineEventCommand =
  | {
      type: "break";
    }
  | {
      type: "no_break";
    };

export const BreakLineEventCommand = {
  /** 不接受断行。 */
  no_break: { type: "no_break" } satisfies BreakLineEventCommand,
  /** 接受断行，并把光标移动到指定位置。 */
  break: { type: "break" } satisfies BreakLineEventCommand,
};

/** 输入事件。 */
export interface BreakLineEvent extends BaseEvent {
  event_type: "break_line";
  /** 要断行的位置。 */
  to: number;
  /** 是否从子节点进入。 */
  from_child: boolean;
}

export type BreakLineEventPair = {
  event: BreakLineEvent;
  result: MaybePromise<BreakLineEventCommand>;
};

export async function handle_break_line_event_command(
  selection: Selection,
  curr_area: Area,
  command: BreakLineEventCommand | void,
  to: number
) {
  let break_points: [Area, number][] = [[curr_area, to]];
  while (true) {
    command ??= BreakLineEventCommand.no_break;

    if (command.type === "no_break") {
      // 1. 自顶向下，切割每个区域的后半区域（不含要被切割的区域）
      // 2. 自底向上，将自身补到上级的开头
      // 3. 自顶向下，递归删除被切割的区域
    } else if (command.type === "break") {
      // 让父节点处理
      const context = selection.editor.get_context(curr_area);
      if (!context?.parent) return;

      const index_in_parent = find_index_in_parent_area(
        curr_area,
        context.parent
      );

      curr_area = context.parent;
      command = await curr_area.handle_event?.<BreakLineEventPair>({
        event_type: "break_line",
        to: index_in_parent,
        from_child: true,
      });
    }
  }
}
