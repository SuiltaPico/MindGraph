import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";

export type InputEventResult =
  | {
      type: "done";
      /** 输入的结束位置。 */
      to: number;
    }
  | {
      type: "skip";
    }
  | {
      type: "enter_child";
      /** 输入的结束位置。 */
      to: number;
    };

export const InputEventResult = {
  /** 不接受输入，跳过当前节点。 */
  skip: { type: "skip" } satisfies InputEventResult,
  /** 接受输入，并把光标移动到指定位置。 */
  done: (to: number) => ({ type: "done", to } satisfies InputEventResult),
  /** 接受输入，并把光标移动到指定位置。 */
  enter_child: (to: number) =>
    ({ type: "enter_child", to } satisfies InputEventResult),
};

/** 输入事件。 */
export interface InputEvent extends BaseEvent {
  event_type: "input";
  /** 输入的值。 */
  value: string;
  /** 输入的位置。 */
  to: number;
  /** 输入的剪切板数据。 */
  dataTransfer?: DataTransfer;
}

export type InputEventPair = {
  event: InputEvent;
  result: MaybePromise<InputEventResult>;
};
