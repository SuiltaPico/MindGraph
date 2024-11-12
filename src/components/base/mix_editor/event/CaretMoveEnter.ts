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
      type: "start";
    }
  | {
      type: "end";
    };

export const CaretMoveEnterEventResult = {
  /** 不接受进入，跳过当前节点。 */
  skip: { type: "skip" } as const,
  /** 接受进入，并把光标移动到指定位置。 */
  enter: (to: number = 0) => ({ type: "enter", to } as const),
  /** 接受进入，交给此节点内部的指定节点处理。 */
  enter_child: (to: number = 0) => ({ type: "enter_child", to } as const),
};

/** 光标移入事件。 */
export interface CaretMoveEnterEvent extends BaseEvent {
  event_type: "caret_move_enter";
  direction: "left" | "right";
}

export type CaretMoveEnterEventPair = {
  event: CaretMoveEnterEvent;
  result: MaybePromise<CaretMoveEnterEventResult>;
};