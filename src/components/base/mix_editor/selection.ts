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

  async move_left() {
    const selected = this.selected.get();
    if (!selected) return;

    const start_info = selected.start;

    let current_area = start_info.area;
    const entered_areas: Area[] = [];
    while (true) {
      // 对当前区域触发 caret_move_enter
      let command: CaretMoveEnterEventResult;
      const result = await current_area.handle_event?.({
        event_type: "caret_move_enter",
        direction: "left",
      });
      command = result || CaretMoveEnterEventResult.skip;

      if (command.type === "skip") {
        // 如果跳过，则离开当前区域，尝试进入上一个区域
        const child_path = start_info.child_path;
        if (child_path === 0) {
          const context = this.editor.get_context(current_area)!;
        } else {
          start_info.child_path--;
        }
      } else if (command.type === "enter") {
        // current_area = this.editor.get_area_of_path(
        //   current_area.get_path().slice(0, -1)
        // )!;
      }
    }
  }

  move_right() {
    //   const selected = this.selected.get();
    //   if (!selected) return;
    //   const start_path = selected.start_path;
    //   const last_index = start_path[start_path.length - 1];
    //   /** 需要移动到左邻近块的最后一个索引。 */
    //   if (
    //     last_index ===
    //     this.editor.get_area_of_path(start_path.slice(0, -1))?.children_count()
    //   ) {
    //   } else {
    //     start_path[start_path.length - 1]++;
    //     this.collapsed_select(start_path);
    //   }
  }

  constructor(public editor: MixEditor<any, any>) {}
}
