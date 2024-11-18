import { MaybePromise } from "@/common/async";
import { Area } from "../Area";
import { BaseEvent } from "../event";
import { Selection } from "../selection";

export type BreakLineEventResult =
  | {
      type: "break";
      /** 输入的结束位置。 */
      to: number;
    }
  | {
      type: "no_break";
    };

export const BreakLineEventResult = {
  /** 不接受断行。 */
  no_break: { type: "no_break" } satisfies BreakLineEventResult,
  /** 接受断行，并把光标移动到指定位置。 */
  break: (to: number) => ({ type: "break", to } satisfies BreakLineEventResult),
};

/** 输入事件。 */
export interface BreakLineEvent extends BaseEvent {
  event_type: "break_line";
  /** 输入的位置。 */
  to: number;
}

export type BreakLineEventPair = {
  event: BreakLineEvent;
  result: MaybePromise<BreakLineEventResult>;
};