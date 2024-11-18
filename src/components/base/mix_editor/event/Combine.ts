import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area, Inline } from "../Area";

export type CombineEventResult =
  | {
      type: "done";
      /** 合并的结束位置。 */
      to: number;
    }
  | {
      type: "skip";
    };

export const CombineEventResult = {
  /** 不接受合并。 */
  skip: { type: "skip" } satisfies CombineEventResult,
  /** 接受合并，并把光标移动到指定位置。 */
  done: (to: number) => ({ type: "done", to } satisfies CombineEventResult),
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
  result: MaybePromise<CombineEventResult>;
};
