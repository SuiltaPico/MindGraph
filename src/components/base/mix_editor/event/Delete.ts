import { MaybePromise } from "@/common/async";
import { BaseEvent } from "../event";
import { Area } from "../Area";

export type DeleteEventResult =
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
      /** 进入的子区域索引。 */
      to: number;
    }
  | {
      type: "self_delete_required";
    };

export const DeleteEventResult = {
  /** 删除成功，结束删除流程。 */
  done: (to: number) => ({ type: "done", to } satisfies DeleteEventResult),
  /** 跳过当前节点，让父节点处理。 */
  skip: { type: "skip" } satisfies DeleteEventResult,
  /** 进入子区域，让子区域处理。 */
  enter_child: (to: number) =>
    ({
      type: "enter_child",
      to,
    } satisfies DeleteEventResult),
  /** 需要父节点删除自己。 */
  self_delete_required: {
    type: "self_delete_required",
  } satisfies DeleteEventResult,
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
  result: MaybePromise<DeleteEventResult>;
};
