import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";

export type CaretMoveEnterEventResult =
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

export const CaretMoveEnterEventResult = {
  /** 不接受进入，跳过当前节点。 */
  skip: { type: "skip" } satisfies CaretMoveEnterEventResult,
  /** 接受进入，并把光标移动到指定位置。 */
  enter: (to: number = 0) =>
    ({ type: "enter", to } satisfies CaretMoveEnterEventResult),
  /** 接受进入，交给此节点内部的指定节点处理。 */
  enter_child: (to: number = 0) =>
    ({ type: "enter_child", to } satisfies CaretMoveEnterEventResult),
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
}

export type CaretMoveEnterEventPair = {
  event: CaretMoveEnterEvent;
  result: MaybePromise<CaretMoveEnterEventResult>;
};
