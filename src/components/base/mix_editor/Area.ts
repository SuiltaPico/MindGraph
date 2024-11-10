import { MaybePromise } from "@/common/async";
import { Position } from "@/common/math";
import { EventPair } from "./event";
import { MaybeArea } from "./MixEditor";
import { BlockSavedData, InlineSavedData, InlineTagSavedData } from "./save";

export interface BaseArea {
  /** 生成保存数据。 */
  save: () => MaybePromise<any>;

  /** 获取子区域数量。 */
  children_count(): number;
  /** 获取指定索引的子区域。 */
  get_child(index: number): MaybeArea;
  /** 获取指定索引的子区域的位置。 */
  get_child_position(index: number): Position | void;
  
  /** 处理事件。 */
  handle_event?<TEventPair extends EventPair>(
    event: TEventPair["event"]
  ): TEventPair["result"] | void;
}

/** 块区域。 */
export interface Block<TName extends string = any, TData = any>
  extends BaseArea {
  save: () => MaybePromise<BlockSavedData>;
  type: TName;
  data: TData;
}

/** 行内区域。 */
export interface Inline<TName extends string = any, TData = any>
  extends BaseArea {
  save: () => MaybePromise<InlineSavedData>;
  type: TName;
  data: TData;
  tags: InlineTag[];
}

/** 行内标签。 */
export interface InlineTag<TName extends string = any, TData = any>
  extends BaseArea {
  save: () => MaybePromise<InlineTagSavedData>;
  type: TName;
  data: TData;
}

export type Area = Block<any, any> | Inline<any, any> | InlineTag<any, any>;
