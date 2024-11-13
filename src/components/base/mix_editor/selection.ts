import { createSignal } from "@/common/signal";
import { MixEditor } from "./MixEditor";
import { Area } from "./Area";
import { CaretMoveEnterEventResult } from "./event/CaretMoveEnter";

export type CaretRendererType = (props: { editor: MixEditor<any, any> }) => any;

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

  private async move(direction: "left" | "right") {
    const selected = this.selected.get();
    if (!selected) return;

    const start_info = selected.start;

    let current_area = start_info.area;
    // 根据方向设置初始 to 值
    let to = start_info.child_path + (direction === "left" ? -1 : 1);
    let from_child = false;

    while (true) {
      let command: CaretMoveEnterEventResult;
      const result = await current_area.handle_event?.({
        event_type: "caret_move_enter",
        direction,
        to,
        from_child,
      });
      command = result || CaretMoveEnterEventResult.skip;

      console.log(`move_${direction}`, current_area, to, command, from_child);

      if (command.type === "skip") {
        const context = this.editor.get_context(current_area)!;
        const parent = context.parent;
        if (!parent) break;
        const length = parent.children_count();

        let index_in_parent = 0;
        for (; index_in_parent < length; index_in_parent++) {
          const child = parent.get_child(index_in_parent);
          if (child === current_area) break;
        }

        current_area = parent;
        // 根据方向调整父区域的 to 值
        to = index_in_parent + (direction === "left" ? 0 : 1);
        from_child = true;
      } else if (command.type === "enter") {
        this.collapsed_select({
          area: current_area,
          child_path: command.to,
        });
        break;
      } else if (command.type === "enter_child") {
        const child = current_area.get_child(command.to);
        if (!child) break;

        current_area = child;
        // 根据方向设置子区域的 to 值
        to = direction === "left" ? ToEnd : 0;
        from_child = false;
      }
    }
  }

  async move_left() {
    return this.move("left");
  }

  async move_right() {
    return this.move("right");
  }

  constructor(public editor: MixEditor<any, any>) {}
}
