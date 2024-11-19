import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area, Inline } from "../Area";
import { Selection } from "../selection";

export type CombineEventCommand =
  | {
      type: "done";
      /** 合并的结束位置。 */
      to: number;
    }
  | {
      type: "skip";
    };

export const CombineEventCommand = {
  /** 不接受合并。 */
  skip: { type: "skip" } satisfies CombineEventCommand,
  /** 接受合并，并把光标移动到指定位置。 */
  done: (to: number) => ({ type: "done", to } satisfies CombineEventCommand),
};

/** 合并事件。 */
export interface CombineEvent extends BaseEvent {
  event_type: "combine";
  /** 要合并的区域。 */
  area: Area;
  /** 合并的结束位置。 */
  to: number;
}

export type CombineEventPair = {
  event: CombineEvent;
  result: MaybePromise<CombineEventCommand>;
};

/** 合并两个区域。 */
export async function combine_areas(
  selection: Selection,
  from_area: Area,
  to_area: Area,
  to_index: number
) {
  const selected = selection.selected.get();
  const editor_mode = selection.editor.mode.get();
  if (!selected || editor_mode !== "edit") return;

  const result = await to_area.handle_event?.<CombineEventPair>({
    event_type: "combine",
    area: from_area,
    to: to_index,
  });

  if (result?.type === "done") {
    selection.collapsed_select({
      area: to_area,
      child_path: result.to,
    });
    return true;
  }
}
