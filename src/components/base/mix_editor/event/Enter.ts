import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area } from "../Area";
import { Selection } from "../selection";
import { find_index_in_parent_area } from "../utils/area";

export type EnterEventResult =
  | {
      type: "skip";
    }
  | {
      type: "done";
    };

export const EnterEventResult = {
  /** 跳过当前节点，让父节点处理。 */
  skip: { type: "skip" } satisfies EnterEventResult,
  /** 结束进入流程。 */
  done: { type: "done" } satisfies EnterEventResult,
};

/** 进入事件。 */
export interface EnterEvent extends BaseEvent {
  event_type: "enter";
  /** 进入的位置。 */
  to: number;
}

export type EnterEventPair = {
  event: EnterEvent;
  result: MaybePromise<EnterEventResult>;
};

export async function enter_to(selection: Selection, area: Area, to: number) {
  const result = await area.handle_event?.<EnterEventPair>({
    event_type: "enter",
    to,
  });

  return { result, area };
}

export async function handle_enter_result(
  selection: Selection,
  result: EnterEventResult | void,
  area: Area,
  to: number
) {
  while (true) {
    if (!result) {
      result = EnterEventResult.skip;
    }

    if (result.type === "done") {
      selection.collapsed_select({
        area,
        child_path: to,
      });
      return true;
    } else if (result.type === "skip") {
      const context = selection.editor.get_context(area);
      if (!context || !context.parent) return;

      const to_parent = find_index_in_parent_area(area, context.parent);
      const processed = await enter_to(selection, context.parent, to_parent);

      result = processed.result;
      area = processed.area;
    } else {
      break;
    }
  }
}
