import { createSignal } from "@/common/signal";
import { Area } from "./Area";
import {
  CaretMoveEnterEvent,
  CaretMoveEnterEventPair,
  handle_caret_move_enter_event_command
} from "./event/CaretMoveEnter";
import { CombineEventPair } from "./event/Combine";
import {
  DeleteEventPair,
  handle_delete_event_command
} from "./event/Delete";
import { EnterEventPair, handle_enter_result } from "./event/Enter";
import { MixEditor } from "./MixEditor";

export type SelectedAreaInfo = {
  area: Area;
  /** 子区域路径。 */
  child_path: number;
};
export type CollapsedSelected = {
  type: "collapsed";
  start: SelectedAreaInfo;
};

export type ExtendedSelected = {
  type: "extended";
  start: SelectedAreaInfo;
  end: SelectedAreaInfo;
};

export type Selected = CollapsedSelected | ExtendedSelected;

export const ToEnd = Infinity;

/** 选区。 */
export class Selection {
  selected = createSignal<Selected | undefined>(undefined);
  caret_height = createSignal<number>(16);

  collapsed_select(selected_area: SelectedAreaInfo) {
    this.selected.set({
      type: "collapsed",
      start: selected_area,
    });
  }

  extended_select(start_area: SelectedAreaInfo, end_area: SelectedAreaInfo) {
    this.selected.set({
      type: "extended",
      start: start_area,
      end: end_area,
    });
  }
  clear() {
    this.selected.set(undefined);
  }
  get() {
    return this.selected.get();
  }

  async enter(area: Area, to: number) {
    const result = await area.handle_event?.<EnterEventPair>({
      event_type: "enter",
      to,
    });

    return await handle_enter_result(this, result, area, to);
  }

  private async move(direction: "backward" | "forward") {
    const selected = this.selected.get();
    if (!selected) return;

    const start_info = selected.start;

    let current_area = start_info.area;

    const event: CaretMoveEnterEvent = {
      event_type: "caret_move_enter",
      direction,
      to: start_info.child_path + (direction === "backward" ? -1 : 1),
      from_child: false,
      from_parent: false,
    };

    const result = await current_area.handle_event?.<CaretMoveEnterEventPair>(
      event
    );

    return await handle_caret_move_enter_event_command(
      this,
      result,
      current_area,
      event
    );
  }

  async move_left() {
    return this.move("backward");
  }

  async move_right() {
    return this.move("forward");
  }

  /** 删除选区。 */
  async delete_selection(direction: "forward" | "backward") {
    const selected = this.selected.get();
    const editor_mode = this.editor.mode.get();
    if (!selected || editor_mode !== "edit") return;

    if (selected.type === "collapsed") {
      return await handle_delete_event_command(
        this,
        await selected.start.area.handle_event?.<DeleteEventPair>({
          event_type: "delete",
          type: direction,
          to: selected.start.child_path,
          from_child: false,
        }),
        selected.start.area,
        direction
      );
    }
  }

  constructor(public editor: MixEditor<any, any>) {}
}
