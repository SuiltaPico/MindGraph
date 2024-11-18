import { createSignal } from "@/common/signal";
import { Area } from "./Area";
import {
  CaretMoveEnterEventPair,
  CaretMoveEnterEventResult,
} from "./event/CaretMoveEnter";
import { CombineEventPair } from "./event/Combine";
import { DeleteEventPair, DeleteEventResult } from "./event/Delete";
import { EnterEventPair, handle_enter_result } from "./event/Enter";
import { MixEditor } from "./MixEditor";
import { find_index_in_parent_area } from "./utils/area";

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
    // 根据方向设置初始 to 值
    let to = start_info.child_path + (direction === "backward" ? -1 : 1);
    let from_child = false;

    while (true) {
      let command: CaretMoveEnterEventResult;
      const result = await current_area.handle_event?.<CaretMoveEnterEventPair>(
        {
          event_type: "caret_move_enter",
          direction,
          to,
          from_child,
        }
      );
      command = result || CaretMoveEnterEventResult.skip;

      console.log(`move_${direction}`, current_area, to, command, from_child);

      if (command.type === "skip") {
        const context = this.editor.get_context(current_area)!;
        const parent = context.parent;
        if (!parent) return;
        const length = parent.children_count();

        let index_in_parent = 0;
        for (; index_in_parent < length; index_in_parent++) {
          const child = parent.get_child(index_in_parent);
          if (child === current_area) break;
        }

        current_area = parent;
        // 根据方向调整父区域的 to 值
        to = index_in_parent + (direction === "backward" ? 0 : 1);
        from_child = true;
      } else if (command.type === "enter") {
        this.collapsed_select({
          area: current_area,
          child_path: command.to,
        });
        return true;
      } else if (command.type === "enter_child") {
        const child = current_area.get_child(command.to);
        if (!child) return;

        current_area = child;
        // 根据方向设置子区域的 to 值
        to = direction === "backward" ? ToEnd : 0;
        from_child = false;
      }
    }
  }

  async move_left() {
    return this.move("backward");
  }

  async move_right() {
    return this.move("forward");
  }

  async handle_delete_event_result(
    result: DeleteEventResult | void,
    current_area: Area,
    direction: any,
    handle_caret: boolean = true
  ) {
    while (true) {
      result ??= DeleteEventResult.skip;

      console.log(`delete_${direction}`, current_area, result);

      if (result.type === "done") {
        if (result.to >= 0 && handle_caret) {
          this.collapsed_select({
            area: current_area,
            child_path: result.to,
          });
        }
        return true;
      } else if (result.type === "self_delete_required") {
        const context = this.editor.get_context(current_area)!;
        const parent = context.parent;
        if (!parent) return;

        let index = find_index_in_parent_area(current_area, parent);
        if (direction === "forward") {
          index -= 1;
        }

        current_area = parent;
        result = await current_area.handle_event?.<DeleteEventPair>({
          event_type: "delete",
          type: "specified",
          from: index,
          to: index + 1,
        });
      } else if (result.type === "enter_child") {
        const child = current_area.get_child(result.to);
        if (!child) return;

        current_area = child;
        result = await current_area.handle_event?.<DeleteEventPair>({
          event_type: "delete",
          type: direction,
          to: direction === "backward" ? ToEnd : 0,
          from_child: false,
        });
      } else if (result.type === "skip") {
        const context = this.editor.get_context(current_area)!;
        const child = current_area;
        const parent = context.parent;
        if (!parent) return;

        current_area = parent;
        result = await current_area.handle_event?.<DeleteEventPair>({
          event_type: "delete",
          type: direction,
          to: find_index_in_parent_area(child, parent),
          from_child: true,
        });
      }
    }
  }

  /** 删除选区。 */
  async delete_selection(direction: "forward" | "backward") {
    const selected = this.selected.get();
    const editor_mode = this.editor.mode.get();
    if (!selected || editor_mode !== "edit") return;

    if (selected.type === "collapsed") {
      return this.handle_delete_event_result(
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

  /** 合并两个区域。 */
  async combine_areas(from_area: Area, to_area: Area, to_index: number) {
    const selected = this.selected.get();
    const editor_mode = this.editor.mode.get();
    if (!selected || editor_mode !== "edit") return;

    const result = await to_area.handle_event?.<CombineEventPair>({
      event_type: "combine",
      area: from_area,
      to: to_index,
    });

    if (result?.type === "done") {
      this.collapsed_select({
        area: to_area,
        child_path: result.to,
      });
      return true;
    }
  }

  constructor(public editor: MixEditor<any, any>) {}
}
